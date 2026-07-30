import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import type { InfluencersContent } from "@/lib/content/influencers";

const TOOLS = [
  { emoji: "📘", image: "/assets/img-feat-maps-calendar.jpg" },
  { emoji: "📆", image: "/assets/img-feat-personalized.jpg" },
  { emoji: "🗺", image: "/assets/img-feat-monetizable.jpg" },
];

export function InfluencerTools({ content }: { content: InfluencersContent }) {
  const tools = [1, 2, 3].map((n, i) => ({
    title: content[`tool_${n}_title` as keyof InfluencersContent],
    desc: content[`tool_${n}_desc` as keyof InfluencersContent],
    ...TOOLS[i],
  }));

  return (
    <section className="section" id="tools" aria-labelledby="tools-title">
      <div className="container">
        <Reveal delay={0}>
          <div className="section__head">
            <div className="section__head-text">
              <span className="eyebrow">{content.tools_eyebrow}</span>
              <h2 className="display-lg section__title" id="tools-title">
                {content.tools_title}
                <br />
                {content.tools_title_2} <span style={{ color: "var(--primary)", fontStyle: "italic" }}>{content.tools_title_highlight}</span>
              </h2>
              <p className="section__lead">{content.tools_lead}</p>
            </div>
            <a className="btn btn-ghost" href="#apply">
              {content.tools_cta} <Icon name="arrow-right" size={14} />
            </a>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginTop: 16 }} role="list">
          {tools.map((tool, i) => (
            <Reveal delay={i * 80} key={tool.title}>
              <div role="listitem" style={{ background: "var(--bg-card)", border: "1.5px solid var(--line)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
                  <Image src={tool.image} alt={tool.title} fill sizes="(max-width: 640px) 100vw, 33vw" style={{ objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, background: "rgba(10,10,15,.35)" }} />
                  <div style={{ position: "absolute", top: 16, left: 16, fontSize: 32 }}>{tool.emoji}</div>
                </div>
                <div style={{ padding: 24 }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em", marginBottom: 8 }}>{tool.title}</h3>
                  <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6 }}>{tool.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
