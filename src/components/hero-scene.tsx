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

// Brushed titanium. Deliberately not a token: this is a material, not brand
// colour, and it only reads as metal because of what the environment below
// puts into its reflections.
const TITANIUM = '#b3bdc9'

const TICK_VERTEX = /* glsl */ `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// The engraved caliper scale around the instrument's circumference, and the
// intro beat that lights it.
//
// This is the same glitch-to-resolve choreography the browser-mockup panels
// used, moved from cartesian into polar: identical uniform set (uProgress /
// uTime / uFade / uAccent / uForeground), identical hash-jitter flicker while
// unresolved, identical "each cell has its own threshold along uProgress"
// reveal. The only real change is that the threshold is now a tick's angle
// rather than a grid cell's hash, which turns the staggered reveal into a scan
// sweeping once around the dial and lighting each mark as it passes.
const TICK_FRAGMENT = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform float uFade;
  uniform float uInner;
  uniform float uOuter;
  uniform vec3 uAccent;
  uniform vec3 uForeground;
  varying vec2 vPos;

  const float PI = 3.14159265359;
  const float TICKS = 72.0;

  float hash(float p) {
    return fract(sin(p * 78.233) * 43758.5453);
  }

  void main() {
    float r = length(vPos);
    float band = clamp((r - uInner) / (uOuter - uInner), 0.0, 1.0);

    // 0..1 clockwise from 12 o'clock, so the sweep starts where a gauge would.
    float t = fract((atan(vPos.x, vPos.y) / (2.0 * PI)) + 1.0);

    float idx = floor(t * TICKS);
    float cell = fract(t * TICKS);
    float major = step(mod(idx, 6.0), 0.5);

    // Majors run deeper into the band and sit a touch wider, like a caliper's
    // labelled divisions against its minor graduations.
    float len = mix(0.42, 0.92, major);
    float halfWidth = mix(0.13, 0.2, major);
    float d = abs(cell - 0.5) * 2.0;
    // Hung inward from the outer edge, so every graduation meets the rule.
    float mark = (1.0 - smoothstep(halfWidth, halfWidth + 0.09, d)) * step(1.0 - len, band);

    // Hairline rule at the outer edge of the scale, always present.
    float rule = 1.0 - smoothstep(0.0, 0.055, abs(band - 1.0));

    float lit = smoothstep(uProgress + 0.015, uProgress - 0.015, t);
    float edge = smoothstep(0.07, 0.0, abs(t - uProgress)) * (1.0 - step(1.0, uProgress));

    // Unlit marks jitter, exactly as the unresolved panel cells used to.
    float flicker = mix(0.45, 1.0, step(0.5, hash(idx + floor(uTime * 6.0))));
    float breathe = 0.94 + 0.06 * sin(uTime * 0.9 + idx * 0.2);

    vec3 dim = uForeground * 0.32;
    vec3 color = mix(dim, uAccent, max(lit, edge));

    float alpha = mark * mix(0.26 * flicker, 0.92 * breathe, lit);
    alpha += mark * edge * 0.85;
    alpha += rule * mix(0.12, 0.4, lit) * 0.6;

    gl_FragColor = vec4(color, alpha * uFade);
  }
`

function useTickMaterial(accent: THREE.Color, foreground: THREE.Color, inner: number, outer: number) {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          uProgress: { value: 0 },
          uTime: { value: 0 },
          uFade: { value: 1 },
          uInner: { value: inner },
          uOuter: { value: outer },
          uAccent: { value: accent },
          uForeground: { value: foreground },
        },
        vertexShader: TICK_VERTEX,
        fragmentShader: TICK_FRAGMENT,
      }),
    [accent, foreground, inner, outer],
  )
}

type Layout = {
  halfW: number
  halfH: number
  /** Outer radius of the main ring; everything else is derived from it. */
  ring: number
  segments: [number, number]
  sparkles: { count: number; scale: [number, number, number] }
}

