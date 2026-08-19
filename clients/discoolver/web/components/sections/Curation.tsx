import { Reveal } from "@/components/ui/Reveal";
import { GuiaFoto } from "@/components/ui/GuiaFoto";
import type { HomeContent } from "@/lib/content/home";

/** Block 1 — human curation: from saved reels to an edited guide. */
export function Curation({ content }: { content: HomeContent }) {
  const flow = [
    { label: content.flow_1_label, text: content.flow_1_text },
    { label: content.flow_2_label, text: content.flow_2_text },
    { label: content.flow_3_label, text: content.flow_3_text },
  ];

  return (
    <>
      {/* El ancla vieja se conserva: había enlaces a #curacion por el pie y
          por el menú, y romperlos no aporta nada. */}
      <span id="curacion" aria-hidden="true" />
      <section className="section" id="como-se-elige" aria-labelledby="curation-title">
      <div className="container">
        <Reveal delay={0}>
          <div className="section__head">
            <div className="section__head-text">
              <span className="eyebrow">{content.curation_eyebrow}</span>
              <h2 className="display-lg section__title" id="curation-title">
                {content.curation_title}
              </h2>
            </div>
            <p className="section__lead" style={{ maxWidth: 380 }}>
              {content.curation_text}
            </p>
          </div>
        </Reveal>
        <div className="flow" role="list">
          {flow.map((step, i) => (
            <Reveal delay={i * 100} key={step.label} className="flow__cell">
              <div className="flow__step" role="listitem">
                <span className="flow__num" aria-hidden="true">
                  0{i + 1}
                </span>
                <h3 className="flow__label">{step.label}</h3>
                <p className="flow__text">{step.text}</p>
                {i < flow.length - 1 && (
                  <span className="flow__arrow" aria-hidden="true">
                    →
                  </span>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
          <div className="container">
        <GuiaFoto src="/assets/guias/proceso.jpg" alt="Pruebas de página con marcas a lápiz y una pila de descartes" />
      </div>
    </section>
    </>
  );
}
