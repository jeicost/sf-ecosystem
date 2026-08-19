import { Reveal } from "@/components/ui/Reveal";
import type { InfluencersContent } from "@/lib/content/influencers";

/**
 * Acquisition hero — one message only ("Tu guía. Tu marca. Tus ingresos.")
 * followed immediately by the two-track picker, so the visitor lands on a
 * choice without scrolling. No video background here on purpose: this page is
 * an ad destination and the LCP has to be text, not a 3 MB mp4.
 */
export function InfluencerHero({ content }: { content: InfluencersContent }) {
  const tracks = [
    {
      kicker: content.picker_a_kicker,
      title: content.picker_a_title,
      text: content.picker_a_text,
      // Ya no es un CTA sino el requisito de entrada: quién encaja en esta vía.
      etiqueta: content.picker_a_cta,
      href: "#tu-guia",
    },
    {
      kicker: content.picker_b_kicker,
      title: content.picker_b_title,
      text: content.picker_b_text,
      etiqueta: content.picker_b_cta,
      href: "#recomendadores",
    },
  ];

  return (
    <header className="hero hero--creators" id="main-content">
      <span className="hero-wordmark" aria-hidden="true">
        creators.
      </span>
      <div className="container">
        <div className="hero-creators__copy">
          <Reveal delay={0}>
            <span className="eyebrow">{content.hero_kicker}</span>
          </Reveal>
          <Reveal delay={80}>
            {/* Salto forzado tras el punto en TODOS los anchos: es el ritmo de
                la frase. Si no cabe, cede el cuerpo de letra —atado al ancho
                de su columna con cqi—, nunca el punto de salto. */}
            <h1 className="hero-title hero-title--dos" style={{ marginTop: 24 }}>
              <span>{content.hero_line_1}</span>
              <span>{content.hero_line_2}</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="hero-sub hero-sub--wide">
              {content.hero_sub_a}
            </p>
          </Reveal>
        </div>

        <Reveal delay={240}>
          <div className="track-picker">
            {tracks.map((track) => (
              <a key={track.href} href={track.href} className="track-card">
                <span className="track-card__kicker">{track.kicker}</span>
                <span className="track-card__title">{track.title}</span>
                <span className="track-card__text">{track.text}</span>
                <span className="track-card__req">
                  {track.etiqueta}
                </span>
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </header>
  );
}
