import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type Lang = 'en' | 'ar'

type Dict = {
  nav: {
    work: string
    process: string
    contact: string
    cta: string
  }
  hero: {
    kicker: string
    h1a: string
    h1b: string
    sub: string
    cta: string
    stat1l: string
    stat2l: string
    stat3l: string
  }
  portfolio: {
    kicker: string
    heading: string
    sub: string
    viewLabel: string
    dialogWhatWeFixed: string
    dialogNote: string
    close: string
  }
  process: {
    kicker: string
    heading: string
    steps: { n: string; title: string; desc: string }[]
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
    contact: 'Contact',
    cta: 'Book a Call',
  },
  hero: {
    kicker: '50+ real businesses redesigned — before they ever paid us',
    h1a: 'We build the better version of your website.',
    h1b: 'Then we ask if you want it.',
    sub: "We find local businesses running on broken or outdated sites and start rebuilding before we ever pitch you — book a quick call and watch the new version live, before you spend a cent.",
    cta: 'Book a Call',
    stat1l: 'Businesses redesigned',
    stat2l: 'Industries covered',
    stat3l: 'Upfront to see it built',
  },
  portfolio: {
    kicker: 'The Work',
    heading: '50+ redesigns. Real businesses. Real results.',
    sub: "Every project below started as a cold-outreach redesign, built free before a single call was booked. Business names are shown as concepts to protect client confidentiality; the work itself is real.",
    viewLabel: 'View',
    dialogWhatWeFixed: 'What we fixed',
    dialogNote: 'Shown as a de-branded concept — real client identity is never used in our own marketing.',
    close: 'Close',
  },
  process: {
    kicker: 'How It Works',
    heading: "We don't pitch. We build first.",
    steps: [
      {
        n: '01',
        title: 'We find the site',
        desc: "We look for local businesses running on a broken, outdated, or dead website — the kind that's quietly costing them customers.",
      },
      {
        n: '02',
        title: 'We build it free',
        desc: "No payment upfront, no commitment. We tell you your new site is already underway, get a quick call on the books, and finish building it in time to show you live.",
      },
      {
        n: '03',
        title: 'You see it working',
        desc: "We walk you through it live on the call. If it's better, we talk. If it's not, you've lost nothing and we walk away.",
      },
    ],
  },
  contact: {
    kicker: 'Get In Touch',
    heading: 'Want to see what yours could look like?',
    sub: "Tell us about your business and we'll show you, free — no strings, no pressure.",
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
    contact: 'تواصل',
    cta: 'احجز مكالمة',
  },
  hero: {
    kicker: '+50 مشروعًا حقيقيًا أعدنا تصميمه — قبل ما ناخذ منهم ريال',
    h1a: 'نبني لك نسخة أفضل من موقعك.',
    h1b: 'بعدين نسألك إذا تبيها.',
    sub: 'نلقى الشركات المحلية اللي موقعها قديم أو معطل ونبدأ نبنيه قبل لا نسوّق لك رسميًا — احجز مكالمة سريعة وشوف النسخة الجديدة شغالة أمامك، قبل ما تدفع ريال.',
    cta: 'احجز مكالمة',
    stat1l: 'مشروع أعدنا تصميمه',
    stat2l: 'مجالات مختلفة',
    stat3l: 'مقدّم مالي لترى الموقع جاهزًا',
  },
  portfolio: {
    kicker: 'أعمالنا',
    heading: '+50 إعادة تصميم. شركات حقيقية. نتائج حقيقية.',
    sub: 'كل مشروع تحت بدأ كإعادة تصميم مجانية بنيناها قبل ما نحجز أي مكالمة. أسماء الشركات معروضة كنماذج عامة حفاظًا على خصوصية العملاء — لكن الشغل نفسه حقيقي 100%.',
    viewLabel: 'عرض',
    dialogWhatWeFixed: 'اللي صلحناه',
    dialogNote: 'معروض كنموذج مجرّد من الهوية — ما نستخدم هوية العميل الحقيقية في تسويقنا الخاص أبدًا.',
    close: 'إغلاق',
  },
  process: {
    kicker: 'طريقة عملنا',
    heading: 'ما نسوّق. نبني أول.',
    steps: [
      {
        n: '01',
        title: 'نلقى الموقع',
        desc: 'ندور على شركات محلية موقعها معطل، قديم، أو متوقف — النوع اللي يخسرهم عملاء بصمت.',
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
  contact: {
    kicker: 'تواصل معنا',
    heading: 'تبي تشوف شكل موقعك الجديد؟',
    sub: 'قول لنا عن شركتك ونورّيك مجانًا — بدون التزام وبدون ضغط.',
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
