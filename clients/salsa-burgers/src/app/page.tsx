import { draftMode } from "next/headers";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { FlavorIntro } from "@/components/FlavorIntro";
import { MenuSummary } from "@/components/MenuSummary";
import { RitualSteps } from "@/components/RitualSteps";
import { DIYExperience } from "@/components/DIYExperience";
import { SauceSection } from "@/components/SauceSection";
import { DeliverySection } from "@/components/DeliverySection";
import { SalsaIcons } from "@/components/SalsaIcons";
import { Footer } from "@/components/Footer";
import { DraftBanner } from "@/components/DraftBanner";
import { loadCmsSectionsLive } from "@/lib/cms-live";

function loadCmsSections(): Record<string, { type: string; data: Record<string, unknown> }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pages = require('../../content/pages.json')
    return pages?.home?.sections ?? {}
  } catch {
    return {}
  }
}

export default async function Home() {
  // Draft Mode (EDUX-N4 preview): when active, prefer a live request-time
  // fetch from sf-cms (may include unpublished drafts) over the build-time
  // bake. Any failure falls back to the static content.
  const { isEnabled: isDraft } = await draftMode()
  const cms = isDraft ? (await loadCmsSectionsLive('home')) ?? loadCmsSections() : loadCmsSections()

  return (
    <main className="bg-[#0a0a0a]">
      {isDraft && <DraftBanner />}
      <Nav />
      <Hero      cmsData={cms['hero']?.data ?? null} />
      <FlavorIntro />
      <MenuSummary />
      <RitualSteps />
      <DIYExperience />
      <SauceSection cmsData={cms['sauces']?.data ?? null} />
      <DeliverySection />
      <SalsaIcons />
      <Footer />
    </main>
  );
}
