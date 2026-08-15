import { motion } from 'motion/react'
import { PulseDot } from '@/components/pulse-dot'
import { cn } from '@/lib/utils'

const BLOCK_ROWS = [{ w: 68 }, { w: 44 }, { w: 82, accent: true }, { w: 52 }]

// The same flatline -> signal beat as the desktop 3D hero, in cheap 2D form —
// a card-static overlay (reused from the portfolio ScreenWipe) wipes away to
// reveal a resolved mock UI with one signal-green block. This is what phones
// and other narrow/reduced-motion viewports get instead of the WebGL scene.
export function HeroMobileVisual() {
  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto mt-10 w-full max-w-xs sm:max-w-sm"
    >
      <div className="relative overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex items-center gap-1.5 border-b border-border bg-muted/60 px-3 py-2">
          <span className="size-2 rounded-full bg-foreground/15" />
          <span className="size-2 rounded-full bg-foreground/15" />
          <PulseDot size="sm" className="ms-auto" />
        </div>
        <div className="space-y-2.5 p-4">
          {BLOCK_ROWS.map((row, i) => (
            <div
              key={i}
              className={cn('h-2.5 rounded-full', row.accent ? 'bg-signal' : 'bg-muted-foreground/25')}
              style={{ width: `${row.w}%` }}
            />
          ))}
        </div>
        {!prefersReduced && (
          <motion.div
            aria-hidden
            className="card-static pointer-events-none absolute inset-0"
            initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
            whileInView={{ clipPath: 'inset(0% 0% 0% 100%)' }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
        )}
      </div>
    </motion.div>
  )
}
