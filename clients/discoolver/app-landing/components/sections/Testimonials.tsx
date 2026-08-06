import type { HomeContent } from "@/lib/content/home";

/**
 * Testimonios sin foto, a propósito.
 *
 * Las citas son reales, pero se servían sobre seis fotos de stock del pack de
 * marca (img-testimonial-1..9.jpg, las mismas lifestyle que se usan de fondo en
 * otras secciones) haciendo de cara de esas personas. Una foto de archivo junto
 * a un nombre y una cita afirma que esa persona dijo eso: era lo único
 * inventado de la sección, y lo que hacía que el conjunto se leyera como
 * publicidad en vez de como testimonio.
 *
 * Sin cara, la cita vuelve a ser la protagonista. No reintroducir fotos que no
 * sean de la persona que firma. El icono de estrella también se retiró: sin
 * sistema de puntuación, una estrella insinúa un rating que no existe.
 */
export function Testimonials({ content }: { content: HomeContent }) {
  const items = [1, 2, 3, 4, 5, 6].map((n) => ({
    quote: content[`testimonial_${n}_quote` as keyof HomeContent],
    name: content[`testimonial_${n}_name` as keyof HomeContent],
    role: content[`testimonial_${n}_role` as keyof HomeContent],
  }));
  const loop = [...items, ...items];

  return (
    <section className="testi" aria-labelledby="testimonials-title">
      <div className="container" style={{ position: "relative", zIndex: 2, paddingBottom: 32 }}>
        <span className="eyebrow">{content.testimonials_eyebrow}</span>
        <h2 className="display-md" id="testimonials-title" style={{ marginTop: 12, maxWidth: 700 }}>
          {content.testimonials_title}{" "}
          <span style={{ color: "var(--primary)" }}>{content.testimonials_title_highlight}</span>
        </h2>
      </div>
      <div className="testi__row" aria-label="Testimonios de usuarios" role="list">
        {loop.map((item, i) => (
          <article
            className="testi__card"
            role="listitem"
            aria-label={`Testimonio de ${item.name}`}
            style={{ padding: "28px 24px 24px", minHeight: 232 }}
            key={i}
          >
            <span
              aria-hidden="true"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 44,
                lineHeight: 0.6,
                color: "var(--primary)",
                display: "block",
              }}
            >
              &ldquo;
            </span>
            <p className="testi__quote">{item.quote}</p>
            <div className="testi__author">
              <div>
                <div className="testi__name">{item.name}</div>
                <div className="testi__role">{item.role}</div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
