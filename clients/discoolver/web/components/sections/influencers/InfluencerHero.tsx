import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import type { InfluencersContent } from "@/lib/content/influencers";

export function InfluencerHero({ content }: { content: InfluencersContent }) {
  return (
    <header className="hero" id="main-content" style={{ position: "relative", overflow: "hidden", minHeight: "90vh", display: "flex", alignItems: "center" }}>
      <video
        src="/assets/v-nike-metro.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(10,10,15,.92) 0%, rgba(196,38,196,.18) 100%)",
          zIndex: 1,
        }}
      />
      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        <div style={{ maxWidth: 780 }}>
          <Reveal delay={0}>
            <span className="eyebrow" style={{ color: "var(--accent)" }}>
              {content.hero_eyebrow}
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="display-xl" style={{ marginTop: 20, lineHeight: 0.92 }}>
              {content.hero_title_1}
              <br />
              {content.hero_title_2} <span style={{ color: "var(--primary)" }}>{content.hero_title_2_highlight}</span>
              <br />
              {content.hero_title_3}{" "}
              <span style={{ color: "var(--accent)", fontStyle: "italic", position: "relative", display: "inline-block" }}>
                {content.hero_title_3_highlight}
                <span
                  aria-hidden="true"
                  style={{ position: "absolute", left: 0, right: 0, bottom: "0.06em", height: "0.08em", background: "var(--primary)", zIndex: -1 }}
                />
              </span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p style={{ marginTop: 28, fontSize: 20, lineHeight: 1.5, color: "rgba(242,240,234,.75)", maxWidth: 560 }}>
              {content.hero_sub_1}
              <br />
              {content.hero_sub_2}
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
              <a href="#apply" className="btn btn-primary" style={{ fontSize: 16, padding: "14px 28px" }}>
                {content.hero_cta_primary} <Icon name="arrow-right" size={16} />
              </a>
              <a href="#tools" className="btn btn-ghost" style={{ fontSize: 16, padding: "14px 28px", color: "#fff", borderColor: "rgba(255,255,255,.3)" }}>
                {content.hero_cta_secondary}
              </a>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <div style={{ display: "flex", gap: 40, marginTop: 56, paddingTop: 32, borderTop: "1px solid rgba(242,240,234,.12)" }}>
              <div>
                <div style={{ fontSize: 28 }}>💰</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(242,240,234,.6)", marginTop: 6 }}>
                  {content.hero_stat_1_label}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 28 }}>📍</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(242,240,234,.6)", marginTop: 6 }}>
                  {content.hero_stat_2_label}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 28 }}>🎁</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(242,240,234,.6)", marginTop: 6 }}>
                  {content.hero_stat_3_label}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </header>
  );
}
