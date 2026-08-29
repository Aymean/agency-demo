import { lazy, memo, Suspense, useEffect, useRef, useState, type RefObject } from 'react'
import { animate, easeInOut, motion, useMotionValue, useScroll, useTransform } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Magnetic } from '@/components/magnetic'
import { PulseDot } from '@/components/pulse-dot'
import { RevealGroup, RevealItem, TextReveal } from '@/components/reveal'
import { useCountUp } from '@/lib/use-count-up'
import { useShouldRender3D } from '@/lib/use-should-render-3d'
import { useIntro } from '@/lib/intro'
import { useLang } from '@/lib/i18n'

const HeroScene = lazy(() => import('@/components/hero-scene').then((m) => ({ default: m.HeroScene })))

const EASE = [0.16, 1, 0.3, 1] as const
// The headline no longer waits on the 3D beat at all — it used to start only
// after sceneReady + this sequence, but sceneReady itself waits on a ~960KB
// (254KB gzipped) lazy chunk (three.js/drei/postprocessing) finishing
// download+parse. That's real, variable network time with no upper bound,
// so gating visible copy on it meant the "wait" was never just these
// constants — it was chunk-load-time PLUS all of this, additive, on every
// visit slower than a fast broadband connection. The headline now runs on
// its own short fixed timer (see HEADLINE_DELAY below); this sequence is
// purely the instrument's own internal beat, played whenever it's ready, as a
// background flourish rather than a blocking intro.
// Near-zero, not 0: the scene's materials/shaders compile lazily on their
// first real render, which lands right around when sceneReady flips and
// PulseSweep mounts, and a genuinely 0 delay risked the sweep's opacity
// fade racing that first-frame compile on a slow device. A small buffer is
// enough to dodge that without reintroducing a dead pause.
const SWEEP_DELAY = 0.05
const SWEEP_DURATION = 0.6
// The resolve used to wait for the sweep to finish its full crossing
// (SWEEP_DELAY + SWEEP_DURATION = ~0.9s) before the object started forming
// at all — that read as "load, see an empty/glitching shape, then finally
// something happens" instead of it visibly calibrating itself from the
// first moment it's on screen. The resolve now starts at the same instant
// the sweep does; the sweep still visually crosses the object over its own
// duration, it's just no longer a gate the resolve sits behind.
const RESOLVE_AT = SWEEP_DELAY
// The shader already resolves mark-by-mark in a staggered pattern (each tick
// lights as the scan angle reaches it — see TICK_FRAGMENT in hero-scene.tsx).
// At 0.42s that stagger was too fast to perceive as individual graduations
// coming up; this is purely the resolve beat's own pacing and doesn't touch
// HEADLINE_DELAY below, which stays on its own independent clock.
const RESOLVE_DURATION = 2.0

const HEADLINE_DELAY = 0.3
// Deferred past the headline's own reveal (delay + duration + h1b's extra
// stagger, plus a little slack) rather than started on mount. Decoupling the
// *state* wasn't enough on its own: the moment something actually renders
// <HeroScene>, React.lazy's dynamic import fires and the browser has to
// parse+execute a ~960KB module on the same single JS thread the headline's
// own rAF-driven transform animation runs on. Measured directly (see the
// commit this comment shipped in): that parse/execute work was starving the
// headline's setTimeout for 1.5-2s even though it was logically independent
// — a real main-thread contention issue, not just a sequencing one. Waiting
// until the headline is done before that work ever starts removes the
// contention instead of just hoping the two don't collide.
const SCENE_MOUNT_DELAY = 1.4

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

// Raised from 0.32 after the object was reported invisible on the live site.
// Measured cause: at 0.32 the object's mean contribution across its own
// bounding box was 4.84 luminance levels out of 255 (composite 22.5 vs
// background 17.7) — arithmetically present, perceptually not there at all on
// an ordinary display. The mask was dimming the object hardest across exactly
// the band the object occupies. Text stays legible because it is near-white
// (oklch 0.97) on a near-black ground, so its contrast ratio has an enormous
// margin to spend here.
//
// Alpha the scene is dimmed to directly behind text — NOT 0. On mobile the
// text stack (kicker through stats) fills 70-90% of a short hero's height,
// so a mask that fully hides the scene there doesn't just protect text, it
// hides almost the entire 3D scene on almost every real viewport — which is
// what "the animation is completely missing" turned out to mean: the scene
// was rendering fine, it was masked to zero alpha under nearly all of the
// content. Dimming instead of hiding keeps it visibly present everywhere,
// while still cutting its contrast enough for text on top to read clearly.
const DIM_ALPHA = 0.55

const FALLBACK_MASK =
  `linear-gradient(to bottom, black 0%, black 15%, rgba(0,0,0,${DIM_ALPHA}) 32%, rgba(0,0,0,${DIM_ALPHA}) 68%, black 85%, black 100%)`

