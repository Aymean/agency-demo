import { useState } from 'react'
import { useMotionValueEvent, useScroll } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Magnetic } from '@/components/magnetic'
import { useLang } from '@/lib/i18n'
import { cn } from '@/lib/utils'

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export function SiteNav() {
  const { t, lang, setLang } = useLang()
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
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault()
            scrollToId('top')
          }}
          data-cursor="link"
          className="flex items-center"
        >
          <img src="/logo-black.png" alt="ZayloGear" className="h-8 w-8" />
        </a>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <button data-cursor="link" onClick={() => scrollToId('work')} className="transition-colors hover:text-foreground">
            {t.nav.work}
          </button>
          <button data-cursor="link" onClick={() => scrollToId('process')} className="transition-colors hover:text-foreground">
            {t.nav.process}
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
            <Button data-cursor="link" size="sm" onClick={() => scrollToId('contact')}>
              {t.nav.cta}
            </Button>
          </Magnetic>
        </div>
      </div>
    </header>
  )
}
