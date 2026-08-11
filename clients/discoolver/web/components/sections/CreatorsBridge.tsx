import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import type { HomeContent } from "@/lib/content/home";
import { withLocale, type Locale } from "@/lib/i18n";

/** Block 4 — bridge to the creators program (/influencers). */
export function CreatorsBridge({ content, locale = "es" }: { content: HomeContent; locale?: Locale }) {
  return (
    <section className="creators-band" id="creators" aria-labelledby="creators-title">
      <div className="container">
        <Reveal delay={0}>
          <div className="creators-band__inner">
            <span className="eyebrow creators-band__eyebrow">{content.creators_eyebrow}</span>
            <h2 className="display-lg" id="creators-title">
              {content.creators_title}
            </h2>
            <p className="creators-band__text">{content.creators_text}</p>
            <Link href={withLocale("/influencers", locale)} className="btn btn-ink">
              {content.creators_cta} <Icon name="arrow-up-right" size={14} />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