// Dims the WebGL scene down behind the actual text block instead of a fixed,
// hand-tuned ellipse. A fixed shape only fit the proportions of one layout
// (desktop) — on mobile the same text stack takes up a much taller fraction
// of a much shorter hero, so the old ellipse left the object's edge showing
// above the headline and its detail showing straight through the subhead at
// full brightness. Measuring the real content box makes this
// correct for any viewport and either language automatically.
//
// This is a full-width horizontal band (linear, top-to-bottom), not a radial
// ellipse. An elliptical "hole" cut into a busy background reads as a foreign
// blob no matter how soft its edges are, because it has a curved boundary
// that doesn't belong to anything else in the composition. A band has no such
// edge to notice — it just reads as the ordinary top/bottom vignette any hero
// image would have.
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
      const pad = (16 / s.height) * 100
      const feather = (48 / s.height) * 100
      const hideStart = Math.max(0, ((c.top - s.top) / s.height) * 100 - pad)
      const hideEnd = Math.min(100, ((c.bottom - s.top) / s.height) * 100 + pad)
      const fadeStart = Math.max(0, hideStart - feather)
      const fadeEnd = Math.min(100, hideEnd + feather)
      setMask(
        `linear-gradient(to bottom, black 0%, black ${fadeStart.toFixed(1)}%, rgba(0,0,0,${DIM_ALPHA}) ${hideStart.toFixed(1)}%, ` +
          `rgba(0,0,0,${DIM_ALPHA}) ${hideEnd.toFixed(1)}%, black ${fadeEnd.toFixed(1)}%, black 100%)`,
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

// Two real counters, and only two. The row used to carry a third tile — "$0 /
// upfront to see it built" — rendered identically to its neighbours, and a
// zero sitting in a line of count-ups doesn't read as a promise, it reads as a
// counter that failed to start. The $0 claim now gets its own seal (see
// ZeroSeal) so it can't be mistaken for a broken number again.
// One counter, beside the seal. There used to be a second tile carrying a
// niche count (4 — dental, aesthetic, real estate, interior design); the niche
// is now every clinic type rather than a fixed list of verticals, so counting
// them measures nothing. It was dropped outright rather than backfilled with
// another number for the sake of symmetry.
const STATS = [{ value: 80, suffix: '+' }]

export function Hero() {
  const { t, dir } = useLang()
  const { contentReady } = useIntro()
  const labels = [t.hero.stat1l]
  const show3D = useShouldRender3D()
  const heroRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const heroMask = useContentMask(heroRef, contentRef, t.hero.sub)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const introProgress = useMotionValue(0)
  const [resolved, setResolved] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [headlinePlay, setHeadlinePlay] = useState(false)
  const [mountScene, setMountScene] = useState(false)

  // The instrument's own glitch -> calibrated beat. Starts when the scene is
  // actually on screen (not on mount, so it can't play out over a blank
  // canvas) but no longer gates anything else — the headline has already
  // appeared by the time most connections get here.
  useEffect(() => {
    if (!show3D || !sceneReady) return
    const resolveTimer = setTimeout(() => {
      setResolved(true)
      animate(introProgress, 1, { duration: RESOLVE_DURATION, ease: EASE })
    }, RESOLVE_AT * 1000)
    return () => clearTimeout(resolveTimer)
  }, [show3D, sceneReady, introProgress])

  // Both timers below start from the intro's resolve beat rather than from
  // mount. Counting from mount would have burned them down behind the intro
  // overlay, so the hero would be sitting fully revealed the instant the
  // overlay lifted — there'd be nothing left to hand off to. Worse for
  // SCENE_MOUNT_DELAY specifically: it would fire the ~960KB three.js import
  // *during* the intro, and that chunk's parse cost on the main thread is
  // exactly the contention the comment above it exists to avoid — it would
  // have starved the intro's own animation instead of the headline's.
  //
  // `contentReady` is true from first paint when there is no intro (repeat
  // visit, reduced motion), so the original mount-relative timing is preserved
  // unchanged on those loads.

  // Headline copy on a short fixed timer, independent of the 3D scene's load
  // state entirely — the primary content should never wait on a decorative
  // asset, regardless of how slow that asset's chunk is to fetch.
  useEffect(() => {
    if (!contentReady) return
    const timer = setTimeout(() => setHeadlinePlay(true), HEADLINE_DELAY * 1000)
    return () => clearTimeout(timer)
  }, [contentReady])

  // Don't even start the 3D scene's dynamic import until the headline is
  // done — see SCENE_MOUNT_DELAY above.
  useEffect(() => {
    if (!contentReady) return
    const timer = setTimeout(() => setMountScene(true), SCENE_MOUNT_DELAY * 1000)
    return () => clearTimeout(timer)
  }, [contentReady])

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
      {show3D && mountScene && (
        <>
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
          </div>
          {/* Deliberately NOT inside the masked wrapper above: it sits at
              inset-y-15%..85%, the same band the mask hides to protect text
              legibility, so a masked sweep is mathematically invisible on
              every viewport where the mask is doing its job. It's a one-shot
              0.6s beat, not a persistent legibility risk like the instrument
              itself, so it doesn't need the same protection. */}
          {sceneReady && <PulseSweep dir={dir} />}
        </>
      )}
      <div ref={contentRef}>
        <RevealGroup className="mx-auto max-w-4xl px-6 text-center" stagger={0.1} play={contentReady}>
          {/* Specialisation, stated before the hook. To a clinic owner "the
              agency that only does clinics" is a stronger signal than any
              claim the headline could make, so it goes first — and it keeps
              the PulseDot, which doubles as the scene's ready indicator. */}
          <RevealItem className="mb-5 flex items-center justify-center gap-2.5">
            <PulseDot active={!show3D || resolved} />
            <span className="type-eyebrow text-accent">{t.hero.eyebrow}</span>
          </RevealItem>

          <h1 className="type-display text-balance text-[2.6rem] sm:text-6xl md:text-7xl">
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
              <Button data-cursor="link" variant="cta" size="lg" onClick={() => scrollToId('contact')} className="px-8">
                {t.hero.cta}
              </Button>
            </Magnetic>
          </RevealItem>

          {/* Narrower than it was: the row carried two counters plus the seal,
              and at max-w-xl a single counter leaves the group floating apart
              rather than reading as one credential block. */}
          <RevealItem className="mx-auto mt-12 flex max-w-md flex-col items-center gap-7 border-t border-border pt-7 sm:flex-row sm:justify-center sm:gap-8">
            <dl className="flex items-start justify-center gap-8 sm:gap-9">
              {STATS.map((stat, i) => (
                <StatCell key={i} {...stat} label={labels[i]} />
              ))}
            </dl>
            <div aria-hidden className="hidden h-11 w-px shrink-0 bg-border sm:block" />
            <ZeroSeal label={t.hero.stat3l} />
          </RevealItem>
        </RevealGroup>
      </div>
    </section>
  )
}

