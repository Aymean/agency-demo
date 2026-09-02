import { useState } from 'react'
import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Magnetic } from '@/components/magnetic'
import { ZayloMark } from '@/components/zaylo-mark'
import { useIntro } from '@/lib/intro'
import { useLang } from '@/lib/i18n'
import { cn } from '@/lib/utils'

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export function SiteNav() {
  const { t, lang, setLang } = useLang()
  const { contentReady } = useIntro()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 8))

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b bg-background/80 backdrop-blur-md transition-all duration-300',
        scrolled ? 'border-border/60 shadow-[0_1px_0_0_var(--border)]' : 'border-transparent',
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        {/* The permanent lockup the intro resolves into: the same three traced
            paths that just assembled on screen, now at rest beside the
            wordmark. It fades in on the intro's resolve beat and stays for the
            session — when there's no intro to wait for (repeat visit, reduced
            motion) contentReady is already true and it's simply present, with
            no animation to flash. */}
        <motion.a
          href="#top"
          onClick={(e) => {
            e.preventDefault()
            scrollToId('top')
          }}
          data-cursor="link"
          className="flex items-center gap-2.5"
          initial={false}
          animate={{ opacity: contentReady ? 1 : 0, y: contentReady ? 0 : -6 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <ZayloMark className="size-[26px] shrink-0" title="Zaylo Agency" />
          {/* Direction-locked: a brand name should not reorder in RTL, the same
              reasoning that dir-locks the "$0" seal in hero.tsx. */}
          <span dir="ltr" className="type-eyebrow hidden text-foreground sm:inline">
            Zaylo Agency
          </span>
        </motion.a>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <button data-cursor="link" onClick={() => scrollToId('process')} className="transition-colors hover:text-foreground">
            {t.nav.process}
          </button>
          <button data-cursor="link" onClick={() => scrollToId('work')} className="transition-colors hover:text-foreground">
            {t.nav.work}
          </button>
          <button data-cursor="link" onClick={() => scrollToId('pricing')} className="transition-colors hover:text-foreground">
            {t.nav.pricing}
          </button>
          <button data-cursor="link" onClick={() => scrollToId('contact')} className="transition-colors hover:text-foreground">
            {t.nav.contact}
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            data-cursor="link"
            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Toggle language"
          >
            {lang === 'en' ? 'AR' : 'EN'}
          </button>
          <Magnetic className="hidden sm:inline-flex" strength={0.3}>
            <Button data-cursor="link" variant="cta" size="sm" onClick={() => scrollToId('contact')}>
              {t.nav.cta}
            </Button>
          </Magnetic>
        </div>
      </div>
    </header>
  )
}