// One centred object in both tiers — the compact variant only shrinks it and
// drops geometry/particle detail, so a phone gets the same instrument rather
// than a separate flat substitute. halfW/halfH are the half-extents fed to the
// camera fit below, so nothing crops at any canvas aspect ratio.
const LAYOUTS: Record<SceneTier, Layout> = {
  full: {
    halfW: 3.5,
    halfH: 3.1,
    ring: 2.5,
    segments: [16, 128],
    sparkles: { count: 26, scale: [9, 6, 5] },
  },
  compact: {
    halfW: 2.75,
    halfH: 2.75,
    ring: 2.05,
    segments: [10, 72],
    sparkles: { count: 12, scale: [6, 6, 4] },
  },
}

// Slow enough to read as an instrument idling rather than a spinning logo.
const NEEDLE_PERIOD = 10.5
const DIAL_PERIOD = 38
const REST_TILT_X = -0.16

function Instrument({
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
  const dial = useRef<THREE.Group>(null)
  const needle = useRef<THREE.Group>(null)
  const rimMat = useRef<THREE.MeshBasicMaterial>(null!)
  const metalMat = useRef<THREE.MeshStandardMaterial>(null!)
  const hairlineMat = useRef<THREE.MeshStandardMaterial>(null!)
  const glassMat = useRef<THREE.MeshPhysicalMaterial>(null!)
  const tipMat = useRef<THREE.MeshBasicMaterial>(null!)

  const ring = layout.ring
  const tickInner = ring * 0.78
  const tickOuter = ring * 0.94
  const tickMat = useTickMaterial(palette.accent, palette.foreground, tickInner, tickOuter)

  // Same pointer plumbing the mockup panel used, feeding a parallax tilt rather
  // than any new interaction system: the magnetic cursor already teaches the
  // page that things lean toward the pointer, and this just joins in.
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

  useFrame((state) => {
    const g = root.current
    if (!g) return
    if (clockStart.current === null) clockStart.current = state.clock.elapsedTime
    const elapsed = state.clock.elapsedTime - clockStart.current
    const p = scrollProgress.get()
    const intro = introProgress.get()

    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, pointer.current.x * 0.34, 0.045)
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, REST_TILT_X - pointer.current.y * 0.2, 0.045)
    g.position.y = Math.sin(elapsed * 0.3) * 0.06 - p * 2.6
    g.scale.setScalar(THREE.MathUtils.lerp(1, 0.58, p))

    if (dial.current) dial.current.rotation.z = -(elapsed / DIAL_PERIOD) * Math.PI * 2

    if (needle.current) {
      // Barely moves while the scan is still running, then eases up to its full
      // revolution as the instrument finishes calibrating — scaling the ambient
      // angle by intro spins it up smoothly without a second timeline to keep
      // in sync with the shader's.
      const target = -(elapsed / NEEDLE_PERIOD) * Math.PI * 2 * intro - pointer.current.x * 0.3
      needle.current.rotation.z = THREE.MathUtils.lerp(needle.current.rotation.z, target, 0.12)
    }

    const fade = 1 - Math.min(p * 1.3, 1)

    tickMat.uniforms.uProgress.value = intro
    tickMat.uniforms.uTime.value = state.clock.elapsedTime
    tickMat.uniforms.uFade.value = fade

    // Active-scan indicator: a shallow pulse, brightest while the sweep is
    // still running, so the rim reads as powered rather than decorative.
    const pulse = 0.3 + 0.14 * Math.sin(elapsed * 1.5) + (1 - intro) * 0.18
    if (rimMat.current) rimMat.current.opacity = pulse * fade
    if (tipMat.current) tipMat.current.opacity = (0.55 + 0.3 * Math.sin(elapsed * 1.5)) * fade
    if (metalMat.current) metalMat.current.opacity = fade
    if (hairlineMat.current) hairlineMat.current.opacity = 0.75 * fade
    if (glassMat.current) glassMat.current.opacity = 0.16 * fade
  })

  const [radialSeg, tubularSeg] = layout.segments

  return (
    <group ref={root}>
      <group ref={dial}>
        {/* Loupe body: the one heavy form in the composition. */}
        <mesh>
          <torusGeometry args={[ring, ring * 0.052, radialSeg, tubularSeg]} />
          <meshStandardMaterial
            ref={metalMat}
            color={TITANIUM}
            metalness={0.95}
            roughness={0.31}
            transparent
          />
        </mesh>

        {/* Emissive rim light sitting just inside the body — additive so Bloom
            reads it as a glow rather than a painted-on ring. */}
        <mesh>
          <torusGeometry args={[ring * 0.965, ring * 0.014, 8, tubularSeg]} />
          <meshBasicMaterial
            ref={rimMat}
            color={palette.accent}
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* Engraved caliper scale. */}
        <mesh position={[0, 0, 0.03]}>
          <ringGeometry args={[tickInner, tickOuter, 160]} />
          <primitive object={tickMat} attach="material" />
        </mesh>

        {/* Outer hairline, the way a machined bezel has a shoulder. */}
        <mesh>
          <torusGeometry args={[ring * 1.1, ring * 0.006, 6, tubularSeg]} />
          <meshStandardMaterial
            ref={hairlineMat}
            color={TITANIUM}
            metalness={0.9}
            roughness={0.4}
            transparent
            opacity={0.75}
          />
        </mesh>

        {/* Frosted lens. Kept as a plain translucent surface rather than real
            transmission: transmission costs a render target every frame, and
            this sits behind body copy at a third of its alpha, where nobody
            will ever see the difference. */}
        <mesh position={[0, 0, -0.02]}>
          <circleGeometry args={[tickInner * 0.99, 96]} />
          <meshPhysicalMaterial
            ref={glassMat}
            color="#9fb4c6"
            roughness={0.55}
            metalness={0.05}
            clearcoat={0.6}
            clearcoatRoughness={0.4}
            transparent
            opacity={0.16}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      <group ref={needle}>
        <mesh position={[0, ring * 0.38, 0.09]}>
          <boxGeometry args={[ring * 0.022, ring * 0.76, ring * 0.018]} />
          <meshStandardMaterial color={TITANIUM} metalness={0.92} roughness={0.28} />
        </mesh>
        {/* Counterweight — what makes it read as a balanced instrument needle
            instead of a clock hand. */}
        <mesh position={[0, -ring * 0.13, 0.09]}>
          <boxGeometry args={[ring * 0.038, ring * 0.2, ring * 0.028]} />
          <meshStandardMaterial color={TITANIUM} metalness={0.92} roughness={0.34} />
        </mesh>
        <mesh position={[0, ring * 0.77, 0.09]}>
          <boxGeometry args={[ring * 0.03, ring * 0.06, ring * 0.03]} />
          <meshBasicMaterial
            ref={tipMat}
            color={palette.accent}
            transparent
            opacity={0.7}
            toneMapped={false}
          />
        </mesh>
      </group>

      <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[ring * 0.062, ring * 0.062, ring * 0.05, tier === 'compact' ? 16 : 32]} />
        <meshStandardMaterial color={TITANIUM} metalness={0.95} roughness={0.24} />
      </mesh>
    </group>
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
      style={{ pointerEvents: 'none' }}
      onCreated={() => onReady?.()}
    >
      <ResponsiveCamera halfW={layout.halfW} halfH={layout.halfH} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} />
      <directionalLight position={[-5, -2, -4]} intensity={0.5} color={palette.accent} />

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

      <Instrument
        scrollProgress={scrollProgress}
        introProgress={introProgress}
        palette={palette}
        layout={layout}
        tier={tier}
      />

      <Sparkles
        count={layout.sparkles.count}
        scale={layout.sparkles.scale}
        size={1.2}
        speed={0.2}
        opacity={0.28}
        color={palette.foreground}
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
