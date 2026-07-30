import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import type { HomeContent } from "@/lib/content/home";

export function Categories({ content }: { content: HomeContent }) {
  return (
    <section className="section" id="categorias" aria-labelledby="categories-title">
      <div className="container">
        <Reveal delay={0}>
          <div className="section__head">
            <div className="section__head-text">
              <span className="eyebrow">{content.categories_eyebrow}</span>
              <h2 className="display-lg section__title" id="categories-title">
                {content.categories_title} <span style={{ color: "var(--primary)" }}>{content.categories_title_highlight}</span>
              </h2>
              <p className="section__lead">{content.categories_lead}</p>
            </div>
            <Link className="btn btn-ghost" href="/#planes">
              {content.categories_cta} <Icon name="arrow-right" size={14} />
            </Link>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="bento" role="list">
            <div className="bento__card bento__featured" role="listitem" aria-label={`${content.cat_1_name} & ${content.cat_1_highlight} — ${content.cat_1_count}`}>
              <Image
                src="/assets/img-feat-monetizable.jpg"
                alt="Gastronomía y sabores — experiencias culinarias en la ciudad"
                fill
                sizes="(max-width: 1000px) 100vw, 50vw"
                className="bento__bg"
                style={{ objectFit: "cover", objectPosition: "center center" }}
              />
              <div className="bento__top">
                <span className="bento__num">01</span>
                <span className="bento__count">{content.cat_1_count}</span>
              </div>
              <div className="bento__title">
                {content.cat_1_name}
                <br />& <span style={{ color: "var(--accent)" }}>{content.cat_1_highlight}</span>
              </div>
            </div>

            <div className="bento__card bento__color-1" role="listitem" aria-label={`Cultura viva — ${content.cat_2_count} planes`}>
              <div className="bento__top">
                <span className="bento__num" style={{ background: "var(--accent)", border: "1px solid var(--ink)" }}>
                  02
                </span>
                <span className="bento__count">{content.cat_2_count}</span>
              </div>
              <div className="bento__title">
                {content.cat_2_name}
                <br />
                <span style={{ color: "var(--primary)" }}>{content.cat_2_highlight}</span>
              </div>
            </div>

            <div className="bento__card bento__color-2" role="listitem" aria-label={`Aire libre — ${content.cat_3_count} planes`}>
              <div className="bento__top">
                <span className="bento__num">03</span>
                <span className="bento__count">{content.cat_3_count}</span>
              </div>
              <div className="bento__title">
                {content.cat_3_name}
                <br />
                <span style={{ color: "var(--accent)" }}>{content.cat_3_highlight}</span>
              </div>
            </div>

            <div className="bento__card bento__img-card" role="listitem" aria-label={`Nightlife — ${content.cat_4_count}`}>
              <Image
                src="/assets/img-tickets.jpg"
                alt="Nightlife — vida nocturna y ocio urbano"
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="bento__bg"
                style={{ objectFit: "cover", objectPosition: "center top" }}
              />
              <div className="bento__top" style={{ position: "relative", zIndex: 2 }}>
                <span className="bento__num">04</span>
                <span className="bento__count">{content.cat_4_count}</span>
              </div>
              <div className="bento__title" style={{ position: "relative", zIndex: 2 }}>
                {content.cat_4_name}
                <span style={{ color: "var(--accent)" }}>{content.cat_4_highlight}</span>
              </div>
            </div>

            <div className="bento__card bento__sm" role="listitem" aria-label={`Familia — ${content.cat_5_count} planes`}>
              <div className="bento__top">
                <span className="bento__num">05</span>
                <span className="bento__count">{content.cat_5_count}</span>
              </div>
              <div className="bento__title">{content.cat_5_name}</div>
            </div>

            <div className="bento__card bento__sm" role="listitem" aria-label={`Compras — ${content.cat_6_count} planes`}>
              <div className="bento__top">
                <span className="bento__num">06</span>
                <span className="bento__count">{content.cat_6_count}</span>
              </div>
              <div className="bento__title">{content.cat_6_name}</div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
