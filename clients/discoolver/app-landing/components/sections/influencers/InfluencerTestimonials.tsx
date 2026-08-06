import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import type { InfluencersContent } from "@/lib/content/influencers";

/**
 * Sin fotos, igual que los testimonios de la home: se servían sobre fotos de
 * stock del pack de marca (img-testimonial-7..9.jpg) haciendo de cara de esos
 * creadores.
 *
 * PENDIENTE DE CARLOS: los tres handles (@viajeraautentica, @exploradorurbano,
 * @aventurera_creativa) no son ninguno de los dos creadores del piloto
 * (Cenando con Pablo y Travis Leon) y no se ha podido confirmar que existan.
 * Si son de relleno, esta sección se retira hasta que haya creadores firmados:
 * atribuir una cita a una cuenta de Instagram ajena es peor que no tener
 * testimonios.
 */
export function InfluencerTestimonials({ content }: { content: InfluencersContent }) {
  const items = [1, 2, 3].map((n) => ({
    quote: content[`testimonial_${n}_quote` as keyof InfluencersContent],
    handle: content[`testimonial_${n}_handle` as keyof InfluencersContent],
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
              <article
                style={{
                  borderRadius: "var(--radius-lg)",
                  border: "1.5px solid var(--line)",
                  background: "var(--bg-card)",
                  minHeight: 240,
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                }}
                aria-label={`Testimonio de ${item.handle}`}
              >
                <span
                  aria-hidden="true"
                  style={{ fontFamily: "var(--font-display)", fontSize: 40, lineHeight: 0.6, color: "var(--primary)", marginBottom: 20 }}
                >
                  &ldquo;
                </span>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 18, lineHeight: 1.3, marginBottom: 16 }}>{item.quote}</p>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--primary)", letterSpacing: ".05em" }}>{item.handle}</span>
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
