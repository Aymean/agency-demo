import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { LOGO_PIECES, LOGO_VIEWBOX } from '@/components/zaylo-mark'

/* The opening sequence: three logo pieces fly in and lock together, the lock
 * flashes, it holds, then each piece bursts outward on its own and the site
 * arrives underneath.
 *
 * Two mechanics are load-bearing and easy to break:
 *
 *  1. Each piece is a <motion.g> WRAPPING a <path> that keeps the translate()
 *     the vector trace gave it. Animating the path directly would overwrite
 *     that offset and the assembled logo would be wrong. At rest the wrapper
 *     has no transform, which is exactly why the locked state is correct
 *     without anyone hand-placing the pieces.
 *
 *  2. `transform-box: fill-box` + `transform-origin: center` makes each
 *     wrapper rotate and scale about ITS OWN centre. Without it every piece
 *     pivots around the shared SVG origin, which turns the burst into the
 *     whole logo being flung at the camera — the exact reading the brief
 *     rejected in favour of the pieces dispersing individually.
 */

const EASE = [0.16, 1, 0.3, 1] as const
// Sharp and accelerating-out. Pieces should leave faster than they arrive —
// deliberately not a bounce or an ease-in-out, which would read as playful.
const BURST_EASE = [0.6, 0, 0.85, 0.2] as const

// A held beat of empty ground before anything moves. Cheap, and it stops the
// first piece from appearing to already be in flight when the page paints.
const START_DELAY = 0.25
const ASSEMBLE_STAGGER = 0.3
const ASSEMBLE_DURATION = 1.4
// Last piece lands here: 0.25 + (2 x 0.3) + 1.4. Lands inside the brief's
// 2-2.5s window for the whole assemble.
const ASSEMBLE_END = START_DELAY + ASSEMBLE_STAGGER * (LOGO_PIECES.length - 1) + ASSEMBLE_DURATION

const GLOW_DURATION = 0.65
const HOLD_DURATION = 1.15
const BURST_AT = ASSEMBLE_END + GLOW_DURATION + HOLD_DURATION

const BURST_STAGGER = 0.09
const BURST_DURATION = 1.15
const BURST_SCALE = 4

// Late in the burst, not at its end — the overlay's fade and the site's
// arrival are meant to overlap. It can't be much earlier than this: BURST_EASE
// is heavily back-loaded (at 60% of its duration a piece has only travelled
// ~20% of the way to 4x), so pulling the overlay at, say, +0.7s would cut the
// whole sequence off while the pieces still looked stationary. At +0.85 the
// acceleration has visibly happened, and FADE_OUT then carries past the
// transition's own 1.15s end.
// The last piece's burst ends at (2 x BURST_STAGGER) + BURST_DURATION = 1.33s,
// and the overlay is gone at RESOLVE_AT + FADE_OUT = 1.50s. That ~0.17s of
// headroom is deliberate: setTimeout is wall-clock but Motion's transitions are
// frame-driven, so on a device dropping frames the timers keep their schedule
// while the animation falls behind. Measured with a software renderer, too
// little margin here pulls the overlay mid-burst and the pieces are cut off
// around 2.7x instead of reaching 4x.
const RESOLVE_AT = BURST_AT + 0.95
const FADE_OUT = 0.55

/* Scatter origins, in SVG user units (the viewBox is 500 wide, so these are
   several multiples of the mark's own size — far enough to clear the viewport
   at any realistic render size). Different directions and different rotations
   per the brief; the values are arbitrary by design, chosen only so the three
   arrivals don't read as a single formation. */
const ENTRY: Record<string, { x: number; y: number; rotate: number }> = {
  bar: { x: -1250, y: -950, rotate: -26 },
  hook: { x: 1350, y: -450, rotate: 22 },
  ribbon: { x: -350, y: 1250, rotate: -16 },
}

/* Burst directions. Each piece drifts a little as it scales so they separate
   rather than growing through one another. */
const EXIT: Record<string, { x: number; y: number; rotate: number }> = {
  bar: { x: -150, y: -110, rotate: -10 },
  hook: { x: 190, y: -60, rotate: 12 },
  ribbon: { x: -60, y: 180, rotate: -8 },
}

// Centre of the assembled mark's bounding box, in viewBox units. Used to place
// the lock glow. Derived from the traced pieces' extents: x 84..410, y 100..400.
const LOGO_CENTER = { x: 247, y: 250 }

type Phase = 'assemble' | 'burst' | 'resolve'

