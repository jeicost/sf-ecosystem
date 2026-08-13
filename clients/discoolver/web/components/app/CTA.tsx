import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import type { Locale } from "@/lib/i18n";
import type { AppHomeContent } from "@/lib/content/app-home";
import { PLATFORM } from "@/lib/platform";

export function CTA({ content, locale = "es" }: { content: AppHomeContent; locale?: Locale }) {
  return (
    <section className="cta" id="empresas" aria-labelledby="cta-title">
      <div className="cta__bg" aria-hidden="true" />
      <div className="container cta__inner">
        <Reveal delay={0}>
          <span className="eyebrow" style={{ color: "color-mix(in oklab, var(--paper) 70%, transparent)" }}>
            {content.cta_eyebrow}
          </span>
          <h2 className="cta__title" id="cta-title" style={{ marginTop: 24 }}>
            {content.cta_title_1} <em>{content.cta_title_1_em}</em>
            <br />
            {content.cta_title_2} <em>{content.cta_title_2_em}</em> {content.cta_title_3}
          </h2>
          <p className="cta__sub">{content.cta_sub}</p>
          <div className="cta__buttons">
            <a href={PLATFORM.home} className="btn btn-primary">
              {content.cta_primary} <Icon name="arrow-right" size={14} />
            </a>
            {/* Abría un mailto y se saltaba el formulario cualificado de ocho
                campos que ya existe en /360/demo — el lead B2B llegaba como un
                correo suelto sin organización, vertical ni volumen. */}
            <Link
              href={locale === "en" ? "/en/360/demo" : "/360/demo"}
              className="btn btn-ghost"
              style={{ color: "var(--paper)", borderColor: "var(--paper)" }}
            >
              {content.cta_secondary} <Icon name="arrow-right" size={14} />
            </Link>
            {/* Los tres públicos del cierre, cada uno con su puerta: el viajero
                entra en la plataforma, la empresa pide demo y el creador va a
                su landing. El tercero faltaba, y era el único que no tenía
                salida desde aquí. */}
            <Link
              href={locale === "en" ? "/en/influencers" : "/influencers"}
              className="btn btn-ghost"
              style={{ color: "var(--paper)", borderColor: "var(--paper)" }}
            >
              {content.cta_tertiary} <Icon name="arrow-right" size={14} />
            </Link>
          </div>
        </Reveal>
        <div
          style={{
            borderTop: "1px solid color-mix(in oklab, var(--paper) 18%, transparent)",
            padding: "24px 0",
            textAlign: "center",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: ".18em",
            textTransform: "uppercase",
            color: "color-mix(in oklab, var(--paper) 50%, transparent)",
          }}
          aria-label="Ciudades disponibles"
        >
          <span>{content.cta_cities}</span>
        </div>
      </div>
    </section>
  );
}
