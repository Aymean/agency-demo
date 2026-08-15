import { useEffect, useState } from 'react'

// Re-evaluates on resize/orientation change via matchMedia's own change
// event, rather than a one-time check on mount — so it can't get stuck
// showing the desktop-framed scene after a viewport/orientation change.
export function useShouldRender3D() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const widthQuery = window.matchMedia('(min-width: 768px)')

    const update = () => {
      setEnabled(!reducedMotionQuery.matches && widthQuery.matches)
    }

    update()
    reducedMotionQuery.addEventListener('change', update)
    widthQuery.addEventListener('change', update)

    return () => {
      reducedMotionQuery.removeEventListener('change', update)
      widthQuery.removeEventListener('change', update)
    }
  }, [])

  return enabled
}
