import { useEffect, useState } from 'react'

export function usePointerFine() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setEnabled(fine && !prefersReduced)
  }, [])

  return enabled
}
