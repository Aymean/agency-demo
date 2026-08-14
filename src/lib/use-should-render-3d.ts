import { useEffect, useState } from 'react'

export function useShouldRender3D() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isNarrow = window.innerWidth < 768
    setEnabled(!prefersReduced && !isNarrow)
  }, [])

  return enabled
}
