import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { IntroSequence } from '@/components/intro-sequence'
import { useScrollLock } from '@/lib/smooth-scroll'

const INTRO_FLAG = 'zaylo:intro-played'

type IntroContextValue = {
  /** True once the page proper is allowed to reveal itself — the intro's
   *  resolve beat, or immediately when there is no intro to wait for. */
  contentReady: boolean
}

const IntroContext = createContext<IntroContextValue | null>(null)

export function useIntro() {
  const ctx = useContext(IntroContext)
  if (!ctx) throw new Error('useIntro must be used within an IntroProvider')
  return ctx
}

// Decided once, synchronously, in a useState initialiser rather than in an
// effect — the same reasoning use-should-render-3d.ts spells out for its own
// gate. Everything downstream (the headline timer, the 3D chunk's import, the
// nav lockup) schedules itself off `contentReady`, so a false -> true flip one
// frame after mount would start those schedules against the wrong branch and
// then yank them.
function decideShouldPlay(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  try {
    if (window.sessionStorage.getItem(INTRO_FLAG)) return false
  } catch {
    // Storage can throw outright rather than return null (Safari private mode,
    // cookies blocked). Playing the intro is the safe failure here — worst case
    // it plays twice in a session, versus never playing at all.
  }
  return true
}

function markPlayed() {
  try {
    window.sessionStorage.setItem(INTRO_FLAG, '1')
  } catch {
    // See above — a session that can't remember simply sees it again.
  }
}

export function IntroProvider({ children }: { children: ReactNode }) {
  const [shouldPlay] = useState(decideShouldPlay)
  const [contentReady, setContentReady] = useState(!shouldPlay)
  const [overlayMounted, setOverlayMounted] = useState(shouldPlay)

  useScrollLock(overlayMounted)

  // Fired as the burst disperses, not after it finishes: the overlay's fade-out
  // and the page's fade-in are the same beat, so the site is already arriving
  // underneath while the last pieces are still on their way out.
  const handleResolve = useCallback(() => {
    setContentReady(true)
    markPlayed()
  }, [])

  const handleComplete = useCallback(() => setOverlayMounted(false), [])

  const value = useMemo(() => ({ contentReady }), [contentReady])

  return (
    <IntroContext.Provider value={value}>
      {children}
      {overlayMounted && <IntroSequence onResolve={handleResolve} onComplete={handleComplete} />}
    </IntroContext.Provider>
  )
}
