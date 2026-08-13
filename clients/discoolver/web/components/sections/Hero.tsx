import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import { TiltBook } from "@/components/ui/TiltBook";
import { Book3D } from "@/components/ui/Book3D";
import type { HomeContent } from "@/lib/content/home";
import type { Locale } from "@/lib/i18n";

export function Hero({ content, locale = "es" }: { content: HomeContent; locale?: Locale }) {
  return (
    <header className="hero" id="main-content">
      <span className="hero-wordmark" aria-hidden="true">
        discoolver.
      </span>
      <div className="container">
        <div className="hero__grid hero__grid--shop">
          <div className="hero-copy">
            <Reveal delay={0}>
              <span className="eyebrow">{content.hero_eyebrow}</span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="hero-title" style={{ marginTop: 24 }}>
                {content.hero_title_a} <em className="hero-title__em">{content.hero_title_a_em}</em>
                <br />
                {content.hero_title_b} <em className="hero-title__underline">{content.hero_title_b_em}</em>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="hero-sub">{content.hero_sub}</p>
            </Reveal>
            <Reveal delay={240}>
              <div className="hero-ctas">
                <Link href="#guias" className="btn btn-primary">
                  {content.hero_cta_primary} <Icon name="arrow-right" size={14} />
                </Link>
                <Link href="#waitlist" className="btn btn-ghost">
                  {content.hero_cta_secondary}
                </Link>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <ul className="hero-notes" aria-label={locale === "en" ? "How the guides are made" : "Cómo se hacen las guías"}>
                <li>{content.hero_note_1}</li>
                <li>{content.hero_note_2}</li>
                <li>{content.hero_note_3}</li>
              </ul>
            </Reveal>
          </div>
          <Reveal delay={200} className="hero-book-col">
            <TiltBook className="hero-book">
              <div className="hero-book__float book-scene book-scene--hero">
                {/* Portada tipográfica: no se publica la cara de nadie
                    asociada a un nombre real sin acuerdo y foto cedidos. */}
                <Book3D
                  cover={{ kind: "typo", city: content.guide_1_city, sub: content.guide_1_sub, bg: "#22578a", ink: "#f2f0ea", accent: "#f4b47a", chip: locale === "en" ? "Discoolver Guide · 2026" : undefined }}
                  spineText="discoolver · Madrid 2026"
                  spineColor="#22578a"
                  priority
                />
                <span className="hero-book__sticker" aria-hidden="true">
                  {content.hero_book_sticker}
                </span>
              </div>
              <p className="hero-book__caption">{content.hero_book_caption}</p>
            </TiltBook>
          </Reveal>
        </div>
      </div>
    </header>
  );
}
