import { MotionConfig } from 'motion/react'
import { LangProvider } from '@/lib/i18n'
import { IntroProvider } from '@/lib/intro'
import { SmoothScroll } from '@/lib/smooth-scroll'
import { Cursor } from '@/components/cursor'
import { GrainOverlay } from '@/components/grain-overlay'
import { ScrollPulseSpine } from '@/components/scroll-pulse-spine'
import { SiteNav } from '@/components/site-nav'
import { Hero } from '@/components/hero'
import { Portfolio } from '@/components/portfolio'
import { Process } from '@/components/process'
import { Pricing } from '@/components/pricing'
import { Contact } from '@/components/contact'
import { SiteFooter } from '@/components/site-footer'

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LangProvider>
        <SmoothScroll />
        <IntroProvider>
          <Cursor />
          <GrainOverlay />
          <ScrollPulseSpine />
          <SiteNav />
          <main>
            <Hero />
            <Portfolio />
            <Process />
            <Pricing />
            <Contact />
          </main>
          <SiteFooter />
        </IntroProvider>
      </LangProvider>
    </MotionConfig>
  )
}

export default App
