import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { Book3D, type CoverArt } from "@/components/ui/Book3D";
import type { HomeContent } from "@/lib/content/home";

/**
 * The star section: the guide collection as physical objects. First card
 * uses the real Madrid/Pablo cover; the rest are CSS typographic covers
 * (flat color + big type — no invented photos). Cover palettes riff on the
 * real cover art (blue + peach) plus the discoolver print magenta #C8006B.
 */
export function Guides({ content }: { content: HomeContent }) {
  // Paletas de la tanda de portadas aprobada por el CEO el 2026-08-11
  // (una por ciudad: A Madrid, C Barcelona, E Ronda, G Málaga, F Ibiza, H Bangkok).
  // Las firmas son ficticias a propósito hasta que cada creador firme; el nombre
  // real sustituye al de ejemplo desde el CMS, sin tocar código.
  const PALETTES: { spineColor: string; bg: string; ink: string; accent: string }[] = [
    { spineColor: "#22578a", bg: "#22578a", ink: "#f2f0ea", accent: "#f4b47a" }, // Madrid
    { spineColor: "#8f004d", bg: "#c8006b", ink: "#f2f0ea", accent: "#c9ff3f" }, // Barcelona
    { spineColor: "#c47f3e", bg: "#c47f3e", ink: "#141414", accent: "#f2f0ea" }, // Ronda
    { spineColor: "#141414", bg: "#c9ff3f", ink: "#141414", accent: "#c8006b" }, // Málaga
    { spineColor: "#141414", bg: "#f2f0ea", ink: "#141414", accent: "#c8006b" }, // Ibiza
    { spineColor: "#8f004d", bg: "#8f004d", ink: "#f2f0ea", accent: "#f4b47a" }, // Bangkok
  ];
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
      cover: { kind: "typo", city, sub, bg: pal.bg, ink: pal.ink, accent: pal.accent } as CoverArt,
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
              {/* La tarjeta entera es un enlace: antes las fichas no eran
                  clicables y el visitante que quería una ciudad concreta no
                  tenía nada que hacer. Hoy el destino es la lista de
                  lanzamiento; cuando exista la ficha de producto, será ella. */}
              <Link href="/#waitlist" className="bookcard" aria-label={`${guide.city} — ${guide.cta}`}>
                <div className="bookcard__stage book-scene">
                  <Book3D cover={guide.cover} spineText={guide.spineText} spineColor={guide.spineColor} />
                </div>
                <div className="bookcard__meta">
                  <h3 className="bookcard__title">
                    {guide.city} <span className="bookcard__sub">{guide.sub}</span>
                  </h3>
                  <p className="bookcard__price">{guide.meta}</p>
                  <p className="bookcard__price" style={{ color: "var(--primary)", fontWeight: 600 }}>{guide.cta} →</p>
                </div>
              </Link>
            </Reveal>
          ))}
          <Reveal delay={270}>
            <Link href="/#waitlist" className="bookcard bookcard--ghost" aria-label={`${content.guides_ghost_city} ${content.guides_ghost_text}`}>
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
