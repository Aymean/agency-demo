import { Reveal, RevealGroup, RevealItem, type RevealFrom } from '@/components/reveal'
import { useLang } from '@/lib/i18n'

/* Public pricing. A range, framed as a range.
 *
 * Everything here is a stated fact about how the business bills — the band,
 * the 50/50 split, the sub-24h turnaround. Nothing invents a tier, a discount,
 * a countdown or a "most popular" badge, because none of those exist, and a
 * page that has just promised "$0 upfront to see it built" cannot afford to
 * look like it is playing pricing games two sections later.
 */

// The three terms enter from opposite sides and settle in the middle, the same
// converge-and-lock reading the intro's three logo pieces had.
const TERM_DIRECTIONS: RevealFrom[] = ['start', 'up', 'end']

export function Pricing() {
  const { t } = useLang()

  return (
    <section id="pricing" className="border-t border-border py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal lock className="mx-auto max-w-2xl text-center">
          <div className="type-eyebrow text-muted-foreground">{t.pricing.kicker}</div>
          <h2 className="type-display mt-3 text-balance text-3xl sm:text-4xl md:text-[2.75rem]">
            {t.pricing.heading}
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">{t.pricing.sub}</p>
        </Reveal>

        <Reveal delay={0.1} className="mx-auto mt-12 max-w-md text-center">
          {/* Direction-locked, exactly as ZeroSeal locks its "$0": inside an RTL
              paragraph the currency marks and the dash would otherwise reorder
              around the digits and quietly print a different range. */}
          <div
            dir="ltr"
            className="type-display text-4xl text-accent tabular-nums sm:text-5xl"
          >
            {t.pricing.range}
          </div>
          <div className="type-eyebrow mt-3 text-muted-foreground">{t.pricing.rangeNote}</div>
        </Reveal>

        <RevealGroup
          className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-8 border-t border-border pt-10 sm:grid-cols-3 sm:gap-6"
          stagger={0.12}
        >
          {t.pricing.terms.map((term, i) => (
            <RevealItem key={term.label} from={TERM_DIRECTIONS[i]} className="text-center sm:text-start">
              <h3 className="text-base font-semibold tracking-tight">{term.label}</h3>
              <p className="mt-2 text-pretty text-sm text-muted-foreground">{term.desc}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
