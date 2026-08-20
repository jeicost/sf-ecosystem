import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import type { Locale } from "@/lib/i18n";
import type { AppHomeContent } from "@/lib/content/app-home";
import { PLATFORM } from "@/lib/platform";
import { CTAAviso } from "@/components/app/CTAAviso";

export function CTA({ content, locale }: { content: AppHomeContent; locale: Locale }) {
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
          </h2>
          <p className="cta__sub">{content.cta_sub}</p>
          {/* Un solo botón grande. Empresas y creadores ya tienen su entrada en
              el menú de arriba: aquí competían con el CTA del viajero, que es
              la conversión de esta página. */}
          <div className="cta__buttons">
            <a href={PLATFORM.home} className="btn btn-primary">
              {content.cta_primary} <Icon name="arrow-right" size={14} />
            </a>
          </div>
          <p className="cta__nota">{content.cta_nota}</p>
          <CTAAviso locale={locale} etiqueta={content.cta_ciudad} />
          <p className="cta__otros">
            <Link href={locale === "en" ? "/en/360" : "/360"}>{content.cta_secondary}</Link>
            <span aria-hidden="true"> · </span>
            <Link href={locale === "en" ? "/en/influencers" : "/influencers"}>{content.cta_tertiary}</Link>
          </p>
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
