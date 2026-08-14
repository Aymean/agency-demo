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

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      const target = (e.target as HTMLElement)?.closest?.('[data-cursor]') as HTMLElement | null
      setHover(!!target)
      setLabel(target?.dataset.cursor === 'view' ? 'View' : '')
    }
    window.addEventListener('pointermove', onMove)

    return () => {
      window.removeEventListener('pointermove', onMove)
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
