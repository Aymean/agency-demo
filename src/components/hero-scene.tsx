import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { RoundedBox, Sparkles } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import type { MotionValue } from 'motion/react'

// Resolves a design token (e.g. "--signal", possibly an oklch() value) to a
// THREE.Color by letting the browser's own CSS engine normalize it to rgb()
// via a throwaway element, rather than duplicating the palette as hex/vec3
// literals in this file.
function resolveCssColor(varName: string, fallback: string): THREE.Color {
  if (typeof document === 'undefined') return new THREE.Color(fallback)
  const probe = document.createElement('span')
  probe.style.color = `var(${varName})`
  document.body.appendChild(probe)
  const rgb = getComputedStyle(probe).color
  document.body.removeChild(probe)
  return new THREE.Color(rgb || fallback)
}

type ScenePalette = {
  signal: THREE.Color
  foreground: THREE.Color
  card: THREE.Color
}

function useScenePalette(): ScenePalette {
  return useMemo(
    () => ({
      signal: resolveCssColor('--signal', '#3fa06a'),
      foreground: resolveCssColor('--foreground', '#f7f6f4'),
      card: resolveCssColor('--card', '#141414'),
    }),
    [],
  )
}

const SCREEN_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Renders the "site" on a panel's screen as a grid of wireframe blocks that
// glitch-flicker where unresolved and snap into clean, aligned content
// blocks (one highlighted, like a CTA button) as uProgress sweeps 0 -> 1.
// This is the literal "we build the better version of your website" beat.
// Colors come in as uniforms (uAccent = --signal, uForeground = --foreground)
// so the shader stays on the same palette as the rest of the page.
const SCREEN_FRAGMENT = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform float uFade;
  uniform vec3 uAccent;
  uniform vec3 uForeground;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 grid = vUv * vec2(7.0, 9.0);
    vec2 cellId = floor(grid);
    vec2 cellUv = fract(grid);

    float id = hash(cellId);
    float threshold = id * 0.85;
    float revealed = smoothstep(threshold - 0.06, threshold + 0.06, uProgress);

    float mx = 0.14;
    float my = 0.24;
    float isWide = step(0.85, hash(cellId + 31.0));
    float narrow = step(mx, cellUv.x) * step(cellUv.x, 1.0 - mx) * step(my, cellUv.y) * step(cellUv.y, 1.0 - my);
    float wide = step(0.05, cellUv.x) * step(cellUv.x, 0.95) * step(my, cellUv.y) * step(cellUv.y, 1.0 - my);
    float block = mix(narrow, wide, isWide);

    float isAccent = step(0.93, hash(cellId + 11.0));

    float jitterSeed = floor(uTime * 5.0 + id * 12.0);
    float glitchOn = step(0.5, hash(cellId + jitterSeed));

    vec3 baseColor = uForeground;
    vec3 blockColor = mix(baseColor, uAccent, isAccent * 0.85);
    vec3 glitchColor = uForeground * 0.38;

    vec3 color = mix(glitchColor, blockColor, revealed);
    float alpha = block * mix(glitchOn * 0.32, 0.95, revealed);

    gl_FragColor = vec4(color, alpha * uFade);
  }
