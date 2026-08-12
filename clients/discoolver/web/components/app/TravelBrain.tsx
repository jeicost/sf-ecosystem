import { Reveal } from "@/components/ui/Reveal";
import type { AppHomeContent } from "@/lib/content/app-home";

export function TravelBrain({ content }: { content: AppHomeContent }) {
  const bullets = [content.travel_brain_bullet_1, content.travel_brain_bullet_2, content.travel_brain_bullet_3, content.travel_brain_bullet_4];

  return (
    <section
      aria-labelledby="travel-brain-title"
      style={{ background: "var(--primary)", color: "#fff", padding: "100px 0", position: "relative", overflow: "hidden" }}
    >
      <div className="container" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 64, alignItems: "center" }}>
        <Reveal delay={0}>
          <div style={{ position: "relative", borderRadius: 24, overflow: "hidden", border: "1.5px solid rgba(255,255,255,.2)", aspectRatio: "4/5" }}>
            <video
              src="/assets/v-card-accommodations.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              aria-label="Demo de Smart Card — funciones de planificación inteligente"
            />
            <div
              style={{
                position: "absolute",
                left: 20,
                top: 20,
                background: "rgba(0,0,0,.5)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                borderRadius: 999,
                padding: "6px 14px",
                color: "#fff",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: ".1em",
                textTransform: "uppercase",
              }}
              aria-hidden="true"
            >
              {content.travel_brain_badge}
            </div>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <span className="eyebrow" style={{ color: "rgba(255,255,255,.8)" }}>
            {content.travel_brain_eyebrow}
          </span>
          <h2 className="display-lg" id="travel-brain-title" style={{ marginTop: 16, color: "#fff" }}>
            {content.travel_brain_title_1}
            <br />
            {content.travel_brain_title_2} <span style={{ color: "var(--accent)" }}>{content.travel_brain_title_highlight}</span>
          </h2>
          <ul role="list" style={{ listStyle: "none", marginTop: 32, display: "flex", flexDirection: "column", gap: 14 }}>
            {bullets.map((bullet, i) => (
              <li key={i} style={{ display: "flex", gap: 12, fontSize: 16, lineHeight: 1.5 }}>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "#fff",
                    color: "var(--primary)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
          <blockquote
            style={{
              marginTop: 32,
              padding: "16px 20px",
              background: "rgba(0,0,0,.3)",
              borderRadius: 16,
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 22,
              border: "none",
            }}
          >
            &ldquo;{content.travel_brain_quote}&rdquo;
          </blockquote>
        </Reveal>
      </div>
    </section>
  );
}
