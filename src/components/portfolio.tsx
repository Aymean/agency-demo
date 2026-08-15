import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { BrowserMockup } from '@/components/browser-mockup'
import { Reveal, RevealGroup, RevealItem } from '@/components/reveal'
import { useLang } from '@/lib/i18n'
import { usePointerFine } from '@/lib/use-pointer-fine'
import { cn } from '@/lib/utils'
import { portfolioItems, type PortfolioItem } from '@/lib/portfolio-data'

// Static/glitch overlay that wipes away to reveal the real screenshot beneath —
// the same broken-to-resolved beat as the hero mockup, in cheap 2D form.
// Desktop reveals on hover (pointer-fine); touch devices reveal on scroll-into-view.
function ScreenWipe() {
  const pointerFine = usePointerFine()

  return (
    <motion.div
      aria-hidden
      className={cn(
        'card-static pointer-events-none absolute inset-0 z-10',
        pointerFine &&
          'transition-[clip-path] duration-[850ms] ease-out [clip-path:inset(0_0_0_0%)] group-hover:[clip-path:inset(0_0_0_100%)]',
      )}
      initial={!pointerFine ? { clipPath: 'inset(0% 0% 0% 0%)' } : undefined}
      whileInView={!pointerFine ? { clipPath: 'inset(0% 0% 0% 100%)' } : undefined}
      viewport={!pointerFine ? { once: true, margin: '-15% 0px -10% 0px' } : undefined}
      transition={{ duration: 0.95, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
    />
  )
}

function ParallaxCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [22, -22])

  return (
    <motion.div ref={ref} style={{ y }}>
      {children}
    </motion.div>
  )
}

export function Portfolio() {
  const { t, lang } = useLang()

  return (
    <section id="work" className="border-t border-border py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {t.portfolio.kicker}
          </div>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.portfolio.heading}
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">{t.portfolio.sub}</p>
        </Reveal>

        <RevealGroup
          className="mt-12 grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3"
          stagger={0.07}
        >
          {portfolioItems.map((item) => (
            <RevealItem key={item.slug}>
              <Dialog>
                <DialogTrigger
                  data-cursor="view"
                  render={<button type="button" className="group block w-full text-start" />}
                >
                  <ParallaxCard>
                    <motion.div
                      whileHover={{ y: -6 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                    >
                      <div className="relative overflow-hidden rounded-lg">
                        <BrowserMockup
                          src={item.image}
                          alt={item.label[lang]}
                          className="transition-shadow duration-300 group-hover:shadow-lg"
                        />
                        <ScreenWipe />
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 origin-left scale-x-0 bg-signal shadow-[0_0_8px_var(--signal)] transition-transform duration-500 ease-out group-hover:scale-x-100"
                        />
                      </div>
                    </motion.div>
                  </ParallaxCard>
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{item.label[lang]}</div>
                      <div className="mt-0.5 text-sm text-muted-foreground">{item.region[lang]}</div>
                    </div>
                    <span className="mt-0.5 shrink-0 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                      {t.portfolio.viewLabel} →
                    </span>
                  </div>
                </DialogTrigger>

                <DialogContent className="max-w-lg sm:max-w-2xl">
                  <CaseDetail item={item} />
                </DialogContent>
              </Dialog>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}

function CaseDetail({ item }: { item: PortfolioItem }) {
  const { t, lang } = useLang()

  return (
    <>
      <BrowserMockup
        src={item.imageFull}
        alt={item.label[lang]}
        scrollable
        viewportClassName="h-[52vh] sm:h-[58vh]"
      />
      <DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <DialogTitle className="text-lg">{item.label[lang]}</DialogTitle>
          <Badge variant="secondary" className="shrink-0">
            {item.region[lang]}
          </Badge>
        </div>
        <div className="space-y-3 pt-1">
          <div>
            <div className="text-xs font-semibold tracking-wide text-foreground uppercase">
              {t.portfolio.dialogWhatWeFixed}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{item.descriptor[lang]}</p>
          </div>
          <p className="border-t border-border pt-3 text-xs text-muted-foreground/80">
            {t.portfolio.dialogNote}
          </p>
        </div>
      </DialogHeader>
    </>
  )
}
