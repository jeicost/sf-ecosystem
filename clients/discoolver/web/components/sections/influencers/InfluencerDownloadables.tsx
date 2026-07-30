import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import type { InfluencersContent } from "@/lib/content/influencers";

const ACCENTS = ["var(--primary)", "var(--accent)", "#00D4D4"];

export function InfluencerDownloadables({ content }: { content: InfluencersContent }) {
  const guides = [1, 2, 3].map((n, i) => ({
    emoji: content[`guide_${n}_emoji` as keyof InfluencersContent],
    duration: content[`guide_${n}_duration` as keyof InfluencersContent],
    city: content[`guide_${n}_city` as keyof InfluencersContent],
    subtitle: content[`guide_${n}_subtitle` as keyof InfluencersContent],
    desc: content[`guide_${n}_desc` as keyof InfluencersContent],
    tags: [
      content[`guide_${n}_tag_1` as keyof InfluencersContent],
      content[`guide_${n}_tag_2` as keyof InfluencersContent],
      content[`guide_${n}_tag_3` as keyof InfluencersContent],
    ],
    accent: ACCENTS[i],
  }));

  return (
    <section className="section" aria-labelledby="downloadables-title" style={{ background: "var(--bg-card)", borderTop: "1.5px solid var(--line)" }}>
      <div className="container">
        <Reveal delay={0}>
          <span className="eyebrow">{content.downloadables_eyebrow}</span>
          <h2 className="display-md section__title" id="downloadables-title" style={{ marginTop: 12 }}>
            {content.downloadables_title} <span style={{ color: "var(--primary)" }}>{content.downloadables_title_highlight}</span>
          </h2>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginTop: 48 }} role="list">
          {guides.map((guide, i) => (
            <Reveal delay={i * 80} key={guide.city}>
              <article
                role="listitem"
                style={{
                  background: "var(--bg-soft)",
                  border: "1.5px solid var(--line)",
                  borderRadius: "var(--radius-lg)",
                  padding: 28,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: guide.accent }} />
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 32 }}>{guide.emoji}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-2)" }}>{guide.duration}</span>
                </div>
                <div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, letterSpacing: "-0.02em", marginBottom: 4 }}>{guide.city}</h3>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 14, color: "var(--ink-2)" }}>{guide.subtitle}</p>
                </div>
                <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6 }}>{guide.desc}</p>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6, marginTop: "auto" }}>
                  {guide.tags.map((tag) => (
                    <li key={tag} style={{ fontSize: 13, color: "var(--ink-2)", fontFamily: "var(--font-mono)" }}>
                      {tag}
                    </li>
                  ))}
                </ul>
                <a href="#apply" className="btn btn-ghost" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginTop: 8, justifyContent: "center" }}>
                  {content.guide_cta} <Icon name="arrow-right" size={13} />
                </a>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
