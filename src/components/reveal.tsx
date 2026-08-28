import { motion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const EASE = [0.16, 1, 0.3, 1] as const

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
}

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-15% 0px -10% 0px' }}
      variants={itemVariants}
      transition={{ delay, duration: 0.9, ease: EASE }}
    >
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
  return (
    <motion.div
      className={className}
      initial="hidden"
      {...(play ? { whileInView: 'show' as const } : { animate: 'hidden' as const })}
      viewport={{ once: true, margin: '-15% 0px -10% 0px' }}
      variants={{ show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={itemVariants}>
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
