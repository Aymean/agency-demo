import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, Sparkles } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { KernelSize } from 'postprocessing'
import * as THREE from 'three'
import type { MotionValue } from 'motion/react'
import { useSceneTier, type SceneTier } from '@/lib/use-should-render-3d'

// Resolves a design token (e.g. "--accent", an oklch() value in this palette)
// to a THREE.Color. Can't hand the raw var() straight to THREE.Color:
// getComputedStyle().color is not guaranteed to normalize an oklch-defined
// color down to legacy rgb() syntax — this Chromium build returns it as a
// literal "oklch(...)" string, which THREE.Color can't parse (it silently
// falls back rather than throwing, so the materials end up on some
// default/black color and effectively vanish, no error to point at it). A 1x1
// canvas sidesteps the whole question: filling a rect always rasterizes to
// concrete 0-255 RGB bytes regardless of what color space the input was
// declared in, so reading them back is a reliable resolve no matter how the
// browser serializes computed colors.
function resolveCssColor(varName: string, fallback: string): THREE.Color {
  if (typeof document === 'undefined') return new THREE.Color(fallback)
  const probe = document.createElement('span')
  probe.style.color = `var(${varName})`
  document.body.appendChild(probe)
  const cssColor = getComputedStyle(probe).color
  document.body.removeChild(probe)

  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.Color(fallback)
  ctx.fillStyle = fallback
  ctx.fillStyle = cssColor || fallback
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return new THREE.Color(r / 255, g / 255, b / 255)
}

type ScenePalette = {
  accent: THREE.Color
  foreground: THREE.Color
}

function useScenePalette(): ScenePalette {
  return useMemo(
    () => ({
      accent: resolveCssColor('--accent', '#4fd6d6'),
      foreground: resolveCssColor('--foreground', '#f7f6f4'),
    }),
    [],
  )
}

// Enamelled housing and brushed steel armature. Deliberately not tokens: these
// are materials, not brand colour, and they only read as metal/enamel because
// of what the environment rig below puts into their reflections.
const STEEL = '#b7c0cb'
const HOUSING = '#dfe5ec'
const HOUSING_DARK = '#7f8b99'

/* The Hero centrepiece: an adjustable clinic exam light.
 *
 * Built from procedural primitives rather than a loaded model, for the same
 * reason <Environment> uses local lightformers with frames={1} — the hero's
 * chunk is already ~960KB, and a glTF would put another fetch on the critical
 * path of a decorative asset that has to work offline.
 *
 * Deliberately a general exam light — the broad dished reflector, scissor
 * armature and weighted base are common to dental, dermatology, laser and
 * general medical rooms — rather than anything specialty-specific.
 */

// Half-profile of the reflector dish, revolved by LatheGeometry. Points run
// from the centre boss outward to the rim and then back along the outer shell,
// so the dish has real thickness and a rim you can see the edge of rather than
// being an infinitely thin shell that disappears edge-on.
function reflectorProfile(radius: number): THREE.Vector2[] {
  const r = radius
  return [
    new THREE.Vector2(0, -0.02 * r),
    new THREE.Vector2(0.18 * r, -0.03 * r),
    new THREE.Vector2(0.4 * r, -0.09 * r),
    new THREE.Vector2(0.62 * r, -0.19 * r),
    new THREE.Vector2(0.82 * r, -0.32 * r),
    new THREE.Vector2(0.95 * r, -0.44 * r),
    new THREE.Vector2(1.0 * r, -0.54 * r),
    // Rim: out, back and up, giving the bezel a visible lip.
    new THREE.Vector2(1.03 * r, -0.6 * r),
    new THREE.Vector2(1.03 * r, -0.68 * r),
    new THREE.Vector2(0.98 * r, -0.7 * r),
    // Outer shell returning to the boss.
    new THREE.Vector2(0.7 * r, -0.55 * r),
    new THREE.Vector2(0.42 * r, -0.42 * r),
    new THREE.Vector2(0.16 * r, -0.34 * r),
    new THREE.Vector2(0.1 * r, -0.3 * r),
  ]
}

