import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox, Sparkles } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import type { MotionValue } from 'motion/react'

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
const SCREEN_FRAGMENT = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform float uFade;
  uniform vec3 uAccent;
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

    vec3 baseColor = vec3(0.87, 0.86, 0.82);
    vec3 blockColor = mix(baseColor, uAccent, isAccent * 0.85);
    vec3 glitchColor = vec3(0.4, 0.39, 0.37);

    vec3 color = mix(glitchColor, blockColor, revealed);
    float alpha = block * mix(glitchOn * 0.32, 0.95, revealed);

    gl_FragColor = vec4(color, alpha * uFade);
  }
`

function useScreenMaterial() {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uProgress: { value: 0 },
          uTime: { value: 0 },
          uFade: { value: 1 },
          uAccent: { value: new THREE.Color('#3fa06a') },
        },
        vertexShader: SCREEN_VERTEX,
        fragmentShader: SCREEN_FRAGMENT,
      }),
    [],
  )
}

type PanelProps = {
  scrollProgress: MotionValue<number>
  introProgress?: MotionValue<number>
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
  const screenMat = useScreenMaterial()
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
        <meshStandardMaterial color="#121210" roughness={0.28} metalness={0.55} transparent opacity={dimOpacity} />
      </RoundedBox>

      {isMain && (
        <group position={[-frameW / 2 + 0.34, frameH / 2 - 0.26, 0.005]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[i * 0.17, 0, 0]}>
              <circleGeometry args={[0.045, 16]} />
              <meshBasicMaterial color="#cdc9be" transparent opacity={0.55} />
            </mesh>
          ))}
        </group>
      )}

      <mesh position={[0, -0.16, 0.01]}>
        <planeGeometry args={[screenW, screenH]} />
        {isMain ? (
          <primitive object={screenMat} attach="material" />
        ) : (
          <meshBasicMaterial ref={echoMat} color="#2a2a26" transparent opacity={0.5 * dimOpacity} />
        )}
      </mesh>
    </group>
  )
}

export function HeroScene({
  scrollProgress,
  introProgress,
}: {
  scrollProgress: MotionValue<number>
  introProgress: MotionValue<number>
}) {
  // Lighter GPU budget on phones: lower pixel ratio, pulled-back camera so the
  // narrower aspect still frames the side panels, fewer sparkles, cheaper bloom.
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <Canvas
      dpr={isMobile ? [1, 1] : [1, 1.5]}
      camera={{ position: [0, 0, isMobile ? 12 : 9.5], fov: 38 }}
      gl={{ alpha: true, antialias: true }}
      style={{ pointerEvents: 'none' }}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 6, 5]} intensity={1.05} />
      <directionalLight position={[-5, -2, -4]} intensity={0.3} color="#3fa06a" />
      <pointLight position={[0, -3, 4]} intensity={0.25} color="#dedbd3" />

      <Panel
        variant="echo"
        scrollProgress={scrollProgress}
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
        frameW={6.6}
        frameH={4.15}
        restX={0}
        restY={-0.3}
        restZ={0}
      />

      <Sparkles count={isMobile ? 16 : 30} scale={[10, 6, 5]} size={1.2} speed={0.2} opacity={0.28} color="#dedbd3" />

      <EffectComposer enableNormalPass={false}>
        <Bloom
          luminanceThreshold={0.35}
          luminanceSmoothing={0.9}
          intensity={0.4}
          mipmapBlur={!isMobile}
        />
      </EffectComposer>
    </Canvas>
  )
}
