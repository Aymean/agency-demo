import { useRef, type PointerEvent, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'

export function Magnetic({
  children,
  strength = 0.4,
  hoverScale = true,
  className,
}: {
  children: ReactNode
  strength?: number
  hoverScale?: boolean
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 250, damping: 18, mass: 0.4 })
  const springY = useSpring(y, { stiffness: 250, damping: 18, mass: 0.4 })

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse' || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set((e.clientX - rect.left - rect.width / 2) * strength)
    y.set((e.clientY - rect.top - rect.height / 2) * strength)
  }

  function onPointerLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{ x: springX, y: springY }}
      whileHover={hoverScale ? { scale: 1.035 } : undefined}
      whileTap={hoverScale ? { scale: 0.97 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
