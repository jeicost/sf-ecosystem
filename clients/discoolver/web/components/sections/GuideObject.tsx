import { Reveal } from "@/components/ui/Reveal";
import type { HomeContent } from "@/lib/content/home";

/** Block 2 — the object: digital vs print formats, real price ranges only. */
export function GuideObject({ content }: { content: HomeContent }) {
  return (
    <section className="section" id="objeto" aria-labelledby="object-title">
      <div className="container">
        <div className="object-grid">
          <Reveal delay={0}>
            <div>
              <span className="eyebrow">{content.object_eyebrow}</span>
              <h2 className="display-lg section__title" id="object-title">
                {content.object_title_1} <span style={{ color: "var(--primary)" }}>{content.object_title_em}</span>
              </h2>
              <p className="section__lead">{content.object_text}</p>
            </div>
          </Reveal>
          <div className="formats">
            {/* Las tarjetas de precio son el momento de decisión y no llevaban
                ninguna acción: ahora las dos van a la lista de lanzamiento. */}
            <Reveal delay={120}>
              <a href="/#waitlist" className="format-card" aria-label={`${content.format_1_name} — apuntarme a la lista de lanzamiento`}>
                <div className="format-card__top">
                  <h3 className="format-card__name">{content.format_1_name}</h3>
                </div>
                <p className="format-card__price">{content.format_1_price}</p>
                <p className="format-card__desc">{content.format_1_desc}</p>
              </a>
            </Reveal>
            <Reveal delay={220}>
              <a href="/#waitlist" className="format-card format-card--paper" aria-label={`${content.format_2_name} — apuntarme a la lista de lanzamiento`}>
                <div className="format-card__top">
                  <h3 className="format-card__name">{content.format_2_name}</h3>
                  <span className="format-card__chip">{content.format_2_chip}</span>
                </div>
                <p className="format-card__price">{content.format_2_price}</p>
                <p className="format-card__desc">{content.format_2_desc}</p>
              </a>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
