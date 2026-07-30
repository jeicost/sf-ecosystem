import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import type { HomeContent } from "@/lib/content/home";

export function Testimonials({ content }: { content: HomeContent }) {
  const items = [1, 2, 3, 4, 5, 6].map((n) => ({
    quote: content[`testimonial_${n}_quote` as keyof HomeContent],
    name: content[`testimonial_${n}_name` as keyof HomeContent],
    role: content[`testimonial_${n}_role` as keyof HomeContent],
    image: `/assets/img-testimonial-${n}.jpg`,
  }));
  const loop = [...items, ...items];

  return (
    <section className="testi" aria-labelledby="testimonials-title">
      <div className="container" style={{ position: "relative", zIndex: 2, paddingBottom: 32 }}>
        <span className="eyebrow">{content.testimonials_eyebrow}</span>
        <h2 className="display-md" id="testimonials-title" style={{ marginTop: 12, maxWidth: 700 }}>
          {content.testimonials_title} <span style={{ color: "var(--primary)" }}>{content.testimonials_title_highlight}</span>
        </h2>
      </div>
      <div className="testi__row" aria-label="Testimonios de usuarios" role="list">
        {loop.map((item, i) => (
          <article className="testi__card" role="listitem" aria-label={`Testimonio de ${item.name}`} style={{ position: "relative", overflow: "hidden", padding: 0 }} key={i}>
            <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
              <Image src={item.image} alt="" fill sizes="380px" style={{ objectFit: "cover", objectPosition: "center top" }} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(10,10,15,.95) 0%, rgba(10,10,15,.7) 50%, rgba(10,10,15,.2) 100%)",
                }}
              />
            </div>
            <div style={{ position: "relative", zIndex: 2, padding: "28px 24px 24px", display: "flex", flexDirection: "column", minHeight: 260, justifyContent: "flex-end" }}>
              <span style={{ display: "block", marginBottom: 12, color: "var(--accent)" }}>
                <Icon name="star" size={18} />
              </span>
              <p className="testi__quote" style={{ color: "#fff", marginBottom: 16 }}>
                &ldquo;{item.quote}&rdquo;
              </p>
              <div className="testi__author">
                <div>
                  <div className="testi__name" style={{ color: "#fff" }}>
                    {item.name}
                  </div>
                  <div className="testi__role" style={{ color: "rgba(255,255,255,.6)" }}>
                    {item.role}
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
