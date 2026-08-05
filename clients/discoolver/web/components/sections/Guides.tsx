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
  const guides: { city: string; sub: string; meta: string; spineText: string; spineColor: string; cover: CoverArt }[] = [
    {
      city: content.guide_1_city,
      sub: content.guide_1_sub,
      meta: content.guide_1_meta,
      spineText: "discoolver · Madrid 2026",
      spineColor: "#22578a",
      // Portada tipográfica a propósito: la portada de creator lleva su foto
      // y su firma, y hasta que haya acuerdo firmado y foto cedida no se
      // publica ninguna imagen de persona asociada a su nombre.
      cover: { kind: "typo", city: content.guide_1_city, sub: content.guide_1_sub, bg: "#22578a", ink: "#f2f0ea", accent: "#f4b47a" },
    },
    {
      city: content.guide_2_city,
      sub: content.guide_2_sub,
      meta: content.guide_2_meta,
      spineText: "discoolver · Bangkok 2026",
      spineColor: "#c47f3e",
      cover: { kind: "typo", city: content.guide_2_city, sub: content.guide_2_sub, bg: "#f4b47a", ink: "#141414", accent: "#c8006b" },
    },
    {
      city: content.guide_3_city,
      sub: content.guide_3_sub,
      meta: content.guide_3_meta,
      spineText: "discoolver · Madrid 2026",
      spineColor: "#8f004d",
      cover: { kind: "typo", city: content.guide_3_city, sub: content.guide_3_sub, bg: "#c8006b", ink: "#f2f0ea", accent: "#c9ff3f" },
    },
  ];

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
              <article className="bookcard">
                <div className="bookcard__stage book-scene">
                  <Book3D cover={guide.cover} spineText={guide.spineText} spineColor={guide.spineColor} />
                </div>
                <div className="bookcard__meta">
                  <h3 className="bookcard__title">
                    {guide.city} <span className="bookcard__sub">{guide.sub}</span>
                  </h3>
                  <p className="bookcard__price">{guide.meta}</p>
                </div>
              </article>
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
