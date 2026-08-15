import { useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, duration = 2) {
  const ref = useRef<HTMLElement | null>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced || target <= 0) {
      setValue(target)
      return
    }

    // Discrete jumps rather than a smooth tween — reads as a heartbeat
    // ticking up, not a generic SaaS counter. Each step has to be held long
    // enough to register as its own tick rather than blurring into a ramp.
    const STEP_MS = 240
    const steps = Math.max(1, Math.min(target, Math.round((duration * 1000) / STEP_MS)))
    let i = 0

    const id = setInterval(() => {
      i += 1
      const progress = i / steps
      const eased = 1 - Math.pow(1 - progress, 2)
      setValue(Math.round(eased * target))
      if (i >= steps) clearInterval(id)
    }, STEP_MS)

    return () => clearInterval(id)
  }, [inView, target, duration])

  return { ref, value }
}
