import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import type { HomeContent } from "@/lib/content/home";

export function CTA({ content }: { content: HomeContent }) {
  return (
    <section className="cta" id="cta" aria-labelledby="cta-title">
      <div className="cta__bg" aria-hidden="true" />
      <div className="container cta__inner">
        <Reveal delay={0}>
          <span className="eyebrow" style={{ color: "color-mix(in oklab, var(--paper) 70%, transparent)" }}>
            {content.cta_eyebrow}
          </span>
          <h2 className="cta__title" id="cta-title" style={{ marginTop: 24 }}>
            {content.cta_title_1} <em>{content.cta_title_1_em}</em>
            <br />
            {content.cta_title_2} <em>{content.cta_title_2_em}</em>
          </h2>
          <p className="cta__sub">{content.cta_sub}</p>
          <div className="cta__buttons">
            <Link href="/#guias" className="btn btn-primary">
              {content.cta_primary} <Icon name="arrow-right" size={14} />
            </Link>
            <Link href="/#waitlist" className="btn btn-ghost" style={{ color: "var(--paper)", borderColor: "var(--paper)" }}>
              {content.cta_secondary}
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
        >
          <span>{content.cta_footline}</span>
        </div>
      </div>
    </section>
  );
}
