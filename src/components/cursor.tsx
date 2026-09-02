import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'
import { usePointerFine } from '@/lib/use-pointer-fine'

export function Cursor() {
  const enabled = usePointerFine()
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const ringX = useSpring(x, { stiffness: 300, damping: 28, mass: 0.5 })
  const ringY = useSpring(y, { stiffness: 300, damping: 28, mass: 0.5 })
  const [hover, setHover] = useState(false)
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (!enabled) return
    document.documentElement.classList.add('cursor-ready')

    // Shared by pointermove and scroll: elementFromPoint reads whatever is
    // actually under a viewport coordinate right now, rather than trusting a
    // stale event target.
    function updateHoverAt(clientX: number, clientY: number) {
      const el = document.elementFromPoint(clientX, clientY)
      const target = (el as HTMLElement | null)?.closest?.('[data-cursor]') as HTMLElement | null
      setHover(!!target)
      setLabel(target?.dataset.cursor === 'view' ? 'View' : '')
    }

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      updateHoverAt(e.clientX, e.clientY)
    }
    window.addEventListener('pointermove', onMove)

    // Lenis drives scroll by animating scrollTop under a stationary pointer —
    // no pointermove fires along the way. Without this, hover/label state
    // freezes at whatever was under the cursor before the scroll started: the
    // "View" ring stays lit over a completely different section once the page
    // has scrolled a portfolio card's dialog trigger out from under it.
    const onScroll = () => updateHoverAt(x.get(), y.get())
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onScroll)
      document.documentElement.classList.remove('cursor-ready')
    }
  }, [enabled, x, y])

  if (!enabled) return null

  const ringSize = hover ? (label ? 68 : 46) : 26

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[100] size-1.5 rounded-full bg-foreground"
        style={{ x, y, translateX: '-50%', translateY: '-50%' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[100] flex items-center justify-center rounded-full border border-foreground/40 text-[10px] font-medium tracking-wide text-foreground uppercase mix-blend-difference"
        style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%' }}
        animate={{ width: ringSize, height: ringSize, opacity: hover ? 1 : 0.55 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      >
        {label}
      </motion.div>
    </>
  )
}
