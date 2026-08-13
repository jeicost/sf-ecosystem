import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { Book3D } from "@/components/ui/Book3D";
import { Icon } from "@/components/ui/Icon";
import type { AppHomeContent } from "@/lib/content/app-home";
import type { Locale } from "@/lib/i18n";

/**
 * El puente de la home hacia la tienda de guías.
 *
 * POR QUÉ EXISTE. Hasta el 13-ago-2026 el cuerpo de la home no enlazaba ni una
 * sola vez a /guias ni a /360: 25 enlaces llevaban a la plataforma gratuita y
 * cero a los dos negocios que cobran. Los únicos accesos a la tienda estaban en
 * el menú y en el pie, que es donde nadie los busca. Esta sección es el único
 * sitio del recorrido B2C donde alguien se entera de que existe un producto de
 * pago.
 *
 * Las portadas son las mismas piezas 3D en CSS que usa el catálogo
 * (`Book3D`), no capturas: así no hay imágenes que mantener y el bloque pesa
 * cero. Y NO llevan firma de autor — las que había eran nombres inventados y
 * se retiraron; las de verdad entran cuando los creadores firmen.
 */

const PORTADAS = [
  { city: "Madrid", bg: "#22578a", ink: "#f2f0ea", accent: "#f4b47a" },
  { city: "Barcelona", bg: "#8a3d2f", ink: "#f4f1e8", accent: "#e9b44c" },
  { city: "Ronda", bg: "#2f5d4a", ink: "#f2f0ea", accent: "#e0a458" },
] as const;

export function GuiasBridge({ content, locale = "es" }: { content: AppHomeContent; locale?: Locale }) {
  const es = locale === "es";
  const href = es ? "/guias" : "/en/guias";

  return (
    <section className="section" id="guias-bridge" aria-labelledby="guias-bridge-title">
      <div className="container">
        <Reveal delay={0}>
          <div className="section__head">
            <div className="section__head-text">
              <span className="eyebrow">{content.shop_eyebrow}</span>
              <h2 className="display-lg section__title" id="guias-bridge-title">
                {content.shop_title_1}
                <br />
                <span style={{ color: "var(--primary)" }}>{content.shop_title_highlight}</span>
              </h2>
              <p className="section__lead">{content.shop_lead}</p>
            </div>
            <Link className="btn btn-ink" href={href}>
              {content.shop_cta} <Icon name="arrow-up-right" size={14} />
            </Link>
          </div>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 28,
            marginTop: 8,
          }}
          role="list"
        >
          {PORTADAS.map((p, i) => (
            <Reveal delay={i * 80} key={p.city}>
              <Link
                href={href}
                role="listitem"
                style={{ display: "block", textDecoration: "none", color: "inherit" }}
                aria-label={`${p.city} — ${content.shop_cta}`}
              >
                <div className="book-scene" style={{ marginBottom: 14 }}>
                  <Book3D
                    cover={{
                      kind: "typo",
                      city: p.city,
                      sub: es ? "Edición 2026" : "2026 Edition",
                      bg: p.bg,
                      ink: p.ink,
                      accent: p.accent,
                    }}
                    spineText={p.city}
                    spineColor={p.bg}
                  />
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: 20,
                    letterSpacing: "-0.02em",
                    marginBottom: 4,
                  }}
                >
                  {p.city}
                </h3>
                <p style={{ fontSize: 14, color: "var(--ink-2)" }}>{content.shop_price}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
