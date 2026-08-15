import { lazy, memo, Suspense, useEffect, useRef, useState, type RefObject } from 'react'
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
// The intro is one legible beat, not a flourish: the sweep crosses, the panel
// snaps glitch -> resolved, that resolved state is held for a moment, and only
// then does the headline start. Earlier values ran the snap under the headline
// reveal, so you inferred the beat from the end state instead of seeing it.
const SWEEP_DELAY = 0.3
const SWEEP_DURATION = 1.35
const RESOLVE_AT = SWEEP_DELAY + SWEEP_DURATION
const RESOLVE_DURATION = 0.82
const RESOLVE_HOLD = 0.3
const HEADLINE_AT = RESOLVE_AT + RESOLVE_DURATION + RESOLVE_HOLD

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

const FALLBACK_MASK = 'radial-gradient(ellipse 60% 60% at 50% 50%, transparent 0%, transparent 55%, black 100%)'

// Masks the WebGL scene out from behind the actual text block instead of a
// fixed, hand-tuned ellipse. A fixed shape only fit the proportions of one
// layout (desktop) — on mobile the same text stack takes up a much taller
// fraction of a much shorter hero, so the old ellipse left the panel's edge
// showing above the headline and its grid pattern showing straight through
// the subhead. Measuring the real content box makes this correct for any
// viewport and either language automatically.
function useContentMask(sectionRef: RefObject<HTMLElement | null>, contentRef: RefObject<HTMLElement | null>, dep: unknown) {
  const [mask, setMask] = useState(FALLBACK_MASK)

  useEffect(() => {
    function measure() {
      const section = sectionRef.current
      const content = contentRef.current
      if (!section || !content) return
      const s = section.getBoundingClientRect()
      const c = content.getBoundingClientRect()
      if (!s.height || !c.height) return
      const centerYPct = ((c.top - s.top + c.height / 2) / s.height) * 100
      const halfHeightPct = ((c.height / 2 + 64) / s.height) * 100
      const halfWidthPct = Math.min(72, ((c.width / 2 + 48) / s.width) * 100)
      setMask(
        `radial-gradient(ellipse ${halfWidthPct.toFixed(1)}% ${halfHeightPct.toFixed(1)}% at 50% ${centerYPct.toFixed(1)}%, transparent 0%, transparent 55%, black 100%)`,
      )
    }
    measure()
    const raf = requestAnimationFrame(measure)
    document.fonts?.ready.then(measure).catch(() => {})
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `dep` (the visible copy) is the real trigger for a language-switch remeasure
  }, [sectionRef, contentRef, dep])

  return mask
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
  const contentRef = useRef<HTMLDivElement>(null)
  const heroMask = useContentMask(heroRef, contentRef, t.hero.sub)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const introProgress = useMotionValue(0)
  const [resolved, setResolved] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [headlinePlay, setHeadlinePlay] = useState(false)

  // The whole point of the intro is that you watch the panel resolve, so the
  // clock starts when the scene is actually on screen — not on mount. The 3D
  // bundle is lazy, and starting on mount let the beat play out over an empty
  // hero on any load slow enough to matter.
  useEffect(() => {
    if (!show3D || !sceneReady) return
    const resolveTimer = setTimeout(() => {
      setResolved(true)
      animate(introProgress, 1, { duration: RESOLVE_DURATION, ease: EASE })
    }, RESOLVE_AT * 1000)
    const headlineTimer = setTimeout(() => setHeadlinePlay(true), HEADLINE_AT * 1000)
    return () => {
      clearTimeout(resolveTimer)
      clearTimeout(headlineTimer)
    }
  }, [show3D, sceneReady, introProgress])

  // No scene to wait on: reduced motion and incapable devices get the copy
  // straight away rather than sitting on an empty hero.
  useEffect(() => {
    if (show3D) return
    const timer = setTimeout(() => setHeadlinePlay(true), 250)
    return () => clearTimeout(timer)
  }, [show3D])

  return (
    <section
      id="top"
      ref={heroRef}
      className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,color-mix(in_oklch,var(--foreground)_6%,transparent),transparent)]"
      />
      {show3D && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ maskImage: heroMask, WebkitMaskImage: heroMask }}
        >
          <Suspense fallback={null}>
            <HeroScene
              scrollProgress={scrollYProgress}
              introProgress={introProgress}
              onReady={() => setSceneReady(true)}
            />
          </Suspense>
          {/* Mounts with the scene, so the sweep never crosses an empty frame. */}
          {sceneReady && <PulseSweep dir={dir} />}
        </div>
      )}
      <div ref={contentRef}>
        <RevealGroup className="mx-auto max-w-4xl px-6 text-center" stagger={0.1}>
          <RevealItem className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <PulseDot active={!show3D || resolved} />
            {t.hero.kicker}
          </RevealItem>

          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            <TextReveal text={t.hero.h1a} play={headlinePlay} />
            <TextReveal text={t.hero.h1b} play={headlinePlay} delay={0.13} className="text-muted-foreground" />
          </h1>

          <RevealItem>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
              {t.hero.sub}
            </p>
          </RevealItem>

          <RevealItem className="mt-8 flex items-center justify-center">
            <Magnetic>
              <Button data-cursor="link" size="lg" onClick={() => scrollToId('contact')} className="px-8">
                {t.hero.cta}
              </Button>
            </Magnetic>
          </RevealItem>

          <RevealItem className="mx-auto mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-6">
            <dl className="contents">
              {STATS.map((stat, i) => (
                <StatCell key={i} {...stat} label={labels[i]} />
              ))}
            </dl>
          </RevealItem>
        </RevealGroup>
      </div>
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
  // Animating `left` (a layout property) forced a synchronous reflow every
  // frame, right alongside the WebGL canvas's own render loop — that fight
  // for the main thread is what read as stutter. `x` is a transform: it moves
  // the whole wrapper (sized to the hero's full width, so -4%..104% still
  // sweeps edge-to-edge) as a compositor-only operation with no reflow/repaint.
  const x = useTransform(progress, [0, 1], [`${fromPct}%`, `${toPct}%`])
  const opacity = useTransform(progress, [0, 0.12, 0.85, 1], [0, 1, 1, 0])

  useEffect(() => {
    const controls = animate(progress, 1, { duration: SWEEP_DURATION, delay: SWEEP_DELAY, ease: EASE })
    return () => controls.stop()
  }, [progress])

  return (
    <motion.div
      aria-hidden
      className="absolute inset-y-[15%] start-0 h-auto w-full will-change-transform"
      style={{ x, opacity }}
    >
      <div className="h-full w-px bg-signal shadow-[0_0_18px_3px_var(--signal)]" />
    </motion.div>
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
