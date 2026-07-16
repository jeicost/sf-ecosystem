// Homepage — NC Global Assets
// Port from: clients/nc-global-assets/src/App.jsx (Vite SPA)
// Fase 1: Home page core sections (Hero, HeroStrip, Tape, Intro, MarketStats, WhatWeDo)

import { Hero } from '@/components/sections/Hero'
import { HeroStrip } from '@/components/sections/HeroStrip'
import { Tape } from '@/components/sections/Tape'
import { Intro } from '@/components/sections/Intro'
import { MarketStats } from '@/components/sections/MarketStats'
import { WhatWeDo } from '@/components/sections/WhatWeDo'
import { OperatingPartner } from '@/components/sections/OperatingPartner'
import { WhyThailand } from '@/components/sections/WhyThailand'
import { Infrastructure } from '@/components/sections/Infrastructure'
import { WhoWeWorkWith } from '@/components/sections/WhoWeWorkWith'
import { OurModel } from '@/components/sections/OurModel'
import { CompareSection } from '@/components/sections/CompareSection'
import { Ecosystem } from '@/components/sections/Ecosystem'
import { BrandsProjects } from '@/components/sections/BrandsProjects'

export const metadata = {
  title: 'NC Global Assets — Bangkok Operating Partner for International Brands',
  description: 'Enter Thailand with infrastructure, local team & operational base. No setup from scratch. Real revenue from day one.',
  openGraph: {
    type: 'website',
    url: 'https://www.ncglobalassets.com',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
}

export default function HomePage() {
  return (
    <>
      {/* Fase 1: Core home sections */}
      <Hero />
      <HeroStrip />
      <Tape />
      <Intro />
      <MarketStats />
      <WhatWeDo />

      {/* Fase 2: Secondary home sections */}
      <OperatingPartner />
      <WhyThailand />
      <Infrastructure />
      <WhoWeWorkWith />
      <OurModel />
      <CompareSection />
      <Ecosystem />
      <BrandsProjects />

      {/* Fase 3: Bottom sections (Testimonials, Team, FAQ, LeadMagnet, FinalCTA) - TODO */}
    </>
  )
}
