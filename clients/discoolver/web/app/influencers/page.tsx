import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { faqJsonLd } from "@/lib/jsonld";
import { draftMode } from "next/headers";
import { loadCmsSections, loadCmsSectionsLive, section, mergeContent } from "@/lib/cms-pages";
import { DraftBanner } from "@/components/DraftBanner";
import { defaultInfluencersContent } from "@/lib/content/influencers";
import { defaultInfluencersContent as defaultInfluencersContentEn } from "@/lib/content/en/influencers";
import type { Locale } from "@/lib/i18n";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { InfluencerHero } from "@/components/sections/influencers/InfluencerHero";
import { TrackTop } from "@/components/sections/influencers/TrackTop";
import { TrackMicro } from "@/components/sections/influencers/TrackMicro";
import { InfluencerFaq } from "@/components/sections/influencers/InfluencerFaq";
import { InfluencerForms } from "@/components/sections/influencers/InfluencerForms";

export const metadata: Metadata = buildMetadata({
  title: "Publica tu guía — Discoolver para creators",
  description:
    "Editamos contigo tu guía de ciudad: sale con tu nombre y te llevas parte de cada venta. ¿Empiezas? Envíanos tu mejor recomendación en vídeo.",
  path: "/influencers",
});

export async function InfluencersPage({ locale = "es" }: { locale?: Locale }) {
  const { isEnabled: isDraft } = await draftMode();
  const slug = locale === "en" ? ("influencers-en" as const) : ("influencers" as const);
  const fallback = locale === "en" ? defaultInfluencersContentEn : defaultInfluencersContent;
  const cms = isDraft
    ? (await loadCmsSectionsLive(slug)) ?? loadCmsSections(slug)
    : loadCmsSections(slug);
  const content = mergeContent(fallback, section(cms, "content"));

  const faqItems = [1, 2, 3, 4, 5].map((n) => ({
    question: content[`faq_q${n}` as keyof typeof content],
    answer: content[`faq_a${n}` as keyof typeof content],
  }));

  return (
    <>
      {isDraft && <DraftBanner />}
      <Nav locale={locale} />
      <main>
        <InfluencerHero content={content} />
        <TrackTop content={content} />
        <TrackMicro content={content} />
        <InfluencerFaq content={content} />
        <InfluencerForms content={content} locale={locale} />
      </main>
      <Footer locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqItems)) }} />
    </>
  );
}

export default function Page() {
  return <InfluencersPage locale="es" />;
}
