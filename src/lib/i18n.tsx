import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type Lang = 'en' | 'ar'

type Dict = {
  nav: {
    work: string
    process: string
    pricing: string
    contact: string
    cta: string
  }
  hero: {
    /** Specialisation line above the headline. Not a claim, a category. */
    eyebrow: string
    h1a: string
    h1b: string
    sub: string
    cta: string
    stat1l: string
    /** Label under the $0 promise seal — the seal itself carries the "$0". */
    stat3l: string
  }
  portfolio: {
    kicker: string
    heading: string
    /** Carries the anonymisation disclaimer. It is stated here and nowhere
     *  else — repeated on every card it stops reading as candour and starts
     *  reading as a template gallery. */
    sub: string
    viewLabel: string
    dialogWhatWeFixed: string
    close: string
  }
  process: {
    kicker: string
    heading: string
    steps: { n: string; title: string; desc: string }[]
  }
  pricing: {
    kicker: string
    heading: string
    /** Frames the range as a range. Never presented as a quote. */
    sub: string
    range: string
    rangeNote: string
    terms: { label: string; desc: string }[]
  }
  contact: {
    kicker: string
    heading: string
    sub: string
    cta: string
    emailLabel: string
    whatsappLabel: string
  }
  footer: {
    tagline: string
    legalLine: string
    rights: string
  }
}

const en: Dict = {
  nav: {
    work: 'Work',
    process: 'Process',
    pricing: 'Pricing',
    contact: 'Contact',
    cta: 'Book a Call',
  },
  hero: {
    eyebrow: 'Dental & Aesthetic Clinics — Gulf',
    h1a: 'We build the better version of your website.',
    h1b: 'Then we ask if you want it.',
    sub: 'We find dental and aesthetic clinics running on broken or outdated sites and start rebuilding before we ever pitch you — book a quick call and watch the new version live, before you spend a cent.',
    cta: 'Book a Call',
    stat1l: 'Sites rebuilt',
    stat3l: 'Upfront to see it built',
  },
  portfolio: {
    kicker: 'The Work',
    heading: '80+ rebuilds. Real clinics. Real problems fixed.',
    sub: 'Every project below started as a cold-outreach rebuild, finished before a single call was booked. Client names and cities are removed to protect confidentiality — the sites, the ratings and the problems are real.',
    viewLabel: 'View',
    dialogWhatWeFixed: 'What we fixed',
    close: 'Close',
  },
  process: {
    kicker: 'How It Works',
    heading: "We don't pitch. We build first.",
    steps: [
      {
        n: '01',
        title: 'We find the site',
        desc: "We look for clinics running on a broken, outdated, or dead website — the kind that's quietly costing them patients.",
      },
      {
        n: '02',
        title: 'We build it free',
        desc: 'No payment upfront, no commitment. We tell you your new site is already underway, get a quick call on the books, and finish building it in time to show you live.',
      },
      {
        n: '03',
        title: 'You see it working',
        desc: "We walk you through it live on the call. If it's better, we talk. If it's not, you've lost nothing and we walk away.",
      },
    ],
  },
  pricing: {
    kicker: 'Pricing',
    heading: 'It depends on the website you want.',
    sub: 'Most builds land somewhere in this range. Where yours sits depends on how much site there is to build — pages, languages, booking, the things only your clinic needs. The exact number comes after we have talked, not before.',
    range: '$3,000 - $10,000',
    rangeNote: 'Typical project range',
    terms: [
      { label: '50% to start', desc: 'A deposit once you have seen the build and decided to go ahead.' },
      { label: '50% before delivery', desc: 'The balance is due before the site goes live, not after.' },
      { label: 'Live in under 24h', desc: 'Once the final payment clears, your site is live in less than a day.' },
    ],
  },
  contact: {
    kicker: 'Get In Touch',
    heading: 'Want to see what yours could look like?',
    sub: "Tell us about your clinic and we'll show you, free — no strings, no pressure.",
    cta: 'Book a Call',
    emailLabel: 'Email',
    whatsappLabel: 'WhatsApp',
  },
  footer: {
    tagline: 'We build it first. You decide after.',
    legalLine: 'ZayloGear Agency is directed by',
    rights: 'All rights reserved.',
  },
}

