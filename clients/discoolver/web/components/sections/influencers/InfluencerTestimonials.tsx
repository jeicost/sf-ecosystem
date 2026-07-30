import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import type { InfluencersContent } from "@/lib/content/influencers";

export function InfluencerTestimonials({ content }: { content: InfluencersContent }) {
  const items = [1, 2, 3].map((n) => ({
    quote: content[`testimonial_${n}_quote` as keyof InfluencersContent],
    handle: content[`testimonial_${n}_handle` as keyof InfluencersContent],
    image: `/assets/img-testimonial-${n + 6}.jpg`,
  }));

  return (
    <section className="section" aria-labelledby="testi-creators-title">
      <div className="container">
        <Reveal delay={0}>
          <span className="eyebrow">{content.testimonials_eyebrow}</span>
          <h2 className="display-md section__title" id="testi-creators-title" style={{ marginTop: 12, maxWidth: 600 }}>
            {content.testimonials_title} <span style={{ color: "var(--primary)" }}>{content.testimonials_title_highlight}</span>
          </h2>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginTop: 48 }}>
          {items.map((item, i) => (
            <Reveal delay={i * 80} key={item.handle}>
              <article style={{ position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1.5px solid var(--line)", minHeight: 320 }} aria-label={`Testimonio de ${item.handle}`}>
                <Image src={item.image} alt="" fill sizes="(max-width: 640px) 100vw, 33vw" style={{ objectFit: "cover", objectPosition: "center top" }} />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(10,10,15,.95) 0%, rgba(10,10,15,.5) 50%, rgba(10,10,15,.1) 100%)",
                  }}
                />
                <div style={{ position: "absolute", inset: 0, padding: 24, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                  <span style={{ marginBottom: 12, color: "var(--accent)" }}>
                    <Icon name="star" size={16} />
                  </span>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 18, lineHeight: 1.3, color: "#fff", marginBottom: 16 }}>&ldquo;{item.quote}&rdquo;</p>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--primary)", letterSpacing: ".05em" }}>{item.handle}</span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal delay={120}>
          <div style={{ marginTop: 64, padding: 48, background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1.5px solid var(--line)", textAlign: "center" }}>
            <span className="eyebrow">{content.movement_eyebrow}</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(28px,4vw,52px)", letterSpacing: "-0.04em", lineHeight: 1.1, marginTop: 16, marginBottom: 20 }}>
              A <span style={{ color: "var(--primary)", fontStyle: "italic" }}>{content.movement_title_highlight}</span>
            </h2>
            <p style={{ fontSize: 17, color: "var(--ink-2)", maxWidth: 560, margin: "0 auto 32px", lineHeight: 1.7 }}>{content.movement_desc}</p>
            <a href="#apply" className="btn btn-primary" style={{ fontSize: 16, padding: "14px 28px", display: "inline-flex", gap: 8, alignItems: "center" }}>
              {content.movement_cta} <Icon name="arrow-right" size={16} />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
