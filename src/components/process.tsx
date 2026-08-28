import { ProcessIcon, type ProcessIconVariant } from '@/components/process-icon'
import { Reveal, RevealGroup, RevealItem, type RevealFrom } from '@/components/reveal'
import { useLang } from '@/lib/i18n'

const ICON_VARIANTS: ProcessIconVariant[] = ['radar', 'gauge', 'lock']

// Three blocks converging on the middle — the closest honest echo of the three
// logo pieces assembling in the intro, and the reason the motif reads as one
// system rather than a hero effect that died after the fold.
const STEP_DIRECTIONS: RevealFrom[] = ['start', 'up', 'end']

export function Process() {
  const { t } = useLang()

  return (
    <section id="process" className="border-t border-border bg-secondary/40 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal lock className="mx-auto max-w-2xl text-center">
          <div className="type-eyebrow text-muted-foreground">
            {t.process.kicker}
          </div>
          <h2 className="type-display mt-3 text-balance text-3xl sm:text-4xl md:text-[2.75rem]">
            {t.process.heading}
          </h2>
        </Reveal>

        <RevealGroup
          className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6"
          stagger={0.3}
        >
          {t.process.steps.map((step, i) => (
            <RevealItem key={step.n} from={STEP_DIRECTIONS[i]} className="relative">
              <ProcessIcon variant={ICON_VARIANTS[i]} />
              <div className="mt-4 text-sm font-semibold text-muted-foreground/60">{step.n}</div>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-2 text-pretty text-sm text-muted-foreground">{step.desc}</p>
              {i < t.process.steps.length - 1 && (
                <div aria-hidden className="mt-6 h-px w-full bg-border md:hidden" />
              )}
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
