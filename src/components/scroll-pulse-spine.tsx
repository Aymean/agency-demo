import { useEffect, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useSpring } from 'motion/react'
import { PulseDot } from '@/components/pulse-dot'
import { useLang } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const SECTION_IDS = ['top', 'work', 'process', 'contact']
const TRACK_TOP = '5rem'
const TRACK_BOTTOM = '2.5rem'
const TRACK_HEIGHT = `calc(100% - ${TRACK_TOP} - ${TRACK_BOTTOM})`

export function ScrollPulseSpine() {
  const { dir } = useLang()
  const { scrollYProgress } = useScroll()
  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const progress = useSpring(
    scrollYProgress,
    prefersReduced ? { stiffness: 1000, damping: 100 } : { stiffness: 90, damping: 24, mass: 0.3 },
  )
  const [stops, setStops] = useState<number[]>(SECTION_IDS.map(() => 0))
  const [passed, setPassed] = useState<boolean[]>(SECTION_IDS.map(() => false))

  useEffect(() => {
    function measure() {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight <= 0) return
      setStops(
        SECTION_IDS.map((id) => {
          const el = document.getElementById(id)
          return el ? el.offsetTop / docHeight : 0
        }),
      )
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useMotionValueEvent(progress, 'change', (v) => {
    setPassed((prev) => {
      let changed = false
      const next = prev.map((was, i) => {
        const is = v >= stops[i] - 0.015
        if (is && !was) changed = true
        return was || is
      })
      return changed ? next : prev
    })
  })

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none fixed top-0 z-40 h-screen w-4',
        dir === 'rtl' ? 'right-0' : 'left-0',
      )}
    >
      <div
        className={cn('absolute w-px bg-border', dir === 'rtl' ? 'right-2' : 'left-2')}
        style={{ top: TRACK_TOP, bottom: TRACK_BOTTOM }}
      />
      <motion.div
        aria-hidden
        className={cn(
          'absolute w-px origin-top bg-accent shadow-[0_0_6px_var(--accent)]',
          dir === 'rtl' ? 'right-2' : 'left-2',
        )}
        style={{ top: TRACK_TOP, height: TRACK_HEIGHT, scaleY: progress }}
      />
      {SECTION_IDS.map((id, i) => (
        <div
          key={id}
          className={cn('absolute -translate-y-1/2', dir === 'rtl' ? 'right-2 translate-x-1/2' : 'left-2 -translate-x-1/2')}
          style={{ top: `calc(${TRACK_TOP} + ${stops[i]} * ${TRACK_HEIGHT})` }}
        >
          <PulseDot active={passed[i]} />
        </div>
      ))}
    </div>
  )
}
