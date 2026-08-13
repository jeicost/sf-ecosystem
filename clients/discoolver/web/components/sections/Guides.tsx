import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { Book3D, type CoverArt } from "@/components/ui/Book3D";
import type { HomeContent } from "@/lib/content/home";
import { BuyButtons } from "@/components/ui/BuyButtons";
import { CHECKOUT_ABIERTO, type Sku } from "@/lib/checkout";
import type { Locale } from "@/lib/i18n";

/**
 * The star section: the guide collection as physical objects. First card
 * uses the real Madrid/Pablo cover; the rest are CSS typographic covers
 * (flat color + big type — no invented photos). Cover palettes riff on the
 * real cover art (blue + peach) plus the discoolver print magenta #C8006B.
 */
export function Guides({ content, locale = "es" }: { content: HomeContent; locale?: Locale }) {
  // Paletas de la tanda de portadas aprobada por el CEO el 2026-08-11
  // (una por ciudad: A Madrid, C Barcelona, E Ronda, G Málaga, F Ibiza, H Bangkok).
  // Las firmas son ficticias a propósito hasta que cada creador firme; el nombre
  // real sustituye al de ejemplo desde el CMS, sin tocar código.
  const PALETTES: { spineColor: string; bg: string; ink: string; accent: string }[] = [
    { spineColor: "#22578a", bg: "#22578a", ink: "#f2f0ea", accent: "#f4b47a" }, // Madrid
    { spineColor: "#8f004d", bg: "#c8006b", ink: "#f2f0ea", accent: "#c9ff3f" }, // Barcelona
    { spineColor: "#c47f3e", bg: "#c47f3e", ink: "#141414", accent: "#141414" }, // Ronda (crema sobre ocre daba 2,86:1)
    { spineColor: "#141414", bg: "#c9ff3f", ink: "#141414", accent: "#c8006b" }, // Málaga
    { spineColor: "#141414", bg: "#f2f0ea", ink: "#141414", accent: "#c8006b" }, // Ibiza
    { spineColor: "#8f004d", bg: "#8f004d", ink: "#f2f0ea", accent: "#f4b47a" }, // Bangkok
  ];
  // Qué guías se venden ya (por ciudad). El resto sigue en "Avísame" hasta
  // que su edición cierre — añadir aquí una ciudad la pone a la venta.
  const SKUS: Record<string, { digital: Sku; papel: Sku }> = {
    Madrid: { digital: "madrid-digital", papel: "madrid-papel" },
  };

  const guides = [1, 2, 3, 4, 5, 6].map((n, i) => {
    const city = content[`guide_${n}_city` as keyof HomeContent];
    const sub = content[`guide_${n}_sub` as keyof HomeContent];
    const pal = PALETTES[i];
    return {
      city,
      sub,
      meta: content[`guide_${n}_meta` as keyof HomeContent],
      cta: content[`guide_${n}_cta` as keyof HomeContent],
      spineText: `discoolver · ${city} 2026`,
      spineColor: pal.spineColor,
      cover: { kind: "typo", city, sub, bg: pal.bg, ink: pal.ink, accent: pal.accent, chip: locale === "en" ? "Discoolver Guide · 2026" : undefined } as CoverArt,
    };
  });

  return (
    <section className="section guides" id="guias" aria-labelledby="guides-title">
      <div className="container">
        <Reveal delay={0}>
          <div className="section__head">
            <div className="section__head-text">
              <span className="eyebrow">{content.guides_eyebrow}</span>
              <h2 className="display-lg section__title" id="guides-title">
                {content.guides_title_1} <span style={{ color: "var(--primary)" }}>{content.guides_title_em}</span>
              </h2>
              <p className="section__lead">{content.guides_lead}</p>
            </div>
          </div>
        </Reveal>
        <div className="guides-grid">
          {guides.map((guide, i) => (
            <Reveal delay={i * 90} key={`${guide.city}-${guide.sub}`}>
              {/* Con la tienda abierta, la ficha vendible lleva botones de
                  compra y NO puede ser un enlace (botón dentro de <a> es HTML
                  inválido). Las no vendibles siguen enlazando a la lista. */}
              {CHECKOUT_ABIERTO && SKUS[guide.city] ? (
                <article className="bookcard">
                  <div className="bookcard__stage book-scene">
                    <Book3D cover={guide.cover} spineText={guide.spineText} spineColor={guide.spineColor} />
                  </div>
                  <div className="bookcard__meta">
                    <h3 className="bookcard__title">
                      {guide.city} <span className="bookcard__sub">{guide.sub}</span>
                    </h3>
                    <p className="bookcard__price">{guide.meta}</p>
                    <BuyButtons digital={SKUS[guide.city].digital} papel={SKUS[guide.city].papel} locale={locale} />
                  </div>
                </article>
              ) : (
                <Link href="#waitlist" data-ciudad={guide.city} className="bookcard" aria-label={`${guide.city} — ${guide.cta}`}>
                  <div className="bookcard__stage book-scene">
                    <Book3D cover={guide.cover} spineText={guide.spineText} spineColor={guide.spineColor} />
                  </div>
                  <div className="bookcard__meta">
                    <h3 className="bookcard__title">
                      {guide.city} <span className="bookcard__sub">{guide.sub}</span>
                    </h3>
                    <p className="bookcard__price">{guide.meta}</p>
                    <p className="bookcard__price">{guide.cta} →</p>
                  </div>
                </Link>
              )}
            </Reveal>
          ))}
          <Reveal delay={270}>
            <Link href="#waitlist" className="bookcard bookcard--ghost" aria-label={`${content.guides_ghost_city} ${content.guides_ghost_text}`}>
              <div className="bookcard__stage">
                <div className="ghostcover">
                  <span className="ghostcover__plus" aria-hidden="true">
                    +
                  </span>
                  <span className="ghostcover__city">{content.guides_ghost_city}</span>
                </div>
              </div>
              <div className="bookcard__meta">
                <h3 className="bookcard__title">
                  {content.guides_ghost_city} <span className="bookcard__sub">{content.guides_ghost_text}</span>
                </h3>
                <p className="bookcard__price">{content.guides_ghost_cta} →</p>
              </div>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
