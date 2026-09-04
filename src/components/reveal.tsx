import { motion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'
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
 * the wrong way in RTL and nothing in the type system notices. */
/* Note the `key={dir}` on both consumers below. Motion applies `initial` once,
 * at mount, and these elements sit at that resting state until they scroll into
 * view — so swapping the variants object afterwards does NOT restyle them. With
 * the site defaulting to Arabic, every not-yet-revealed section would keep the
 * RTL entry offset after a switch to English and fly in from the wrong side.
 * Re-keying on `dir` remounts them so `initial` is re-applied. The cost is that
 * blocks currently on screen replay their reveal when the language changes,
 * which is a reasonable way to present a full-page text swap anyway.
 *
 * The key belongs on the two components that OWN a whileInView trigger, never
 * on RevealItem alone. RevealItem has no trigger of its own — it is driven by
 * its group by variant name — so remounting just the child under a group that
 * has already fired its once:true trigger leaves the child sitting at "hidden"
 * with nothing left to tell it to show. That is not theoretical: it blanked
 * every item in an already-revealed grid the moment the language was switched.
 * Keying the group remounts parent and children together, so the trigger
 * re-arms and the children come with it. */
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

  return (
    <motion.div
      key={dir}
      // `relative` only when the glow needs a containing block, so no existing
      // caller silently gains a new positioning context. `overflow-hidden`
      // rides along with it: LockGlow is deliberately oversized (130%/160% of
      // this box) to bleed softly past its own text, and with nothing to clip
      // it that bleed becomes real page-level horizontal overflow on narrow
      // viewports — confirmed on mobile, where it inflated the fixed header's
      // own width past the viewport and pushed the language toggle (the only
      // way to switch languages below the `md` nav breakpoint) off-screen.
      className={cn(lock && 'relative overflow-hidden', className)}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
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

  return (
    <motion.div
      key={dir}
      className={className}
      initial="hidden"
      {...(play ? { whileInView: 'show' as const } : { animate: 'hidden' as const })}
      viewport={VIEWPORT}
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
