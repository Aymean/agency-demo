import { useEffect, useState } from 'react'

// One-shot probe for whether this device can run the WebGL hero at all.
// Deliberately not a viewport-width check: phones get the same scene as
// desktop, just at a cheaper tier (see useSceneTier). The static fallback is
// reserved for reduced-motion users and genuinely incapable devices.
function hasWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export function useShouldRender3D() {
  // Resolved on the first render, not in the effect: the hero picks its intro
  // schedule from this value, and a false-then-true flip would lock in the
  // no-3D (fast) timing a frame before the real answer arrives.
  const [enabled, setEnabled] = useState(
    () => typeof window !== 'undefined' && hasWebGL() && !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const capable = hasWebGL()

    const update = () => setEnabled(capable && !reducedMotionQuery.matches)

    update()
    reducedMotionQuery.addEventListener('change', update)
    return () => reducedMotionQuery.removeEventListener('change', update)
  }, [])

  return enabled
}

export type SceneTier = 'compact' | 'full'

const COMPACT_QUERY = '(max-width: 767px)'

// Picks how expensive the hero scene is allowed to be — never *what* it shows.
// Re-evaluates on resize/orientation change via matchMedia's own change event,
// so it can't get stuck on a stale tier after the viewport changes.
export function useSceneTier(): SceneTier {
  const [tier, setTier] = useState<SceneTier>(() =>
    typeof window !== 'undefined' && window.matchMedia(COMPACT_QUERY).matches ? 'compact' : 'full',
  )

  useEffect(() => {
    const query = window.matchMedia(COMPACT_QUERY)
    const update = () => setTier(query.matches ? 'compact' : 'full')

    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return tier
}
