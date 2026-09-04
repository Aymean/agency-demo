export type PortfolioItem = {
  slug: string
  /** Cropped 16:10 hero shot used for the grid card. */
  image: string
  /** Full scroll-height capture of the real page, shown scrollably in the dialog. */
  imageFull: string
  /**
   * Trade plus a location phrase, varied deliberately from card to card. The
   * old data repeated three stock strings ("Gulf coastal city" x2, "Gulf metro
   * area" x4) and stamped "— Concept"/"— نموذج" on every single one, which
   * turned a wall of real client work into what looked like a template
   * gallery. The anonymisation disclaimer is now stated once, in the section
   * intro, and nowhere else.
   */
  label: { en: string; ar: string }
  /**
   * The one specific, real, still-anonymised thing that was wrong with this
   * client's old site. Never a category, never a stock phrase — if two cards
   * could swap hooks without anyone noticing, the hooks are too generic.
   */
  hook: { en: string; ar: string }
  /** What the rebuild actually shipped. Shown in the dialog. */
  descriptor: { en: string; ar: string }
}

export const portfolioItems: PortfolioItem[] = [
  {
    slug: 'greendent',
    image: '/portfolio/greendent.png',
    imageFull: '/portfolio/greendent-full.jpg',
    label: { en: 'Dental clinic — Gulf coast', ar: 'عيادة أسنان — ساحل الخليج' },
    hook: {
      en: 'Twelve doctors and 24 patient reviews — not one of them visible on the old site.',
      ar: 'اثنا عشر طبيبًا و24 تقييم مراجع — ولا واحد منهم كان ظاهر بالموقع القديم.',
    },
    descriptor: {
      en: 'Multi-doctor directory with a real-time WhatsApp booking flow.',
      ar: 'دليل أطباء متعدد مع نظام حجز مباشر عبر واتساب.',
    },
  },
  {
    slug: 'bently',
    image: '/portfolio/bently.png',
    imageFull: '/portfolio/bently-full.jpg',
    label: { en: 'Dental group — Gulf port city', ar: 'مجموعة أسنان — مدينة ميناء خليجية' },
    hook: {
      en: 'A booking flow that only worked in English, in a clinic whose patients book in Arabic.',
      ar: 'نظام حجز يشتغل بالإنجليزي بس، في عيادة مراجعينها يحجزون بالعربي.',
    },
    descriptor: {
      en: 'Bilingual booking wizard with live doctor availability.',
      ar: 'معالج حجز ثنائي اللغة مع مواعيد أطباء مباشرة.',
    },
  },
  {
    slug: 'lavida',
    image: '/portfolio/lavida.png',
    imageFull: '/portfolio/lavida-full.jpg',
    label: { en: 'Aesthetic clinic — Gulf beachfront district', ar: 'عيادة تجميل — حي شاطئي خليجي' },
    hook: {
      en: '4.8★ from more than 1,100 patients, buried three clicks below the fold.',
      ar: 'تقييم 4.8 نجوم من أكثر من 1,100 مراجع — مدفون على بعد ثلاث نقرات.',
    },
    descriptor: {
      en: 'Before/after gallery, medical licence and doctor bios pulled from a buried subpage onto the homepage.',
      ar: 'معرض قبل/بعد والترخيص الطبي وسير الأطباء نقلناها من صفحة مدفونة إلى الرئيسية.',
    },
  },
]
