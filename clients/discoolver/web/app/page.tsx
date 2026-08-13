import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { faqJsonLd, websiteJsonLd } from "@/lib/jsonld";
import { draftMode } from "next/headers";
import { loadCmsSections, loadCmsSectionsLive, section, mergeContent } from "@/lib/cms-pages";
import { applyPlatformStats } from "@/lib/platform-stats";
import { DraftBanner } from "@/components/DraftBanner";
import { defaultAppHomeContent } from "@/lib/content/app-home";
import { defaultAppHomeContent as defaultAppHomeContentEn } from "@/lib/content/en/app-home";
import type { Locale } from "@/lib/i18n";
import { Nav } from "@/components/app/Nav";
import { Footer } from "@/components/app/Footer";
import { Hero } from "@/components/app/Hero";
import { Ticker } from "@/components/app/Ticker";
import { Categories } from "@/components/app/Categories";
import { TravelBrain } from "@/components/app/TravelBrain";
import { HowItWorks } from "@/components/app/HowItWorks";
import { Experiences } from "@/components/app/Experiences";
import { MapSection } from "@/components/app/MapSection";
import { ForCreators } from "@/components/app/ForCreators";
import { GuiasBridge } from "@/components/app/GuiasBridge";
import { AppComingSoon } from "@/components/app/AppComingSoon";
import { FAQ } from "@/components/app/FAQ";
import { Wordmark } from "@/components/sections/Wordmark";
import { CTA } from "@/components/app/CTA";

/**
 * La home de discoolver.com — la plataforma.
 *
 * Hasta el 12-ago-2026 esto era la tienda de guías, que vivía en la raíz. El
 * CEO decidió que el dominio lo encabece el producto principal (la app) y que
 * las guías pasen a `/guias`. Esta página es la que servía el proyecto
 * `discoolver-app-landing`, traída aquí para que las dos vivan en el mismo
 * dominio y compartan nav, footer, legales y sitemap.
 *
 * Sus componentes viven en `components/app/` a propósito: los nombres chocaban
 * con los de la tienda (Hero, CTA, FAQ, Ticker) y son piezas distintas. Lo que
 * NO se duplicó es el CSS: de las 206 reglas del proyecto viejo, 200 ya estaban
 * aquí idénticas byte a byte —es el mismo sistema de diseño— y solo hubo que
 * traer seis.
 */
export const metadata: Metadata = buildMetadata({
  title: "Discoolver — Descubre tu ciudad antes que el resto",
  description:
    "Sitios recomendados por creadores locales reales, revisados por editores y potenciados por IA. Madrid, Barcelona y Málaga ya abiertas — entra hoy por la web.",
  path: "/",
});

export async function AppHomePage({ locale = "es" }: { locale?: Locale }) {
  // Draft Mode (EDUX-N4 preview): live-fetch (possibly unpublished) instead
  // of the build-time bake when active; any failure falls back to the bake.
  const { isEnabled: isDraft } = await draftMode();
  const slug = locale === "en" ? ("app-home-en" as const) : ("app-home" as const);
  const fallback = locale === "en" ? defaultAppHomeContentEn : defaultAppHomeContent;
  const cms = isDraft ? (await loadCmsSectionsLive(slug)) ?? loadCmsSections(slug) : loadCmsSections(slug);
  const content = await applyPlatformStats(mergeContent(fallback, section(cms, "content")), locale);

  const faqItems = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
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
        <Categories content={content} locale={locale} />
        <TravelBrain content={content} />
        <HowItWorks content={content} />
        <Experiences content={content} />
        <MapSection content={content} />
        <GuiasBridge content={content} locale={locale} />
        <ForCreators content={content} />
        <AppComingSoon content={content} locale={locale} />
        <FAQ content={content} />
        <Wordmark />
        <CTA content={content} locale={locale} />
      </main>
      <Footer locale={locale} brandDesc={content.footer_brand_desc} copyright={content.footer_copyright} />
      {/* El nodo WebSite describe el SITIO y por tanto lleva idioma. Vivía en
          el layout raíz, que es compartido y no sabe qué ruta sirve: las 13
          páginas de /en salían declarando `es-ES` mientras su og:locale decía
          `en_US`. Va aquí, en la home de cada idioma. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd(locale)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqItems)) }}
      />
    </>
  );
}

export default function Page() {
  return <AppHomePage locale="es" />;
}
