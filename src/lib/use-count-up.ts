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
    //
    // Paced against real elapsed time (performance.now()), not a fixed count
    // of interval firings, so a late-firing tick (main-thread contention from
    // whatever else is animating at the time) jumps straight to the value it
    // should already be at — the count still lands within ~duration
    // regardless of what else is happening on the page.
    const STEP_MS = 240
    const start = performance.now()
    const totalMs = duration * 1000

    const id = setInterval(() => {
      const progress = Math.min(1, (performance.now() - start) / totalMs)
      const eased = 1 - Math.pow(1 - progress, 2)
      setValue(Math.round(eased * target))
      if (progress >= 1) clearInterval(id)
    }, STEP_MS)

    return () => clearInterval(id)
  }, [inView, target, duration])

  return { ref, value }
}