`

function useScreenMaterial(signal: THREE.Color, foreground: THREE.Color) {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uProgress: { value: 0 },
          uTime: { value: 0 },
          uFade: { value: 1 },
          uAccent: { value: signal },
          uForeground: { value: foreground },
        },
        vertexShader: SCREEN_VERTEX,
        fragmentShader: SCREEN_FRAGMENT,
      }),
    [signal, foreground],
  )
}

type PanelProps = {
  scrollProgress: MotionValue<number>
  introProgress?: MotionValue<number>
  palette: ScenePalette
  frameW: number
  frameH: number
  restX: number
  restY: number
  restZ: number
  restRotY?: number
  variant: 'main' | 'echo'
  driftPhase?: number
  dimOpacity?: number
}

function Panel({
  scrollProgress,
  introProgress,
  palette,
  frameW,
  frameH,
  restX,
  restY,
  restZ,
  restRotY = 0,
  variant,
  driftPhase = 0,
  dimOpacity = 1,
}: PanelProps) {
  const group = useRef<THREE.Group>(null)
  const screenMat = useScreenMaterial(palette.signal, palette.foreground)
  const echoMat = useRef<THREE.MeshBasicMaterial>(null!)
  const pointer = useRef({ x: 0, y: 0 })
  const clockStart = useRef<number | null>(null)
  const isMain = variant === 'main'

  useEffect(() => {
    if (!isMain) return
    const onMove = (e: PointerEvent) => {
      pointer.current.x = e.clientX / window.innerWidth - 0.5
      pointer.current.y = e.clientY / window.innerHeight - 0.5
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [isMain])

  useFrame((state) => {
    const g = group.current
    if (!g) return
    if (clockStart.current === null) clockStart.current = state.clock.elapsedTime
    const elapsed = state.clock.elapsedTime - clockStart.current
    const p = scrollProgress.get()

    if (isMain) {
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, restRotY + pointer.current.x * 0.16, 0.045)
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -pointer.current.y * 0.09, 0.045)
    } else {
      g.rotation.y = restRotY + Math.sin(elapsed * 0.18 + driftPhase) * 0.05
      g.rotation.z = Math.sin(elapsed * 0.22 + driftPhase) * 0.015
    }

    const idleY = isMain ? 0 : Math.sin(elapsed * 0.35 + driftPhase) * 0.08
    g.position.set(restX, restY + idleY - p * 2.6, restZ)

    const scale = THREE.MathUtils.lerp(1, 0.58, p)
    g.scale.setScalar(scale)

    const fade = (1 - Math.min(p * 1.3, 1)) * dimOpacity

    if (isMain) {
      screenMat.uniforms.uProgress.value = introProgress ? introProgress.get() : 1
      screenMat.uniforms.uTime.value = state.clock.elapsedTime
      screenMat.uniforms.uFade.value = fade
    } else if (echoMat.current) {
      echoMat.current.opacity = 0.5 * fade
    }
  })

  const screenW = frameW - 0.55
  const screenH = frameH - 0.7

  return (
    <group ref={group}>
      <RoundedBox args={[frameW, frameH, 0.16]} radius={0.09} smoothness={4} position={[0, 0, -0.08]}>
        <meshStandardMaterial color={palette.card} roughness={0.2} metalness={0.6} transparent opacity={dimOpacity} />
      </RoundedBox>

      {isMain && (
        <group position={[-frameW / 2 + 0.34, frameH / 2 - 0.26, 0.005]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[i * 0.17, 0, 0]}>
              <circleGeometry args={[0.045, 16]} />
              <meshBasicMaterial color={palette.foreground} transparent opacity={0.55} />
            </mesh>
          ))}
        </group>
      )}

      <mesh position={[0, -0.16, 0.01]}>
        <planeGeometry args={[screenW, screenH]} />
        {isMain ? (
          <primitive object={screenMat} attach="material" />
        ) : (
          <meshBasicMaterial ref={echoMat} color={palette.card} transparent opacity={0.5 * dimOpacity} />
        )}
      </mesh>
    </group>
  )
}

// Half-extents of the full 3-panel composition (echo left/right + main),
// measured from the panel restX/restY/frameW/frameH values below. Used to
// keep the camera pulled back just far enough that nothing crops at any
// canvas aspect ratio, instead of a fixed distance tuned for one shape.
const COMPOSITION_HALF_W = 5.85
const COMPOSITION_HALF_H = 2.15
const FRAME_MARGIN = 1.02
const MIN_DIST = 8
const MAX_DIST = 22

function ResponsiveCamera() {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera
  const size = useThree((state) => state.size)

  useEffect(() => {
    if (!size.width || !size.height) return
    const aspect = size.width / size.height
    const halfTan = Math.tan((camera.fov * Math.PI) / 360)
    const distForHeight = COMPOSITION_HALF_H / halfTan
    const distForWidth = COMPOSITION_HALF_W / (halfTan * aspect)
    const dist = THREE.MathUtils.clamp(Math.max(distForHeight, distForWidth) * FRAME_MARGIN, MIN_DIST, MAX_DIST)
    camera.position.z = dist
    camera.updateProjectionMatrix()
  }, [camera, size.width, size.height])

  return null
}

export function HeroScene({
  scrollProgress,
  introProgress,
}: {
  scrollProgress: MotionValue<number>
  introProgress: MotionValue<number>
}) {
  const palette = useScenePalette()

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 9.5], fov: 38 }}
      gl={{ alpha: true, antialias: true }}
      style={{ pointerEvents: 'none' }}
    >
      <ResponsiveCamera />
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 6, 5]} intensity={1.05} />
      <directionalLight position={[-5, -2, -4]} intensity={0.42} color={palette.signal} />
      <pointLight position={[0, -3, 4]} intensity={0.25} color={palette.foreground} />

      <Panel
        variant="echo"
        scrollProgress={scrollProgress}
        palette={palette}
        frameW={4.6}
        frameH={2.9}
        restX={-3.4}
        restY={0.4}
        restZ={-2.4}
        restRotY={0.35}
        driftPhase={1.1}
        dimOpacity={0.4}
      />
      <Panel
        variant="echo"
        scrollProgress={scrollProgress}
        palette={palette}
        frameW={4.2}
        frameH={2.65}
        restX={3.5}
        restY={-0.5}
        restZ={-2.1}
        restRotY={-0.3}
        driftPhase={3.4}
        dimOpacity={0.32}
      />
      <Panel
        variant="main"
        scrollProgress={scrollProgress}
        introProgress={introProgress}
        palette={palette}
        frameW={6.6}
        frameH={4.15}
        restX={0}
        restY={-0.3}
        restZ={0}
      />

      <Sparkles count={30} scale={[10, 6, 5]} size={1.2} speed={0.2} opacity={0.28} color={palette.foreground} />

      <EffectComposer enableNormalPass={false}>
        <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} intensity={0.28} mipmapBlur />
      </EffectComposer>
    </Canvas>
  )
}
