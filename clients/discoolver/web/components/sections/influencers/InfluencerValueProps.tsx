import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import type { InfluencersContent } from "@/lib/content/influencers";

const ICONS = ["💰", "🧭", "🌍"];

export function InfluencerValueProps({ content }: { content: InfluencersContent }) {
  const props = [1, 2, 3].map((n, i) => ({
    title: content[`value_prop_${n}_title` as keyof InfluencersContent],
    desc: content[`value_prop_${n}_desc` as keyof InfluencersContent],
    icon: ICONS[i],
  }));

  return (
    <section aria-labelledby="value-props-title" style={{ background: "var(--bg-soft)" }} className="section">
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 80, alignItems: "center" }}>
          <Reveal delay={0}>
            <div style={{ position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", aspectRatio: "4/5", border: "1.5px solid var(--line)" }}>
              <Image
                src="/assets/img-metro-kangaroo.jpg"
                alt="Creator explorando la ciudad"
                fill
                sizes="(max-width: 900px) 100vw, 45vw"
                style={{ objectFit: "cover", objectPosition: "center top" }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,10,15,.6) 0%, transparent 60%)" }} />
              <div style={{ position: "absolute", bottom: 24, left: 24, right: 24 }}>
                <span
                  style={{
                    display: "inline-block",
                    background: "var(--primary)",
                    color: "#fff",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                    padding: "6px 14px",
                    borderRadius: 999,
                    marginBottom: 12,
                  }}
                >
                  {content.value_props_badge}
                </span>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 22, color: "#fff", lineHeight: 1.2 }}>{content.value_props_badge_line}</p>
              </div>
            </div>
          </Reveal>
          <div>
            <Reveal delay={0}>
              <span className="eyebrow">{content.value_props_eyebrow}</span>
              <h2 className="display-lg section__title" id="value-props-title" style={{ marginTop: 16 }}>
                {content.value_props_title} <span style={{ color: "var(--primary)", fontStyle: "italic" }}>{content.value_props_title_highlight}</span>
              </h2>
              <p style={{ marginTop: 16, color: "var(--ink-2)", fontSize: 17, lineHeight: 1.6 }}>{content.value_props_lead}</p>
            </Reveal>
            <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 40 }}>
              {props.map((prop, i) => (
                <Reveal delay={i * 80} key={prop.title}>
                  <div style={{ display: "flex", gap: 20, padding: "20px 24px", background: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1.5px solid var(--line)" }}>
                    <span style={{ fontSize: 28, flexShrink: 0 }}>{prop.icon}</span>
                    <div>
                      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, marginBottom: 6 }}>{prop.title}</h3>
                      <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5 }}>{prop.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={280}>
              <a href="#apply" className="btn btn-primary" style={{ marginTop: 32, display: "inline-flex", gap: 8, alignItems: "center" }}>
                {content.value_props_cta} <Icon name="arrow-right" size={14} />
              </a>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
