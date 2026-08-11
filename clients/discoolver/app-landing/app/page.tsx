import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { faqJsonLd } from "@/lib/jsonld";
import { draftMode } from "next/headers";
import { loadCmsSections, loadCmsSectionsLive, section, mergeContent } from "@/lib/cms-pages";
import { applyPlatformStats } from "@/lib/platform-stats";
import { DraftBanner } from "@/components/DraftBanner";
import { defaultHomeContent } from "@/lib/content/home";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Ticker } from "@/components/sections/Ticker";
import { Categories } from "@/components/sections/Categories";
import { TravelBrain } from "@/components/sections/TravelBrain";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Experiences } from "@/components/sections/Experiences";
import { MapSection } from "@/components/sections/MapSection";
import { ForCreators } from "@/components/sections/ForCreators";
import { AppComingSoon } from "@/components/sections/AppComingSoon";
import { Testimonials } from "@/components/sections/Testimonials";
import { FAQ } from "@/components/sections/FAQ";
import { Wordmark } from "@/components/sections/Wordmark";
import { CTA } from "@/components/sections/CTA";

export const metadata: Metadata = buildMetadata({
  title: "Discoolver — Descubre tu ciudad antes que el resto",
  description:
    "Sitios recomendados por creadores locales reales, revisados por editores y potenciados por IA. Madrid, Barcelona y Málaga ya abiertas — entra hoy por la web.",
  path: "/",
});

export default async function HomePage() {
  // Draft Mode (EDUX-N4 preview): live-fetch (possibly unpublished) instead
  // of the build-time bake when active; any failure falls back to the bake.
  const { isEnabled: isDraft } = await draftMode();
  const cms = isDraft ? (await loadCmsSectionsLive("home")) ?? loadCmsSections("home") : loadCmsSections("home");
  const content = await applyPlatformStats(mergeContent(defaultHomeContent, section(cms, "content")));

  const faqItems = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
    question: content[`faq_q${n}` as keyof typeof content],
    answer: content[`faq_a${n}` as keyof typeof content],
  }));

  return (
    <>
      {isDraft && <DraftBanner />}
      <Nav />
      <main>
        <Hero content={content} />
        <Ticker content={content} />
        <Categories content={content} />
        <TravelBrain content={content} />
        <HowItWorks content={content} />
        <Experiences content={content} />
        <MapSection content={content} />
        <ForCreators content={content} />
        <AppComingSoon content={content} />
        <Testimonials content={content} />
        <FAQ content={content} />
        <Wordmark />
        <CTA content={content} />
      </main>
      <Footer brandDesc={content.footer_brand_desc} copyright={content.footer_copyright} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqItems)) }}
      />
    </>
  );
}
