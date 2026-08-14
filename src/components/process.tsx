import { ProcessIcon } from '@/components/process-icon'
import { Reveal, RevealGroup, RevealItem } from '@/components/reveal'
import { useLang } from '@/lib/i18n'

const ICON_VARIANTS = ['flatline', 'rising', 'signal'] as const

export function Process() {
  const { t } = useLang()

  return (
    <section id="process" className="border-t border-border bg-secondary/40 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {t.process.kicker}
          </div>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.process.heading}
          </h2>
        </Reveal>

        <RevealGroup
          className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8"
          stagger={0.12}
        >
          {t.process.steps.map((step, i) => (
            <RevealItem key={step.n} className="relative">
              <ProcessIcon variant={ICON_VARIANTS[i]} />
              <div className="mt-4 text-sm font-semibold text-muted-foreground/60">{step.n}</div>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-2 text-pretty text-sm text-muted-foreground">{step.desc}</p>
              {i < t.process.steps.length - 1 && (
                <div aria-hidden className="mt-8 h-px w-full bg-border md:hidden" />
              )}
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
