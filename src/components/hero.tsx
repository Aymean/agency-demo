import { lazy, memo, Suspense, useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useScroll, useTransform } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Magnetic } from '@/components/magnetic'
import { PulseDot } from '@/components/pulse-dot'
import { RevealGroup, RevealItem, TextReveal } from '@/components/reveal'
import { useCountUp } from '@/lib/use-count-up'
import { useShouldRender3D } from '@/lib/use-should-render-3d'
import { useLang } from '@/lib/i18n'

const HeroScene = lazy(() => import('@/components/hero-scene').then((m) => ({ default: m.HeroScene })))

const EASE = [0.16, 1, 0.3, 1] as const
const SWEEP_DELAY = 0.35
const SWEEP_DURATION = 0.9
const RESOLVE_AT = SWEEP_DELAY + SWEEP_DURATION

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

const STATS = [
  { value: 50, prefix: '', suffix: '+' },
  { value: 4, prefix: '', suffix: '' },
  { value: 0, prefix: '$', suffix: '' },
]

export function Hero() {
  const { t, dir } = useLang()
  const labels = [t.hero.stat1l, t.hero.stat2l, t.hero.stat3l]
  const show3D = useShouldRender3D()
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const introProgress = useMotionValue(0)
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    if (!show3D) return
    const timer = setTimeout(() => {
      setResolved(true)
      animate(introProgress, 1, { duration: 0.55, ease: EASE })
    }, RESOLVE_AT * 1000)
    return () => clearTimeout(timer)
  }, [show3D, introProgress])

  const h1Delay = show3D ? RESOLVE_AT : 0.45
  const h2Delay = show3D ? RESOLVE_AT + 0.13 : 0.56

  return (
    <section
      id="top"
      ref={heroRef}
      className="relative overflow-hidden pt-40 pb-24 md:pt-48 md:pb-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,color-mix(in_oklch,var(--foreground)_6%,transparent),transparent)]"
      />
      {show3D && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_40%_25%_at_50%_37%,transparent_0%,black_82%)] [-webkit-mask-image:radial-gradient(ellipse_40%_25%_at_50%_37%,transparent_0%,black_82%)]"
        >
          <Suspense fallback={null}>
            <HeroScene scrollProgress={scrollYProgress} introProgress={introProgress} />
          </Suspense>
          <PulseSweep dir={dir} />
        </div>
      )}
      <RevealGroup className="mx-auto max-w-4xl px-6 text-center" stagger={0.1}>
        <RevealItem className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <PulseDot active={!show3D || resolved} />
          {t.hero.kicker}
        </RevealItem>

        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
          <TextReveal text={t.hero.h1a} delay={h1Delay} />
          <TextReveal text={t.hero.h1b} delay={h2Delay} className="text-muted-foreground" />
        </h1>

        <RevealItem>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            {t.hero.sub}
          </p>
        </RevealItem>

        <RevealItem className="mt-10 flex items-center justify-center">
          <Magnetic>
            <Button data-cursor="link" size="lg" onClick={() => scrollToId('contact')} className="px-8">
              {t.hero.cta}
            </Button>
          </Magnetic>
        </RevealItem>

        <RevealItem className="mx-auto mt-16 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-8">
          <dl className="contents">
            {STATS.map((stat, i) => (
              <StatCell key={i} {...stat} label={labels[i]} />
            ))}
          </dl>
        </RevealItem>
      </RevealGroup>
    </section>
  )
}

// Reads as an EKG scanline: sweeps once across the broken mockup on load, and
// its arrival is the beat that snaps the panel from glitch to resolved.
// Memoized so the `resolved` state flip in Hero (a sibling re-render) doesn't
// re-render this and touch the one-shot mount animation below.
const PulseSweep = memo(function PulseSweep({ dir }: { dir: 'ltr' | 'rtl' }) {
  const fromPct = dir === 'rtl' ? 104 : -4
  const toPct = dir === 'rtl' ? -4 : 104
  const progress = useMotionValue(0)
  const left = useTransform(progress, [0, 1], [`${fromPct}%`, `${toPct}%`])
  const opacity = useTransform(progress, [0, 0.12, 0.85, 1], [0, 1, 1, 0])

  useEffect(() => {
    const controls = animate(progress, 1, { duration: SWEEP_DURATION, delay: SWEEP_DELAY, ease: EASE })
    return () => controls.stop()
  }, [progress])

  return (
    <motion.div
      aria-hidden
      className="absolute inset-y-[15%] w-px bg-signal shadow-[0_0_18px_3px_var(--signal)]"
      style={{ left, opacity }}
    />
  )
})

function StatCell({
  value,
  prefix,
  suffix,
  label,
}: {
  value: number
  prefix: string
  suffix: string
  label: string
}) {
  const { ref, value: animated } = useCountUp(value)

  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd ref={ref as never} className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
        {prefix}
        {animated}
        {suffix}
      </dd>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
