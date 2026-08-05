import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
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
      cta: content.picker_a_cta,
      href: "#guia-propia",
      featured: true,
    },
    {
      kicker: content.picker_b_kicker,
      title: content.picker_b_title,
      text: content.picker_b_text,
      cta: content.picker_b_cta,
      href: "#tu-video",
      featured: false,
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
            <h1 className="hero-title" style={{ marginTop: 24 }}>
              {content.hero_line_1} {content.hero_line_2}{" "}
              <em className="hero-title__underline">{content.hero_line_3}</em>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="hero-sub hero-sub--wide">
              {content.hero_sub_a} {content.hero_sub_b}
            </p>
          </Reveal>
        </div>

        <Reveal delay={240}>
          <div className="track-picker">
            {tracks.map((track) => (
              <a key={track.href} href={track.href} className={`track-card ${track.featured ? "track-card--featured" : ""}`}>
                <span className="track-card__kicker">{track.kicker}</span>
                <span className="track-card__title">{track.title}</span>
                <span className="track-card__text">{track.text}</span>
                <span className="track-card__cta">
                  {track.cta} <Icon name="arrow-right" size={14} />
                </span>
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </header>
  );
}
