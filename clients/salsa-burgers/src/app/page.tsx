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

function loadCmsSections(): Record<string, { type: string; data: Record<string, unknown> }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pages = require('../../content/pages.json')
    return pages?.home?.sections ?? {}
  } catch {
    return {}
  }
}

export default function Home() {
  const cms = loadCmsSections()

  return (
    <main className="bg-[#0a0a0a]">
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
