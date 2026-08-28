import { useEffect } from 'react'
import Lenis from 'lenis'

// The single app-wide Lenis instance, held at module scope.
//
// It used to be a `const` inside the effect below, which meant nothing outside
// this file could ever reach it — fine while the only thing anyone wanted was
// "smooth scrolling exists", but the intro sequence needs to actually stop the
// page from scrolling while it plays. Module scope rather than a context
// because <SmoothScroll /> is a leaf sibling in App's tree, not a wrapper, and
// turning it into a provider just to expose one imperative handle would mean
// restructuring the tree for no other benefit. There is exactly one instance,
// created once, so a singleton is an honest model of what this already is.
let lenisInstance: Lenis | null = null

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      syncTouch: false,
    })
    lenisInstance = lenis

    let rafId: number
    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
      // Guarded rather than unconditional: under StrictMode's double-invoke the
      // second mount's instance is already installed by the time this cleanup
      // runs, and clearing it blindly would null out the live one.
      if (lenisInstance === lenis) lenisInstance = null
    }
  }, [])

  return null
}

/** Freezes page scrolling while `locked` is true.
 *
 *  Does two things rather than one, deliberately. `lenis.stop()` alone is not
 *  enough: Lenis bails out entirely under `prefers-reduced-motion` (see the
 *  early return above), so on those sessions there is no instance to stop and
 *  the call silently no-ops. `overflow: hidden` covers that path and native
 *  scrolling generally; stopping Lenis covers the smooth-scroll wheel handler,
 *  which keeps running independently of overflow. */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return

    lenisInstance?.stop()
    const html = document.documentElement
    const previousOverflow = html.style.overflow
    html.style.overflow = 'hidden'

    return () => {
      html.style.overflow = previousOverflow
      lenisInstance?.start()
    }
  }, [locked])
}
