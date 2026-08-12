import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { faqJsonLd } from "@/lib/jsonld";
import { draftMode } from "next/headers";
import { loadCmsSections, loadCmsSectionsLive, section, mergeContent } from "@/lib/cms-pages";
import { DraftBanner } from "@/components/DraftBanner";
import { defaultHomeContent } from "@/lib/content/home";
import { defaultHomeContent as defaultHomeContentEn } from "@/lib/content/en/home";
import type { Locale } from "@/lib/i18n";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Ticker } from "@/components/sections/Ticker";
import { Guides } from "@/components/sections/Guides";
import { Curation } from "@/components/sections/Curation";
import { GuideObject } from "@/components/sections/GuideObject";
import { CityAI } from "@/components/sections/CityAI";
import { CreatorsBridge } from "@/components/sections/CreatorsBridge";
import { Waitlist } from "@/components/sections/Waitlist";
import { FAQ } from "@/components/sections/FAQ";
import { Wordmark } from "@/components/sections/Wordmark";
import { CTA } from "@/components/sections/CTA";

export const metadata: Metadata = buildMetadata({
  title: "Discoolver — Guías de viaje curadas de creadores",
  description:
    "Lo mejor del año en cada ciudad, editado en una guía que querrás guardar: curación humana de creadores, digital y papel, con IA para recorrer la ciudad.",
  path: "/guias",
});

export async function GuiasPage({ locale = "es" }: { locale?: Locale }) {
  // Draft Mode (EDUX-N4 preview): live-fetch (possibly unpublished) instead
  // of the build-time bake when active; any failure falls back to the bake.
  const { isEnabled: isDraft } = await draftMode();
  const slug = locale === "en" ? ("home-en" as const) : ("home" as const);
  const fallback = locale === "en" ? defaultHomeContentEn : defaultHomeContent;
  const cms = isDraft ? (await loadCmsSectionsLive(slug)) ?? loadCmsSections(slug) : loadCmsSections(slug);
  const content = mergeContent(fallback, section(cms, "content"));

  const faqItems = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
    question: content[`faq_q${n}` as keyof typeof content],
    answer: content[`faq_a${n}` as keyof typeof content],
  }));

  return (
    <>
      {isDraft && <DraftBanner />}
      <Nav locale={locale} />
      <main>
        <Hero content={content} locale={locale} />
        <Ticker content={content} />
        <Guides content={content} locale={locale} />
        <Curation content={content} />
        <GuideObject content={content} />
        <CityAI content={content} />
        {/* El puente a creators va DESPUÉS del cierre B2C: en el punto de máxima
            intención de compra estaba derivando el tráfico caliente a /influencers. */}
        <Waitlist content={content} locale={locale} />
        <FAQ content={content} />
        <CreatorsBridge content={content} locale={locale} />
        <Wordmark />
        <CTA content={content} locale={locale} />
      </main>
      <Footer locale={locale} brandDesc={content.footer_brand_desc} copyright={content.footer_copyright} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqItems)) }}
      />
    </>
  );
}

export default function Page() {
  return <GuiasPage locale="es" />;
}
