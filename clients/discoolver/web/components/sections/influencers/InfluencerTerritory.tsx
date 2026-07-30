import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import type { InfluencersContent } from "@/lib/content/influencers";

const EMOJIS = ["🧭", "🌐", "📍"];

export function InfluencerTerritory({ content }: { content: InfluencersContent }) {
  const bullets = [content.territory_1, content.territory_2, content.territory_3];

  return (
    <section className="section" aria-labelledby="territory-title" style={{ background: "var(--bg-soft)" }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <Reveal delay={0}>
              <span className="eyebrow">{content.territory_eyebrow}</span>
              <h2 className="display-lg section__title" id="territory-title" style={{ marginTop: 16 }}>
                {content.territory_title}
                <br />
                <span style={{ color: "var(--primary)" }}>{content.territory_title_highlight}</span>
              </h2>
              <p className="section__lead">{content.territory_lead}</p>
            </Reveal>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 40 }}>
              {bullets.map((bullet, i) => (
                <Reveal delay={i * 80} key={bullet}>
                  <div style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "16px 20px", background: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1.5px solid var(--line)" }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{EMOJIS[i]}</span>
                    <span style={{ fontSize: 15, lineHeight: 1.5 }}>{bullet}</span>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={280}>
              <a href="#apply" className="btn btn-primary" style={{ marginTop: 32, display: "inline-flex", gap: 8, alignItems: "center" }}>
                {content.territory_cta} <Icon name="arrow-right" size={14} />
              </a>
            </Reveal>
          </div>
          <Reveal delay={100}>
            <div style={{ position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", aspectRatio: "3/4", border: "1.5px solid var(--line)" }}>
              <Image
                src="/assets/img-influencer-1.jpg"
                alt="Creator explorando la ciudad"
                fill
                sizes="(max-width: 900px) 100vw, 40vw"
                style={{ objectFit: "cover", objectPosition: "center top" }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,10,15,.7) 0%, transparent 50%)" }} />
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 20,
                  left: 20,
                  background: "rgba(10,10,15,.7)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(242,240,234,.15)",
                  borderRadius: 8,
                  padding: "8px 14px",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "var(--accent)",
                }}
              >
                {content.territory_badge}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
