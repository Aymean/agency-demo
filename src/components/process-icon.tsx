import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

const EASE = [0.16, 1, 0.3, 1] as const
const EKG_PATH = 'M2 24 H16 L21 9 L27 39 L32 24 H45 L49 15 L53 24 H62'

export function ProcessIcon({ variant }: { variant: 'flatline' | 'rising' | 'signal' }) {
  const isRising = variant === 'rising'
  const isSignal = variant === 'signal'

  return (
    <svg viewBox="0 0 64 48" className="size-10" fill="none" aria-hidden>
      <rect
        x={1}
        y={1}
        width={62}
        height={46}
        rx={6}
        strokeWidth={1.5}
        className={cn('transition-colors', isSignal ? 'stroke-signal/70' : isRising ? 'stroke-signal/35' : 'stroke-border')}
      />

      {variant === 'flatline' && (
        <motion.line
          x1={4}
          y1={24}
          x2={60}
          y2={24}
          className="stroke-muted-foreground/50"
          strokeWidth={2}
          strokeLinecap="round"
          animate={{ opacity: [0.5, 0.85, 0.4, 0.7, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {isRising && (
        <motion.path
          d={EKG_PATH}
          className="stroke-signal/70"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0.5 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 1, delay: 0.2, ease: EASE }}
        />
      )}

      {isSignal && (
        <motion.path
          d={EKG_PATH}
          className="stroke-signal"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 3px var(--signal))' }}
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
        />
      )}
    </svg>
  )
}
