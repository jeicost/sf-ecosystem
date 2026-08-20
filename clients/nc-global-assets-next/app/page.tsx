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
import { Testimonials } from '@/components/sections/Testimonials'
import { Team } from '@/components/sections/Team'
import { FAQ } from '@/components/sections/FAQ'
import { LeadMagnet } from '@/components/sections/LeadMagnet'
import { FinalCTA } from '@/components/sections/FinalCTA'
import { draftMode } from 'next/headers'
import { loadCmsSections, loadCmsSectionsLive, mergeCms } from '@/lib/cms-pages'
import { DraftBanner } from '@/components/DraftBanner'
import { BRANDS_PROJECTS_DEFAULTS, COMPARE_DEFAULTS, ECOSYSTEM_DEFAULTS, FAQ_DEFAULTS, FINAL_CTA_DEFAULTS, HERO_DEFAULTS, INFRASTRUCTURE_DEFAULTS, INTRO_DEFAULTS, LEAD_MAGNET_DEFAULTS, MARKET_STATS_DEFAULTS, OPERATING_PARTNER_DEFAULTS, OUR_MODEL_DEFAULTS, TEAM_DEFAULTS, TESTIMONIALS_DEFAULTS, WHAT_WE_DO_DEFAULTS, WHO_WE_WORK_WITH_DEFAULTS, WHY_THAILAND_DEFAULTS } from '@/lib/section-defaults'

export const metadata = {
  title: 'NC Global Assets — Bangkok Operating Partner for International Brands',
  description: 'Enter Thailand with infrastructure, local team & operational base. No setup from scratch. Real revenue from day one.',
  openGraph: {
    type: 'website',
    url: 'https://www.ncglobalassets.com',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
}

export default async function HomePage() {
  // Draft Mode (EDUX-N4 preview): live-fetch (possibly unpublished) instead
  // of the build-time bake when active; any failure falls back to the bake.
  const { isEnabled: isDraft } = await draftMode()
  const cms = isDraft ? (await loadCmsSectionsLive('home')) ?? loadCmsSections('home') : loadCmsSections('home')

  return (
    <>
      {isDraft && <DraftBanner />}
      {/* Fase 1: Core home sections */}
      <Hero data={mergeCms(HERO_DEFAULTS, cms['hero']?.data)} />
      <HeroStrip />
      <Tape />
      <Intro data={mergeCms(INTRO_DEFAULTS, cms['intro']?.data)} />
      <MarketStats data={mergeCms(MARKET_STATS_DEFAULTS, cms['market-stats']?.data)} />
      <WhatWeDo data={mergeCms(WHAT_WE_DO_DEFAULTS, cms['what-we-do']?.data)} />

      {/* Fase 2: Secondary home sections */}
      <OperatingPartner data={mergeCms(OPERATING_PARTNER_DEFAULTS, cms['operating-partner']?.data)} />
      <WhyThailand data={mergeCms(WHY_THAILAND_DEFAULTS, cms['why-thailand']?.data)} />
      <Infrastructure data={mergeCms(INFRASTRUCTURE_DEFAULTS, cms['infrastructure']?.data)} />
      <WhoWeWorkWith data={mergeCms(WHO_WE_WORK_WITH_DEFAULTS, cms['who-we-work-with']?.data)} />
      <OurModel data={mergeCms(OUR_MODEL_DEFAULTS, cms['our-model']?.data)} />
      <CompareSection data={mergeCms(COMPARE_DEFAULTS, cms['compare']?.data)} />
      <Ecosystem data={mergeCms(ECOSYSTEM_DEFAULTS, cms['ecosystem']?.data)} />
      <BrandsProjects data={mergeCms(BRANDS_PROJECTS_DEFAULTS, cms['brands-projects']?.data)} />

      {/* Fase 3: Bottom sections (Testimonials, Team, FAQ, LeadMagnet, FinalCTA) */}
      <Testimonials data={mergeCms(TESTIMONIALS_DEFAULTS, cms['testimonials']?.data)} />
      <Team data={mergeCms(TEAM_DEFAULTS, cms['team']?.data)} />
      <FAQ data={mergeCms(FAQ_DEFAULTS, cms['faq']?.data)} />
      <LeadMagnet data={mergeCms(LEAD_MAGNET_DEFAULTS, cms['lead-magnet']?.data)} />
      <FinalCTA data={mergeCms(FINAL_CTA_DEFAULTS, cms['final-cta']?.data)} />
    </>
  )
}