/* The beam's falloff.
 *
 * A cone with a single flat opacity has a hard rim where it ends, which reads
 * as the edge of a lampshade rather than as light running out. ConeGeometry's
 * uv.y runs 1 at the apex to 0 at the open base, so fading on (1 - uv.y) takes
 * the alpha to zero exactly at that rim and the edge stops existing. The
 * exponent shapes how quickly the throw dies — above 1 it stays bright near
 * the lamp and falls away faster further out, which is how a real spill looks. */
const BEAM_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const BEAM_FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    float t = 1.0 - vUv.y;
    float falloff = pow(1.0 - t, 1.6);
    gl_FragColor = vec4(uColor, uOpacity * falloff);
  }
`

function useBeamMaterial(color: THREE.Color) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
          uOpacity: { value: 0 },
          uColor: { value: color },
        },
        vertexShader: BEAM_VERTEX,
        fragmentShader: BEAM_FRAGMENT,
      }),
    [color],
  )
  useEffect(() => () => material.dispose(), [material])
  return material
}

type Layout = {
  halfW: number
  halfH: number
  /** Reflector radius; every other dimension is derived from it. */
  head: number
  segments: number
  sparkles: { count: number; scale: [number, number, number] }
}

// One centred object in both tiers — the compact variant only shrinks it and
// drops geometry/particle detail, so a phone gets the same light rather than a
// separate flat substitute. halfW/halfH are the half-extents fed to the camera
// fit below, so nothing crops at any canvas aspect ratio.
// halfW/halfH must bound the WHOLE object, beam included — the camera fit
// below frames to them, so anything they under-report simply runs off the
// canvas. Measured against the assembly: the body spans roughly +/-1.6x head
// vertically (dish top to base) and +/-1.1x horizontally.
const LAYOUTS: Record<SceneTier, Layout> = {
  full: {
    halfW: 2.4,
    halfH: 3.05,
    head: 1.72,
    segments: 64,
    sparkles: { count: 70, scale: [9, 6, 5] },
  },
  compact: {
    halfW: 2.1,
    halfH: 2.65,
    head: 1.45,
    segments: 32,
    sparkles: { count: 30, scale: [6, 6, 4] },
  },
}

/* Idle motion is a slow sway, not a full revolution.
 *
 * A reflector is a directional object: its whole point is the lit interior,
 * and a continuous 360deg spin spends half of every cycle showing the camera
 * the blank back of the dish. Swaying through a limited arc around a
 * three-quarter pose keeps the emitter and the polished inner cone facing the
 * viewer the entire time, while still reading as the object slowly turning.
 * Full rotation is still available — it's what dragging does. */
const IDLE_PERIOD = 26
const IDLE_YAW_AMPLITUDE = 0.5
// Parked slightly off head-on, so the dish reads as a three-quarter view with
// visible depth rather than as a flat circle.
const IDLE_YAW_CENTER = -0.26
const REST_TILT_X = -0.12

/* Pitch of the reflector head.
 *
 * Negative on purpose. The dish's opening faces its local -Y, and rotating
 * about +X by a POSITIVE angle carries that axis toward -Z — away from the
 * camera — so a positive tilt shows the viewer the back of the reflector and
 * hides the emitter entirely. Negative swings the opening toward +Z instead.
 * The camera also sits only ~10deg below the head, so the tilt is doing nearly
 * all the work of revealing the interior. Kept to a three-quarter angle rather
 * than head-on: swung further (tested at -0.62) the dish foreshortens into a
 * flat disc with no depth, and the beam — then pointing straight at the
 * camera — reads as a large soft disc rather than a throw of light. */
const HEAD_TILT_X = -0.26
// How far a drag can push the head off level, so it can never wind up looking
// at the back of its own base.
const PITCH_LIMIT = 0.55
// Per-frame decay applied to release velocity, and the rate the idle spin is
// blended back in once the throw has died down.
const INERTIA_DECAY = 0.94
const IDLE_RESUME = 0.4

type DragState = {
  active: boolean
  pointerId: number | null
  lastX: number
  lastY: number
  velX: number
  velY: number
  /** Accumulated yaw/pitch the user has contributed, on top of the idle spin. */
  yaw: number
  pitch: number
  engaged: boolean
}

/* Pointer-drag orbit.
 *
 * The canvas itself stays pointerEvents:'none' — it's a masked backdrop
 * sitting behind the headline, subhead, CTA and stats, and letting it capture
 * events would cost the copy its selectability and the CTA its clicks. So the
 * gesture is read at the window instead, and declined whenever it starts on
 * something that is actually interactive.
 */
function useDragOrbit(enabled: boolean) {
  const state = useRef<DragState>({
    active: false,
    pointerId: null,
    lastX: 0,
    lastY: 0,
    velX: 0,
    velY: 0,
    yaw: 0,
    pitch: 0,
    engaged: false,
  })

  useEffect(() => {
    if (!enabled) return
    const s = state.current

    function onDown(e: PointerEvent) {
      // Never steal a gesture aimed at real UI.
      if (e.target instanceof Element && e.target.closest('a, button, input, textarea, select, [role="dialog"], [data-cursor="link"]')) {
        return
      }
      // Only the hero's own area is a drag surface; below the fold the object
      // is scrolled away and dragging it would be meaningless.
      const hero = document.getElementById('top')
      if (!hero) return
      const rect = hero.getBoundingClientRect()
      if (e.clientY < rect.top || e.clientY > rect.bottom) return

      s.active = true
      s.pointerId = e.pointerId
      s.lastX = e.clientX
      s.lastY = e.clientY
      s.velX = 0
      s.velY = 0
      s.engaged = e.pointerType === 'mouse'
    }

    function onMove(e: PointerEvent) {
      if (!s.active || e.pointerId !== s.pointerId) return
      const dx = e.clientX - s.lastX
      const dy = e.clientY - s.lastY

      // Touch only commits once the gesture is clearly horizontal. Anything
      // else is someone trying to scroll the page, and taking it would make
      // the hero a dead zone on every phone.
      if (!s.engaged) {
        if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) s.engaged = true
        else if (Math.abs(dy) > 8) {
          s.active = false
          return
        }
      }
      if (!s.engaged) return

      s.lastX = e.clientX
      s.lastY = e.clientY
      s.velX = dx * 0.005
      s.velY = dy * 0.005
      s.yaw += s.velX
      s.pitch = THREE.MathUtils.clamp(s.pitch + s.velY, -PITCH_LIMIT, PITCH_LIMIT)
    }

    function onUp(e: PointerEvent) {
      if (e.pointerId !== s.pointerId) return
      s.active = false
      s.pointerId = null
      s.engaged = false
    }

    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [enabled])

  return state
}

function ExamLight({
  scrollProgress,
  introProgress,
  palette,
  layout,
  tier,
}: {
  scrollProgress: MotionValue<number>
  introProgress: MotionValue<number>
  palette: ScenePalette
  layout: Layout
  tier: SceneTier
}) {
  const root = useRef<THREE.Group>(null)
  const spot = useRef<THREE.SpotLight>(null)
  const spotTarget = useRef<THREE.Object3D>(null)
  const emitterMat = useRef<THREE.MeshBasicMaterial>(null!)
  const glowMat = useRef<THREE.MeshBasicMaterial>(null!)
  const housingMat = useRef<THREE.MeshStandardMaterial>(null!)
  const innerMat = useRef<THREE.MeshStandardMaterial>(null!)
  const steelMat = useRef<THREE.MeshStandardMaterial>(null!)

  const head = layout.head
  const seg = layout.segments
  const compact = tier === 'compact'

  const beamMaterial = useBeamMaterial(palette.foreground)

  const dishGeometry = useMemo(
    () => new THREE.LatheGeometry(reflectorProfile(head), seg),
    [head, seg],
  )
  useEffect(() => () => dishGeometry.dispose(), [dishGeometry])

  const drag = useDragOrbit(!compact)
  const pointer = useRef({ x: 0, y: 0 })
  const clockStart = useRef<number | null>(null)

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = e.clientX / window.innerWidth - 0.5
      pointer.current.y = e.clientY / window.innerHeight - 0.5
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  // The spotlight needs an explicit target object in the scene graph, or three
  // aims it at the world origin regardless of how the head is posed.
  useEffect(() => {
    if (spot.current && spotTarget.current) spot.current.target = spotTarget.current
  }, [])

  useFrame((state, delta) => {
    const g = root.current
    if (!g) return
    if (clockStart.current === null) clockStart.current = state.clock.elapsedTime
    const elapsed = state.clock.elapsedTime - clockStart.current
    const p = scrollProgress.get()
    const intro = introProgress.get()
    const d = drag.current

    if (!d.active) {
      // Coast on release, then hand back to the idle spin. Tracking the coast
      // as an offset rather than writing it into yaw keeps the ambient
      // rotation continuous underneath instead of restarting from the throw.
      d.yaw += d.velX
      d.pitch = THREE.MathUtils.clamp(d.pitch + d.velY, -PITCH_LIMIT, PITCH_LIMIT)
      d.velX *= INERTIA_DECAY
      d.velY *= INERTIA_DECAY
      if (Math.abs(d.velX) < 0.0002) d.velX = 0
      if (Math.abs(d.velY) < 0.0002) d.velY = 0
      // Ease the user's own pitch contribution back toward level so the object
      // always returns to a presentable pose if left alone.
      d.pitch = THREE.MathUtils.lerp(d.pitch, 0, IDLE_RESUME * delta)
    }

    const idleYaw = IDLE_YAW_CENTER + Math.sin((elapsed / IDLE_PERIOD) * Math.PI * 2) * IDLE_YAW_AMPLITUDE
    g.rotation.y = idleYaw + d.yaw + pointer.current.x * 0.18
    g.rotation.x = THREE.MathUtils.lerp(
      g.rotation.x,
      REST_TILT_X + d.pitch - pointer.current.y * 0.12,
      0.08,
    )
    g.position.y = Math.sin(elapsed * 0.3) * 0.06 - p * 2.6
    g.scale.setScalar(THREE.MathUtils.lerp(1, 0.58, p))

    const fade = 1 - Math.min(p * 1.3, 1)

    // Power-on. `introProgress` is the same motion value the old object used
    // for its scan-resolve, retimed here as the lamp coming up: the head sits
    // dark and metallic, then the emitter, the spill and the beam all rise
    // together. A shallow flutter on top keeps it from looking like a static
    // emissive texture once it's fully on.
    const flutter = 0.97 + 0.03 * Math.sin(elapsed * 1.7)
    const power = intro * flutter

    if (emitterMat.current) emitterMat.current.opacity = (0.35 + 0.65 * power) * fade
    if (glowMat.current) glowMat.current.opacity = 0.72 * power * fade
    beamMaterial.uniforms.uOpacity.value = 0.2 * power * fade
    if (spot.current) spot.current.intensity = 17 * power * fade
    if (housingMat.current) housingMat.current.opacity = fade
    if (innerMat.current) {
      innerMat.current.opacity = fade
      // The dish interior picks up its own bounce as the lamp comes up.
      innerMat.current.emissiveIntensity = 0.55 + 2.4 * power
    }
    if (steelMat.current) steelMat.current.opacity = fade
  })

  const armThickness = head * 0.085

  return (
    <group ref={root} position={[0, -head * 0.15, 0]}>
      {/* Head: reflector dish, emitter, and the beam it throws. Tilted so the
          light points down and forward, the way an exam light is actually
          posed over a chair. */}
      <group position={[0, head * 0.95, head * 0.15]} rotation={[HEAD_TILT_X, 0, 0]}>
        {/* Outer shell. Enamelled, not chromed: at high metalness the housing
            has almost no albedo of its own and simply mirrors a deliberately
            dark environment, which rendered the whole lamp as a black
            silhouette. Dropping metalness lets the off-white actually show. */}
        <mesh geometry={dishGeometry}>
          <meshStandardMaterial
            ref={housingMat}
            color={HOUSING}
            metalness={0.25}
            roughness={0.42}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>

        {/* Polished inner cone, inset just inside the shell so the dish reads
            as lined rather than as a single-skinned bowl. */}
        <mesh position={[0, -head * 0.16, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[head * 0.9, head * 0.5, seg, 1, true]} />
          <meshStandardMaterial
            ref={innerMat}
            color={HOUSING}
            metalness={0.9}
            roughness={0.12}
            emissive={palette.foreground}
            emissiveIntensity={0.55}
            side={THREE.BackSide}
            transparent
          />
        </mesh>

        {/* Rim band — the machined bezel edge. Iridescent rather than a flat
            metal, so the one hard edge in the whole object catches a
            thin-film colour shift as it turns — the Active Theory reference's
            chromatic ring is doing the same job on its hero object, and this
            is the one surface here small and simple enough to take it
            without fighting the "no black silhouette" reasoning on the main
            housing above. */}
        <mesh position={[0, -head * 0.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[head * 1.02, head * 0.028, 8, seg]} />
          <meshPhysicalMaterial
            color={HOUSING_DARK}
            metalness={0.9}
            roughness={0.3}
            iridescence={1}
            iridescenceIOR={1.3}
            iridescenceThicknessRange={[100, 400]}
          />
        </mesh>

        {/* The emitter itself. toneMapped={false} so Bloom treats it as a real
            source rather than a bright grey disc. */}
        <mesh position={[0, -head * 0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[head * 0.62, seg]} />
          <meshBasicMaterial
            ref={emitterMat}
            color={palette.foreground}
            transparent
            opacity={0.25}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Soft spill just under the emitter, tinted to the brand accent — the
            one place the light picks up colour. */}
        <mesh position={[0, -head * 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[head * 0.92, seg]} />
          <meshBasicMaterial
            ref={glowMat}
            color={palette.accent}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* The beam. An open cone, additive and depth-write-off so it layers
            rather than occludes. Kept faint: it sits behind body copy under
            the hero's dimming mask, where anything stronger fights the text. */}
        <mesh position={[0, -head * 0.85, 0]}>
          <coneGeometry args={[head * 0.72, head * 1.1, compact ? 24 : 48, 1, true]} />
          <primitive object={beamMaterial} attach="material" />
        </mesh>

        {/* A real light, so the armature and base below are actually lit by the
            lamp instead of merely appearing to be. */}
        <spotLight
          ref={spot}
          position={[0, -head * 0.34, 0]}
          angle={0.5}
          penumbra={0.8}
          distance={head * 14}
          decay={1.4}
          intensity={0}
          color={palette.foreground}
        />
        <object3D ref={spotTarget} position={[0, -head * 6, 0]} />

        {/* Yoke: the knuckle the head pivots on. */}
        <mesh position={[0, head * 0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[armThickness * 0.9, armThickness * 0.9, head * 0.46, compact ? 12 : 20]} />
          <meshStandardMaterial color={HOUSING_DARK} metalness={0.85} roughness={0.35} />
        </mesh>
      </group>

      {/* Armature: two segments at an asymmetric fold, so the light reads as
          adjustable from any angle rather than as a fixed sculpture. */}
      <Arm
        from={[0, head * 0.9, head * 0.12]}
        to={[-head * 0.75, head * 0.1, -head * 0.1]}
        thickness={armThickness}
        segments={compact ? 8 : 16}
        materialRef={steelMat}
      />
      <Arm
        from={[-head * 0.75, head * 0.1, -head * 0.1]}
        to={[0, -head * 0.95, -head * 0.05]}
        thickness={armThickness * 0.92}
        segments={compact ? 8 : 16}
      />

      {/* Joints. */}
      <Joint position={[0, head * 0.9, head * 0.12]} radius={armThickness * 1.35} segments={compact ? 10 : 18} />
      <Joint position={[-head * 0.75, head * 0.1, -head * 0.1]} radius={armThickness * 1.5} segments={compact ? 10 : 18} />

      {/* Post and weighted base. */}
      <mesh position={[0, -head * 1.15, -head * 0.05]}>
        <cylinderGeometry args={[armThickness * 1.15, armThickness * 1.4, head * 0.45, compact ? 12 : 24]} />
        <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, -head * 1.4, -head * 0.05]}>
        <cylinderGeometry args={[head * 0.62, head * 0.7, head * 0.11, compact ? 20 : 48]} />
        <meshStandardMaterial color={HOUSING_DARK} metalness={0.8} roughness={0.35} />
      </mesh>
    </group>
  )
}

/** A single armature segment, oriented to span two points. Cylinders are
 *  built along +Y, so each one is placed at the midpoint and then rotated to
 *  the direction vector — cheaper and steadier than posing a joint chain by
 *  hand-tuned Euler angles. */
function Arm({
  from,
  to,
  thickness,
  segments,
  materialRef,
}: {
  from: [number, number, number]
  to: [number, number, number]
  thickness: number
  segments: number
  materialRef?: React.RefObject<THREE.MeshStandardMaterial>
}) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from)
    const b = new THREE.Vector3(...to)
    const dir = new THREE.Vector3().subVectors(b, a)
    const len = dir.length()
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    )
    return { position: new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5), quaternion: q, length: len }
  }, [from, to])

  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[thickness, thickness, length, segments]} />
      <meshStandardMaterial
        ref={materialRef as never}
        color={STEEL}
        metalness={0.92}
        roughness={0.26}
        transparent
      />
    </mesh>
  )
}

function Joint({
  position,
  radius,
  segments,
}: {
  position: [number, number, number]
  radius: number
  segments: number
}) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, segments, segments]} />
      <meshStandardMaterial color={HOUSING_DARK} metalness={0.9} roughness={0.28} />
    </mesh>
  )
}

const FRAME_MARGIN = 1.08
const MIN_DIST = 8
// Tall/narrow viewports need a much longer pull-back to fit the object's width.
const MAX_DIST = 40

function ResponsiveCamera({ halfW, halfH }: { halfW: number; halfH: number }) {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera
  const size = useThree((state) => state.size)

  useEffect(() => {
    if (!size.width || !size.height) return
    const aspect = size.width / size.height
    const halfTan = Math.tan((camera.fov * Math.PI) / 360)
    const distForHeight = halfH / halfTan
    const distForWidth = halfW / (halfTan * aspect)
    const dist = THREE.MathUtils.clamp(Math.max(distForHeight, distForWidth) * FRAME_MARGIN, MIN_DIST, MAX_DIST)
    camera.position.z = dist
    camera.updateProjectionMatrix()
  }, [camera, size.width, size.height, halfW, halfH])

  return null
}

export function HeroScene({
  scrollProgress,
  introProgress,
  onReady,
}: {
  scrollProgress: MotionValue<number>
  introProgress: MotionValue<number>
  /** Fired once the renderer exists, so the hero can time its intro to a scene
   *  that is actually on screen rather than to its own mount. */
  onReady?: () => void
}) {
  const palette = useScenePalette()
  const tier = useSceneTier()
  const compact = tier === 'compact'
  const layout = LAYOUTS[tier]

  return (
    <Canvas
      // Phones stay at dpr 1 — the scene is a soft, masked backdrop, so the
      // extra pixels buy nothing and cost the most on exactly the devices
      // least able to pay. MSAA is dropped there too; Bloom softens the edges.
      dpr={compact ? 1 : [1, 1.5]}
      camera={{ position: [0, 0, 9.5], fov: 38 }}
      gl={{ alpha: true, antialias: !compact, powerPreference: 'high-performance' }}
      // Stays 'none' even though the object is draggable. The drag is read at
      // the window instead (see useDragOrbit) precisely so this canvas can go
      // on ignoring pointer events — it spans the whole hero behind the
      // headline, subhead, CTA and stats, and the moment it accepts events
      // that copy stops being selectable and the CTA stops being clickable.
      style={{ pointerEvents: 'none' }}
      // three.js's WebGLProgram defaults `debug.checkShaderErrors` to true even
      // in production builds. That flag gates a call to
      // `gl.getProgramParameter(program, gl.LINK_STATUS)` after every single
      // `linkProgram()` — and that specific call is a synchronous GPU sync
      // point: it forces the JS thread to block until the driver has actually
      // finished compiling+linking, rather than letting compilation happen
      // off-thread the way WebGL drivers with KHR_parallel_shader_compile
      // support can. Profiled directly (CPU profile + PerformanceObserver
      // longtask entries on a fresh load of the production build): this scene
      // compiles 10+ distinct programs (the exam light's several
      // meshStandardMaterials, the beam's ShaderMaterial, Environment's
      // lightformers, Bloom's EffectComposer passes) on first render, and the
      // profile's single hottest frame by a wide margin was this exact
      // function (three's `checkLinkStatus`), coinciding with a ~1.6-1.7s
      // long task right when the object is supposed to become visible.
      // Skipped only in production: dev keeps real-time shader error
      // reporting, which is genuinely useful while iterating on the GLSL
      // above and costs nothing there since it's not the path being measured
      // for time-to-visible.
      onCreated={(state) => {
        if (import.meta.env.PROD) state.gl.debug.checkShaderErrors = false
        onReady?.()
      }}
    >
      <ResponsiveCamera halfW={layout.halfW} halfH={layout.halfH} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 5]} intensity={1.5} />
      <directionalLight position={[-5, -2, -4]} intensity={0.6} color={palette.accent} />

      {/* Metal needs something to reflect. This environment is built from local
          lightformers and rendered exactly once (frames={1}) — no HDRI fetch,
          so it works offline and costs one cube render at mount. */}
      <Environment resolution={compact ? 32 : 96} frames={1}>
        <color attach="background" args={['#0a0d12']} />
        <Lightformer
          form="rect"
          intensity={2.4}
          color="#e9eff7"
          position={[0, 4, 3]}
          rotation={[-Math.PI / 3, 0, 0]}
          scale={[9, 3, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.1}
          color="#8fa6bb"
          position={[-5, 0, 2]}
          rotation={[0, Math.PI / 3, 0]}
          scale={[3, 7, 1]}
        />
        <Lightformer form="circle" intensity={1.6} color={palette.accent} position={[4, -3, 3]} scale={3} />
      </Environment>

      <ExamLight
        scrollProgress={scrollProgress}
        introProgress={introProgress}
        palette={palette}
        layout={layout}
        tier={tier}
      />

      {/* Two layers rather than one: a denser, brighter foreground-coloured
          field plus a sparser accent-tinted one behind it. A single tint read
          as a flat dust layer at the reference's density; splitting the
          colour across two populations is what gives the Active Theory-style
          field its bokeh variety without any actual depth-of-field pass. */}
      <Sparkles
        count={layout.sparkles.count}
        scale={layout.sparkles.scale}
        size={1.6}
        speed={0.2}
        opacity={0.55}
        color={palette.foreground}
      />
      <Sparkles
        count={Math.round(layout.sparkles.count * 0.4)}
        scale={layout.sparkles.scale}
        size={2.2}
        speed={0.12}
        opacity={0.35}
        color={palette.accent}
      />

      <EffectComposer enableNormalPass={false} multisampling={compact ? 0 : 8}>
        <Bloom
          luminanceThreshold={0.5}
          luminanceSmoothing={0.9}
          intensity={compact ? 0.3 : 0.4}
          mipmapBlur
          kernelSize={compact ? KernelSize.SMALL : KernelSize.LARGE}
        />
      </EffectComposer>
    </Canvas>
  )
}
