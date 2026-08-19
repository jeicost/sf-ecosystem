import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import { Book3D } from "@/components/ui/Book3D";
import type { InfluencersContent } from "@/lib/content/influencers";

/**
 * Track 1 — creators who already move an audience: we edit their own city
 * guide and they sell it. Three steps + the guide mockup (the CSS 3D book
 * from the home, with a typographic cover standing in for "your city, your
 * name") + the two honest arguments, no invented proof.
 */
export function TrackTop({ content }: { content: InfluencersContent }) {
  const steps = [
    { label: content.top_step_1_label, text: content.top_step_1_text },
    { label: content.top_step_2_label, text: content.top_step_2_text },
    { label: content.top_step_3_label, text: content.top_step_3_text },
  ];

  return (
    <>
      {/* Dos anclas para la misma sección: el menú del creador entra por
          «cómo funciona» y el hero por la vía concreta. */}
      <span id="como-funciona" aria-hidden="true" />
      <section className="section" id="tu-guia" aria-labelledby="top-title">
      <div className="container">
        <Reveal delay={0}>
          <div className="section__head">
            <div className="section__head-text">
              <span className="eyebrow">{content.top_eyebrow}</span>
              <h2 className="display-lg section__title" id="top-title">
                {content.top_title_1} <span style={{ color: "var(--primary)" }}>{content.top_title_em}</span>
              </h2>
            </div>
            <p className="section__lead" style={{ maxWidth: 380 }}>
              {content.top_lead}
            </p>
          </div>
        </Reveal>

        <div className="flow" role="list">
          {steps.map((step, i) => (
            <Reveal delay={i * 100} key={step.label} className="flow__cell">
              <div className="flow__step" role="listitem">
                <span className="flow__num" aria-hidden="true">
                  0{i + 1}
                </span>
                <h3 className="flow__label">{step.label}</h3>
                <p className="flow__text">{step.text}</p>
                {i < steps.length - 1 && (
                  <span className="flow__arrow" aria-hidden="true">
                    →
                  </span>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        <div className="object-grid" style={{ marginTop: 96 }}>
          <Reveal delay={0}>
            <div>
              {/* La primera frase de este bloque («Un reel vive 48 horas») subió
                  al H1. La segunda se queda sola y aguanta perfectamente. */}
              <p className="track-note">{content.top_note}</p>
              <a href="#form-guia" className="btn btn-primary" style={{ marginTop: 32 }}>
                {content.top_cta} <Icon name="arrow-right" size={14} />
              </a>
            </div>
          </Reveal>
          <Reveal delay={140}>
            <div className="track-mock">
              <div className="book-scene track-mock__stage">
                <Book3D
                  cover={{ kind: "typo", city: content.top_mock_city, sub: content.top_mock_sub, bg: "#c8006b", ink: "#f2f0ea", accent: "#c9ff3f" }}
                  spineText="discoolver · tu ciudad 2026"
                  spineColor="#8f004d"
                  sizes="(max-width: 700px) 70vw, (max-width: 1100px) 40vw, 380px"
                />
              </div>
              <p className="track-mock__caption">{content.top_mock_caption}</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
    </>
  );
}
