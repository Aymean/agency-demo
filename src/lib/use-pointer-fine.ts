import { useEffect, useState } from 'react'

function computeEnabled() {
  return (
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function usePointerFine() {
  // Resolved on the first render, not in the effect — same reasoning as
  // useShouldRender3D/useSceneTier. This value gates ScreenWipe's Motion
  // `initial` prop (portfolio.tsx): a false-then-true flip meant `initial`
  // fired for the wrong (touch) branch on every desktop load, which wrote a
  // permanent inline `clip-path` style onto the node — Motion never clears a
  // prop that later becomes `undefined`, and that leftover inline style then
  // outranks the CSS `group-hover:[clip-path:...]` class, permanently, no
  // matter how many times the card is actually hovered. Confirmed live: the
  // hover reveal never ran on desktop, so every portfolio screenshot stayed
  // hidden behind its static overlay.
  const [enabled, setEnabled] = useState(() => typeof window !== 'undefined' && computeEnabled())

  useEffect(() => {
    setEnabled(computeEnabled())
  }, [])

  return enabled
}
