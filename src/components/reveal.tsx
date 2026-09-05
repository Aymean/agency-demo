import { motion, useAnimation, useInView, type Variants } from 'motion/react'
import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { useLang } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const EASE = [0.16, 1, 0.3, 1] as const

/* The section-transition motif.
 *
 * Content arrives from a direction and locks into place, echoing the way the
 * logo pieces assembled in the intro. It is deliberately built as props on
 * these existing primitives rather than as a parallel animation system, so
 * every section keeps using the same components it already used.
 *
 * The easing is the shared house curve, which is doing most of the work: its
 * heavy deceleration is what makes an arrival read as landing rather than as
 * sliding to a halt. No separate "lock" easing is needed.
 */

/** Entry direction. `start`/`end` are logical, not physical — see below. */
export type RevealFrom = 'up' | 'start' | 'end'

// Far enough that the arrival reads as travel rather than a fade with a nudge.
const TRAVEL = 32

/* Direction has to be resolved against the writing direction, not hard-coded.
 * Motion animates x in pixels, so there is no logical-property equivalent to
 * lean on: an item entering from the inline-start must come from the left in
 * English and from the right in Arabic, or half the site's animations point
 * the wrong way in RTL and nothing in the type system notices.
 *
 * Reveals used to be driven by `initial`/`whileInView` with a `key={dir}` to
 * force the resting pose to re-match direction after a language switch —
 * Motion applies `initial` only once, at mount, so there was no other way to
 * make an unrevealed block re-snap to the correct side. But that meant every
 * reveal remounted on switch, including ones already scrolled past: their
 * fresh `once: true` observer never sees them intersect again (they're above
 * the viewport, not below it), so they remounted straight into "hidden" and
 * stayed there — blank — until the visitor scrolled back up through them.
 *
 * `useReveal` replaces that with an imperative `AnimationControls` instance
 * per block plus `useInView`. Nothing ever remounts, so a block that has
 * already shown is simply never touched again by a `dir` change. A block
 * that HASN'T shown yet gets its resting pose re-set (via `controls.set`,
 * no transition) every time `dir` changes, so whichever side it eventually
 * flies in from is always correct for the language on screen at that time. */
function useReveal(dir: 'ltr' | 'rtl', active: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const controls = useAnimation()
  const revealedRef = useRef(false)
  const inView = useInView(ref, VIEWPORT)

  useLayoutEffect(() => {
    if (!revealedRef.current) controls.set('hidden')
  }, [dir, controls])

  useLayoutEffect(() => {
    if (inView && active && !revealedRef.current) {
      revealedRef.current = true
      controls.start('show')
    }
  }, [inView, active, controls])

  return { ref, controls }
}

function variantsFor(from: RevealFrom, dir: 'ltr' | 'rtl'): Variants {
  const inlineStart = dir === 'rtl' ? TRAVEL : -TRAVEL
  const offset =
    from === 'up' ? { y: TRAVEL } : { x: from === 'start' ? inlineStart : -inlineStart }

  return {
    hidden: { opacity: 0, ...offset },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.9, ease: EASE },
    },
  }
}

const VIEWPORT = { once: true, margin: '-15% 0px -10% 0px' } as const

/* The lock glow: a faint accent bloom that swells and fades as the heading
 * settles, the supporting echo of the intro's lock beat. Two deliberate
 * limits, because this is the part most able to look cheap:
 *
 *  - Headings only, never per-card. Six cards in a grid each flashing is
 *    noise, not a motif.
 *  - Skipped under prefers-reduced-motion. MotionConfig's reducedMotion="user"
 *    suppresses transforms but NOT opacity, so a pulsing glow would otherwise
 *    survive the setting that exists to stop exactly this. */
function LockGlow() {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 -z-10 block h-[160%] w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] motion-reduce:hidden"
      style={{
        background:
          'radial-gradient(closest-side, color-mix(in oklch, var(--accent) 22%, transparent), transparent)',
      }}
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: [0, 0.35, 0],
          transition: { duration: 1.5, ease: 'easeOut', times: [0, 0.45, 1] },
        },
      }}
    />
  )
}

export function Reveal({
  children,
  className,
  delay = 0,
  from = 'up',
  /** Adds the lock-glow echo behind this block. Headings only. */
  lock = false,
}: {
  children: ReactNode
  className?: string
  delay?: number
  from?: RevealFrom
  lock?: boolean
}) {
  const { dir } = useLang()
  const { ref, controls } = useReveal(dir, true)

  return (
    <motion.div
      ref={ref}
      // `relative` only when the glow needs a containing block, so no existing
      // caller silently gains a new positioning context. `overflow-hidden`
      // rides along with it: LockGlow is deliberately oversized (130%/160% of
      // this box) to bleed softly past its own text, and with nothing to clip
      // it that bleed becomes real page-level horizontal overflow on narrow
      // viewports — confirmed on mobile, where it inflated the fixed header's
      // own width past the viewport and pushed the language toggle (the only
      // way to switch languages below the `md` nav breakpoint) off-screen.
      className={cn(lock && 'relative overflow-hidden', className)}
      animate={controls}
      variants={variantsFor(from, dir)}
      transition={{ delay, duration: 0.9, ease: EASE }}
    >
      {lock && <LockGlow />}
      {children}
    </motion.div>
  )
}

export function RevealGroup({
  children,
  className,
  stagger = 0.09,
  /**
   * Same external cue as TextReveal's `play`, for the same reason. A group
   * that is already inside the viewport fires the moment it mounts, which is
   * wrong when something is covering the page — the hero sits in view behind
   * the intro overlay and would spend its whole reveal there, so by the time
   * the overlay lifted there'd be nothing left to reveal. Holding it at
   * "hidden" until the cue arrives keeps the stagger for the moment it's
   * actually visible. Defaults true, so every other caller is unaffected.
   */
  play = true,
}: {
  children: ReactNode
  className?: string
  stagger?: number
  play?: boolean
}) {
  const { dir } = useLang()
  const { ref, controls } = useReveal(dir, play)

  return (
    <motion.div
      ref={ref}
      className={className}
      animate={controls}
      variants={{ show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({
  children,
  className,
  from = 'up',
}: {
  children: ReactNode
  className?: string
  from?: RevealFrom
}) {
  const { dir } = useLang()

  // No viewport config of its own: the parent RevealGroup drives it by variant
  // name, which is what lets each child carry a different direction while the
  // group still owns the stagger.
  return (
    <motion.div className={className} variants={variantsFor(from, dir)}>
      {children}
    </motion.div>
  )
}

export function TextReveal({
  text,
  className,
  delay = 0,
  duration = 0.9,
  /**
   * Gate the reveal on an external cue instead of firing on mount. `delay` is
   * then measured from the moment this flips true. The hero needs this because
   * its schedule isn't known at mount — it depends on the 3D scene being on
   * screen — and a delay prop that changes after mount never re-fires.
   */
  play = true,
}: {
  text: string
  className?: string
  delay?: number
  duration?: number
  play?: boolean
}) {
  return (
    <span className={cn('block overflow-hidden', className)}>
      <motion.span
        className="block"
        initial={{ y: '110%' }}
        animate={{ y: play ? '0%' : '110%' }}
        transition={{ duration, ease: EASE, delay }}
      >
        {text}
      </motion.span>
    </span>
  )
}
