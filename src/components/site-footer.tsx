import { useLang } from '@/lib/i18n'

const LEGAL_ENTITY = 'ZYL Commerce LLC'
const ADDRESS = '9169 W State St #2637, Garden City, ID 83714'

export function SiteFooter() {
  const { t } = useLang()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 text-center sm:flex-row sm:justify-between sm:text-start">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo-white.png"
            alt="ZayloGear"
            className="h-9 w-9"
            style={{ filter: 'drop-shadow(0 0 6px color-mix(in oklch, var(--signal) 35%, transparent))' }}
          />
          <div className="text-xs text-muted-foreground">{t.footer.tagline}</div>
        </div>
        <div className="text-xs text-muted-foreground">
          <div>
            {t.footer.legalLine} <span dir="ltr">{LEGAL_ENTITY}</span>
          </div>
          <div dir="ltr">{ADDRESS}</div>
          <div className="mt-1">
            © {year} <span dir="ltr">{LEGAL_ENTITY}</span>. {t.footer.rights}
          </div>
        </div>
      </div>
    </footer>
  )
}
