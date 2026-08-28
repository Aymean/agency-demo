import { ZayloMark } from '@/components/zaylo-mark'
import { useLang } from '@/lib/i18n'

const LEGAL_ENTITY = 'ZYL Commerce LLC'

export function SiteFooter() {
  const { t } = useLang()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border py-7">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-6 text-center sm:flex-row sm:justify-between sm:text-start">
        <div className="flex items-center gap-2.5">
          <ZayloMark
            className="size-9 shrink-0 text-foreground"
            title="Zaylo Agency"
            style={{ filter: 'drop-shadow(0 0 6px color-mix(in oklch, var(--accent) 35%, transparent))' }}
          />
          <div className="text-xs text-muted-foreground">{t.footer.tagline}</div>
        </div>
        <div className="text-xs text-muted-foreground">
          <div>
            {t.footer.legalLine} <span dir="ltr">{LEGAL_ENTITY}</span>
          </div>
          <div className="mt-1">
            © {year} <span dir="ltr">{LEGAL_ENTITY}</span>. {t.footer.rights}
          </div>
        </div>
      </div>
    </footer>
  )
}