const ar: Dict = {
  nav: {
    work: 'أعمالنا',
    process: 'طريقة العمل',
    pricing: 'الأسعار',
    contact: 'تواصل',
    cta: 'احجز مكالمة',
  },
  hero: {
    eyebrow: 'متخصصون في مواقع العيادات السنية والتجميلية — الخليج',
    h1a: 'نبني لك نسخة أفضل من موقعك.',
    h1b: 'بعدين نسألك إذا تبيها.',
    sub: 'نلقى العيادات السنية والتجميلية اللي موقعها قديم أو معطل ونبدأ نبنيه قبل لا نسوّق لك رسميًا — احجز مكالمة سريعة وشوف النسخة الجديدة شغالة أمامك، قبل ما تدفع ريال.',
    cta: 'احجز مكالمة',
    stat1l: 'موقع أعدنا بناءه',
    stat3l: 'مقدّم مالي لترى الموقع جاهزًا',
  },
  portfolio: {
    kicker: 'أعمالنا',
    heading: '+80 إعادة بناء. عيادات حقيقية. مشاكل حقيقية انحلّت.',
    sub: 'كل مشروع تحت بدأ كإعادة بناء ضمن تواصل بارد، خلّصناه قبل ما نحجز أي مكالمة. أسماء العملاء ومدنهم محذوفة حفاظًا على خصوصيتهم — أما المواقع والتقييمات والمشاكل فحقيقية 100%.',
    viewLabel: 'عرض',
    dialogWhatWeFixed: 'اللي صلحناه',
    close: 'إغلاق',
  },
  process: {
    kicker: 'طريقة عملنا',
    heading: 'ما نسوّق. نبني أول.',
    steps: [
      {
        n: '01',
        title: 'نلقى الموقع',
        desc: 'ندور على عيادات موقعها معطل، قديم، أو متوقف — النوع اللي يخسرهم مراجعين بصمت.',
      },
      {
        n: '02',
        title: 'نبنيه مجانًا',
        desc: 'بدون مقدّم مالي، بدون التزام. نقول لك إن موقعك الجديد قيد التنفيذ، نحجز مكالمة سريعة، ونخلّصه قبل الموعد عشان نوريك شغال.',
      },
      {
        n: '03',
        title: 'تشوفه شغال',
        desc: 'نوريك الموقع شغال معك مباشرة في المكالمة. إذا كان أفضل، نتكلم بالتفاصيل. إذا لا، ما خسرت شي وننسحب.',
      },
    ],
  },
  pricing: {
    kicker: 'الأسعار',
    heading: 'يعتمد على الموقع اللي تبيه.',
    sub: 'أغلب المشاريع تجي ضمن هذا النطاق. وين يوقف سعرك يعتمد على حجم الموقع نفسه — عدد الصفحات، اللغات، الحجز، والأشياء اللي تخص عيادتك بالذات. الرقم النهائي يجي بعد ما نتكلم، مو قبل.',
    range: '$3,000 - $10,000',
    rangeNote: 'النطاق المعتاد للمشروع',
    terms: [
      { label: '50% للبدء', desc: 'دفعة مقدّمة بعد ما تشوف الموقع وتقرر تكمل.' },
      { label: '50% قبل التسليم', desc: 'الباقي يُدفع قبل ما ينزل الموقع، مو بعده.' },
      { label: 'ينزل خلال أقل من 24 ساعة', desc: 'بعد ما توصلنا الدفعة الأخيرة، موقعك يصير شغّال بأقل من يوم.' },
    ],
  },
  contact: {
    kicker: 'تواصل معنا',
    heading: 'تبي تشوف شكل موقعك الجديد؟',
    sub: 'قول لنا عن عيادتك ونورّيك مجانًا — بدون التزام وبدون ضغط.',
    cta: 'احجز مكالمة',
    emailLabel: 'الإيميل',
    whatsappLabel: 'واتساب',
  },
  footer: {
    tagline: 'نبنيه أول. أنت تقرر بعدين.',
    legalLine: 'وكالة زايلوجير يديرها',
    rights: 'جميع الحقوق محفوظة.',
  },
}

const dicts: Record<Lang, Dict> = { en, ar }

type LangContextValue = {
  lang: Lang
  setLang: (l: Lang) => void
  t: Dict
  dir: 'ltr' | 'rtl'
}

const LangContext = createContext<LangContextValue | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar')

  const setLang = (l: Lang) => {
    setLangState(l)
    document.documentElement.lang = l
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'
  }

  const value = useMemo<LangContextValue>(
    () => ({
      lang,
      setLang,
      t: dicts[lang],
      dir: lang === 'ar' ? 'rtl' : 'ltr',
    }),
    [lang],
  )

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LangProvider')
  return ctx
}
