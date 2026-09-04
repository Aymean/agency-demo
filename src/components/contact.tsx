import { Mail, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Magnetic } from '@/components/magnetic'
import { PulseDot } from '@/components/pulse-dot'
import { Reveal } from '@/components/reveal'
import { useLang } from '@/lib/i18n'

const EMAIL = 'contact@zaylogear.com'
const WHATSAPP_DISPLAY = '+966 57 351 3946'
const WHATSAPP_HREF = 'https://wa.me/966573513946'

export function Contact() {
  const { t } = useLang()

  return (
    <section id="contact" className="border-t border-border py-16 md:py-24">
      <Reveal lock className="mx-auto max-w-2xl px-6 text-center">
        <div className="type-eyebrow flex items-center justify-center gap-2 text-muted-foreground">
          <PulseDot speed="slow" />
          {t.contact.kicker}
        </div>
        <h2 className="type-display mt-3 text-balance text-3xl sm:text-4xl md:text-[2.75rem]">
          {t.contact.heading}
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">{t.contact.sub}</p>

        <div className="mt-8 flex justify-center">
          <Magnetic>
            <Button
              data-cursor="link"
              variant="cta"
              size="lg"
              className="px-8"
              nativeButton={false}
              render={<a href={`mailto:${EMAIL}`} />}
            >
              {t.contact.cta}
            </Button>
          </Magnetic>
        </div>

        <div className="mx-auto mt-10 flex max-w-sm flex-col gap-4 border-t border-border pt-7 text-sm sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center sm:gap-8">
          <a
            href={`mailto:${EMAIL}`}
            data-cursor="link"
            className="flex items-center justify-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Mail className="size-4" />
            {EMAIL}
          </a>
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener"
            data-cursor="link"
            className="flex items-center justify-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <MessageCircle className="size-4" />
            {/* Dir-locked for the same reason as the nav wordmark and the
                hero's "$0" seal: a run of digit groups with no strong-RTL
                characters of its own takes the paragraph's embedding
                direction, so in an RTL context the space-separated groups
                reorder (last group first) even though each group's own
                digits stay correct — "+966 57 351 3946" was rendering as
                "3946 351 57 966+". */}
            <span dir="ltr">{WHATSAPP_DISPLAY}</span>
          </a>
        </div>
      </Reveal>
    </section>
  )
}
