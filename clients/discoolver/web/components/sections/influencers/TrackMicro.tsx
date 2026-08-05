import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import type { InfluencersContent } from "@/lib/content/influencers";

/**
 * Track 2 — micro creators: one video recommendation. Three steps, what the
 * editors actually look for, and the explicit ladder up to Track 1 (that is
 * the whole point of having two tracks on the same page).
 */
export function TrackMicro({ content }: { content: InfluencersContent }) {
  const steps = [
    { label: content.micro_step_1_label, text: content.micro_step_1_text },
    { label: content.micro_step_2_label, text: content.micro_step_2_text },
    { label: content.micro_step_3_label, text: content.micro_step_3_text },
  ];
  const criteria = [content.micro_criteria_1, content.micro_criteria_2, content.micro_criteria_3];

  return (
    <section className="section band-card" id="tu-video" aria-labelledby="micro-title">
      <div className="container">
        <Reveal delay={0}>
          <div className="section__head">
            <div className="section__head-text">
              <span className="eyebrow">{content.micro_eyebrow}</span>
              <h2 className="display-lg section__title" id="micro-title">
                {content.micro_title_1} <span style={{ color: "var(--primary)" }}>{content.micro_title_em}</span>
              </h2>
            </div>
            <p className="section__lead" style={{ maxWidth: 380 }}>
              {content.micro_lead}
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

        <div className="track-criteria">
          <Reveal delay={0}>
            <h3 className="track-criteria__title">{content.micro_criteria_title}</h3>
            <ul className="hero-notes track-criteria__list">
              {criteria.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120}>
            <div className="track-ladder">
              <p className="track-ladder__text">{content.micro_ladder}</p>
              <a href="#form-video" className="btn btn-primary">
                {content.micro_cta} <Icon name="arrow-right" size={14} />
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
