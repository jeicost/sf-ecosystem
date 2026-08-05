import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import type { InfluencersContent } from "@/lib/content/influencers";

export function InfluencerCriteria({ content }: { content: InfluencersContent }) {
  const cards = [1, 2].map((n) => ({
    title: content[`criteria_${n}_title` as keyof InfluencersContent],
    desc: content[`criteria_${n}_desc` as keyof InfluencersContent],
  }));

  return (
    <section aria-labelledby="criteria-title" style={{ background: "var(--primary)", color: "#fff", padding: "100px 0", position: "relative", overflow: "hidden" }}>
      <div
        aria-hidden="true"
        style={{ position: "absolute", top: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "rgba(201,255,63,.12)", filter: "blur(80px)" }}
      />
      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        <Reveal delay={0}>
          <span className="eyebrow" style={{ color: "rgba(255,255,255,.7)" }}>
            {content.criteria_eyebrow}
          </span>
          <h2 className="display-lg" id="criteria-title" style={{ marginTop: 16, color: "#fff", maxWidth: 720 }}>
            {content.criteria_title} <span style={{ color: "var(--accent)", fontStyle: "italic" }}>{content.criteria_title_highlight}</span>
          </h2>
          <p style={{ marginTop: 20, fontSize: 18, color: "rgba(255,255,255,.75)", maxWidth: 560 }}>{content.criteria_lead}</p>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginTop: 56 }}>
          {cards.map((card, i) => (
            <Reveal delay={i * 100} key={card.title}>
              <div style={{ padding: 32, background: "rgba(0,0,0,.25)", borderRadius: "var(--radius-lg)", border: "1.5px solid rgba(255,255,255,.15)", backdropFilter: "blur(10px)" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "#fff", marginBottom: 12 }}>{card.title}</h3>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,.75)", lineHeight: 1.6 }}>{card.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={220}>
          <a
            href="#apply"
            className="btn"
            style={{
              marginTop: 48,
              background: "#fff",
              color: "var(--primary)",
              fontWeight: 700,
              fontSize: 16,
              padding: "14px 28px",
              display: "inline-flex",
              gap: 8,
              alignItems: "center",
              borderRadius: "var(--radius-xl)",
              border: "none",
            }}
          >
            {content.criteria_cta} <Icon name="arrow-right" size={16} />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
