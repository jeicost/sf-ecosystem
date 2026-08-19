import { Reveal } from "@/components/ui/Reveal";
import { GuiaFoto } from "@/components/ui/GuiaFoto";
import { Icon } from "@/components/ui/Icon";
import type { HomeContent } from "@/lib/content/home";

/** Block 3 — the AI layer: the guide becomes a route. */
export function CityAI({ content }: { content: HomeContent }) {
  const features = [
    { icon: "pin" as const, title: content.ai_feat_1_title, desc: content.ai_feat_1_desc },
    { icon: "compass" as const, title: content.ai_feat_2_title, desc: content.ai_feat_2_desc },
    { icon: "buddy" as const, title: content.ai_feat_3_title, desc: content.ai_feat_3_desc },
  ];

  return (
    <section className="section band-card" id="ia" aria-labelledby="ai-title">
      <div className="container">
        <div className="ai-grid">
          <Reveal delay={0}>
            <div>
              <span className="eyebrow">{content.ai_eyebrow}</span>
              <h2 className="display-lg section__title" id="ai-title">
                {content.ai_title_1}
                <br />
                <span style={{ color: "var(--primary)" }}>{content.ai_title_em}</span>
              </h2>
              <p className="section__lead">{content.ai_text}</p>
            </div>
          </Reveal>
          <div className="ai-feats" role="list">
            {features.map((feature, i) => (
              <Reveal delay={120 + i * 100} key={feature.title}>
                <div className="ai-feat" role="listitem">
                  <span className="ai-feat__icon" aria-hidden="true">
                    <Icon name={feature.icon} size={22} />
                  </span>
                  <div>
                    <h3 className="ai-feat__title">{feature.title}</h3>
                    <p className="ai-feat__desc">{feature.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
          <div className="container">
        <GuiaFoto src="/assets/guias/ia-calle.jpg" alt="Una mano con el móvil abierto en el mapa, caminando por una calle al anochecer" />
      </div>
    </section>
  );
}