// The scan line: sweeps once across the instrument on load, and its arrival is
// the beat that starts the dial lighting its graduations.
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
  // A short flat plateau at full opacity with tiny fade slivers reads as a
  // flash/blink, not a glow — most of the curve should be the rise and fall
  // themselves, eased, so brightness feels like it's breathing in and out
  // rather than snapping on and off.
  const opacity = useTransform(progress, [0, 0.4, 0.6, 1], [0, 1, 1, 0], {
    ease: [easeInOut, easeInOut, easeInOut],
  })

  useEffect(() => {
    const controls = animate(progress, 1, { duration: SWEEP_DURATION, delay: SWEEP_DELAY, ease: EASE })
    return () => controls.stop()
  }, [progress])

  return (
    <motion.div
      aria-hidden
      // pointer-events-none is load-bearing, not tidiness. This is an absolutely
      // positioned, full-width band across the middle 70% of the hero, and it
      // stays mounted after its one-shot sweep finishes. Being positioned, it
      // paints above the static content wrapper, and opacity:0 does not stop an
      // element receiving clicks — so without this it sits invisibly on top of
      // the headline and the CTA and swallows every click on them.
      className="pointer-events-none absolute inset-y-[15%] start-0 h-auto w-full will-change-transform"
      style={{ x, opacity }}
    >
      <div className="h-full w-px bg-accent shadow-[0_0_18px_3px_var(--accent)]" />
    </motion.div>
  )
})

function StatCell({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { ref, value: animated } = useCountUp(value)

  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd
        ref={ref as never}
        className="text-3xl font-semibold text-accent tabular-nums tracking-tight sm:text-4xl"
      >
        {animated}
        {suffix}
      </dd>
      <div className="mt-1 max-w-[8.5rem] text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

// The zero-risk promise, deliberately built as a stamped seal rather than a
// third counter: a ring, the only champagne accent on the screen, and no
// tabular-nums treatment that would let it pass for a running total. The "$0"
// is dir-locked because in an RTL paragraph the currency mark would otherwise
// be free to reorder around the digit.
function ZeroSeal({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="relative inline-flex size-14 shrink-0 items-center justify-center rounded-full border border-accent-premium/45 bg-accent-premium/[0.07] text-accent-premium">
        <span
          aria-hidden
          className="absolute inset-[3px] rounded-full border border-dashed border-accent-premium/25"
        />
        <span dir="ltr" className="text-lg font-semibold">
          $0
        </span>
      </span>
      <span className="max-w-[9.5rem] text-start text-xs leading-snug text-muted-foreground">
        {label}
      </span>
    </div>
  )
}