export function IntroSequence({ onResolve, onComplete }: { onResolve: () => void; onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase>('assemble')
  const [glowing, setGlowing] = useState(false)
  // Nothing animates until the browser has actually painted a frame. Mounting
  // is not the same moment as being able to draw: app boot, style resolution
  // and font work can block the main thread for a second or more on a cold
  // load, and a schedule started at mount spends that entire block counting
  // down against a frozen picture — measured as a ~1.2s stall where the first
  // piece should already have been moving. Starting both the piece transitions
  // and the beat timers from the first animation frame gives them a shared
  // origin that is a frame the user can actually see.
  const [started, setStarted] = useState(false)
  // Guards the resolve/complete handoff so a skip can't fire it a second time
  // after the scheduled timers have already run (or vice versa).
  const finished = useRef(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setStarted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (!started) return
    const timers: ReturnType<typeof setTimeout>[] = []
    const at = (seconds: number, fn: () => void) => timers.push(setTimeout(fn, seconds * 1000))

    at(ASSEMBLE_END, () => setGlowing(true))
    at(ASSEMBLE_END + GLOW_DURATION, () => setGlowing(false))
    at(BURST_AT, () => setPhase('burst'))
    at(RESOLVE_AT, () => {
      if (finished.current) return
      finished.current = true
      setPhase('resolve')
      onResolve()
    })
    at(RESOLVE_AT + FADE_OUT, onComplete)

    // Clearing every timer is what makes this safe under StrictMode's
    // double-invoke in dev — the first pass's schedule is torn down whole
    // rather than left running alongside the second's.
    return () => timers.forEach(clearTimeout)
  }, [started, onResolve, onComplete])

  // Skip affordance. Nearly six seconds is a long time to hold someone's
  // first visit hostage, so any deliberate input jumps straight to the
  // resolved state. Scroll/touch are included because they're the reflex of
  // someone who wants the page, not the show.
  useEffect(() => {
    function skip() {
      if (finished.current) return
      finished.current = true
      setPhase('resolve')
      onResolve()
      // Matches the scheduled path's fade rather than snapping, so a skip
      // still lands on the site instead of cutting to it.
      setTimeout(onComplete, FADE_OUT * 1000)
    }

    window.addEventListener('pointerdown', skip)
    window.addEventListener('wheel', skip, { passive: true })
    window.addEventListener('touchmove', skip, { passive: true })
    window.addEventListener('keydown', skip)
    return () => {
      window.removeEventListener('pointerdown', skip)
      window.removeEventListener('wheel', skip)
      window.removeEventListener('touchmove', skip)
      window.removeEventListener('keydown', skip)
    }
  }, [onResolve, onComplete])

  return (
    <motion.div
      // aria-hidden with no focusable content: this is pure spectacle, and a
      // screen-reader user has already been handed the real page underneath.
      aria-hidden
      // z-[100] clears the grain overlay (z-90, index.css) and the nav (z-50).
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'resolve' ? 0 : 1 }}
      transition={{ duration: FADE_OUT, ease: 'easeOut' }}
    >
      <svg
        viewBox={LOGO_VIEWBOX}
        className="h-[min(38vh,17rem)] w-auto text-foreground"
        // The scatter origins sit far outside the viewBox, and an <svg> clips
        // to its viewport by default — without this the pieces would slide in
        // from the edge of a 270px box instead of from off-screen.
        style={{ overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="zaylo-intro-lock-glow">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.55" />
            <stop offset="45%" stopColor="var(--accent)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* The lock flash. Sits behind the mark so it reads as light coming off
            the join, not a wash over the top of it. */}
        <motion.circle
          cx={LOGO_CENTER.x}
          cy={LOGO_CENTER.y}
          r={250}
          fill="url(#zaylo-intro-lock-glow)"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={glowing ? { opacity: [0, 1, 0], scale: [0.6, 1.15, 1.3] } : { opacity: 0, scale: 0.6 }}
          transition={glowing ? { duration: GLOW_DURATION, ease: 'easeOut', times: [0, 0.35, 1] } : { duration: 0 }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        />

        {LOGO_PIECES.map((piece, i) => {
          const entry = ENTRY[piece.key]
          const exit = EXIT[piece.key]
          const bursting = phase !== 'assemble'

          return (
            <motion.g
              key={piece.key}
              initial={{ x: entry.x, y: entry.y, rotate: entry.rotate, opacity: 0, scale: 1 }}
              animate={
                bursting
                  ? { x: exit.x, y: exit.y, rotate: exit.rotate, scale: BURST_SCALE, opacity: 0 }
                  : started
                    ? { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }
                    : { x: entry.x, y: entry.y, rotate: entry.rotate, scale: 1, opacity: 0 }
              }
              transition={
                bursting
                  ? {
                      duration: BURST_DURATION,
                      delay: i * BURST_STAGGER,
                      ease: BURST_EASE,
                      // Opacity gets its own, gentler curve. On BURST_EASE the
                      // fade would stay near-solid for most of the transition
                      // and then vanish in the last few frames, which reads as
                      // the pieces being switched off rather than dispersing.
                      opacity: { duration: BURST_DURATION * 0.85, delay: i * BURST_STAGGER, ease: 'easeIn' },
                    }
                  : { duration: ASSEMBLE_DURATION, delay: START_DELAY + i * ASSEMBLE_STAGGER, ease: EASE }
              }
              // See the header comment — this is what makes each piece pivot
              // and grow about itself rather than the shared SVG origin.
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            >
              <path transform={piece.transform} d={piece.d} fill="currentColor" />
            </motion.g>
          )
        })}
      </svg>
    </motion.div>
  )
}
