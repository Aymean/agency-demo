export type PortfolioItem = {
  slug: string
  image: string
  label: { en: string; ar: string }
  region: { en: string; ar: string }
  descriptor: { en: string; ar: string }
}

export const portfolioItems: PortfolioItem[] = [
  {
    slug: 'greendent',
    image: '/portfolio/greendent.png',
    label: { en: 'Dental Clinic — Concept', ar: 'عيادة أسنان — نموذج' },
    region: { en: 'Gulf coastal city', ar: 'مدينة ساحلية خليجية' },
    descriptor: {
      en: 'Multi-doctor directory with a real-time WhatsApp booking flow.',
      ar: 'دليل أطباء متعدد مع نظام حجز مباشر عبر واتساب.',
    },
  },
  {
    slug: 'bently',
    image: '/portfolio/bently.png',
    label: { en: 'Dental Group — Concept', ar: 'مجموعة أسنان — نموذج' },
    region: { en: 'Gulf coastal city', ar: 'مدينة ساحلية خليجية' },
    descriptor: {
      en: 'Bilingual booking wizard with live doctor availability.',
      ar: 'معالج حجز ثنائي اللغة مع مواعيد أطباء مباشرة.',
    },
  },
  {
    slug: 'lavida',
    image: '/portfolio/lavida.png',
    label: { en: 'Aesthetic Clinic — Concept', ar: 'عيادة تجميل — نموذج' },
    region: { en: 'Gulf metro area', ar: 'منطقة حضرية خليجية' },
    descriptor: {
      en: 'Before/after gallery and doctor bios pulled from a buried subpage onto the homepage.',
      ar: 'معرض قبل/بعد وسير ذاتية للأطباء نقلناها من صفحة مدفونة إلى الرئيسية.',
    },
  },
  {
    slug: 'arcave',
    image: '/portfolio/arcave.png',
    label: { en: 'Architecture Studio — Concept', ar: 'استوديو عمارة — نموذج' },
    region: { en: 'Gulf metro area', ar: 'منطقة حضرية خليجية' },
    descriptor: {
      en: 'Project gallery with real delivery stats and a WhatsApp quote wizard.',
      ar: 'معرض أعمال مع إحصائيات تسليم حقيقية ومعالج طلب عرض سعر عبر واتساب.',
    },
  },
  {
    slug: 'icondesign',
    image: '/portfolio/icondesign.png',
    label: { en: 'Interior Design Studio — Concept', ar: 'استوديو تصميم داخلي — نموذج' },
    region: { en: 'Multi-city studio', ar: 'استوديو متعدد المدن' },
    descriptor: {
      en: 'Filterable project gallery with a 3D-visualization pitch built in.',
      ar: 'معرض مشاريع قابل للفلترة مع عرض تصور ثلاثي الأبعاد.',
    },
  },
  {
    slug: 'gravity',
    image: '/portfolio/gravity.png',
    label: { en: 'Real Estate Platform — Concept', ar: 'منصة عقارية — نموذج' },
    region: { en: 'Gulf metro area', ar: 'منطقة حضرية خليجية' },
    descriptor: {
      en: 'Bilingual property search added where the original site was English-only.',
      ar: 'بحث عقاري ثنائي اللغة أُضيف لموقع كان بالإنجليزي فقط.',
    },
  },
  {
    slug: 'urbannest',
    image: '/portfolio/urbannest.png',
    label: { en: 'Real Estate Brokerage — Concept', ar: 'وسيط عقاري — نموذج' },
    region: { en: 'Gulf metro area', ar: 'منطقة حضرية خليجية' },
    descriptor: {
      en: 'Awards and a five-star review history surfaced after the original site went dark.',
      ar: 'الجوائز وسجل التقييمات الخماسية ظهرت بعد ما الموقع الأصلي توقف.',
    },
  },
]
