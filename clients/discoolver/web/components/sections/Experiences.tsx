import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import type { HomeContent } from "@/lib/content/home";

const IMAGES = ["/assets/img-owl.jpg", "/assets/img-fox.jpg", "/assets/img-koala-rome.jpg", "/assets/img-bear.jpg", "/assets/img-metro-kangaroo.jpg", "/assets/img-rabbit-cave.jpg"];
const FILTERS = ["Todos", "Cultura", "Gastro", "Aire libre", "Nightlife", "Familia"];

export function Experiences({ content }: { content: HomeContent }) {
  const cards = [1, 2, 3, 4, 5, 6].map((n) => ({
    badge: content[`exp_${n}_badge` as keyof HomeContent],
    cat: content[`exp_${n}_cat` as keyof HomeContent],
    title: content[`exp_${n}_title` as keyof HomeContent],
    rating: content[`exp_${n}_rating` as keyof HomeContent],
    reviews: content[`exp_${n}_reviews` as keyof HomeContent],
    price: content[`exp_${n}_price` as keyof HomeContent],
    image: IMAGES[n - 1],
  }));

  return (
    <section className="section" id="planes" style={{ background: "var(--bg-soft)" }} aria-labelledby="experiences-title">
      <div className="container">
        <Reveal delay={0}>
          <div className="section__head">
            <div className="section__head-text">
              <span className="eyebrow">{content.experiences_eyebrow}</span>
              <h2 className="display-lg section__title" id="experiences-title">
                {content.experiences_title} <span style={{ color: "var(--primary)" }}>{content.experiences_title_highlight}</span> {content.experiences_title_2}
              </h2>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} role="group" aria-label="Filtrar por categoría">
              {FILTERS.map((f, i) => (
                <button
                  key={f}
                  type="button"
                  className="btn"
                  aria-pressed={i === 0}
                  style={{
                    padding: "10px 16px",
                    fontSize: 13,
                    background: i === 0 ? "var(--ink)" : "transparent",
                    color: i === 0 ? "var(--paper)" : "var(--ink)",
                    border: "1.5px solid var(--line)",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </Reveal>
        <div className="exps">
          {cards.map((card, i) => (
            <Reveal delay={i * 60} key={card.title}>
              <article className="exp" aria-label={`${card.title} — ${card.cat}`}>
                <div className="exp__media">
                  <span className="exp__badge" aria-label={`Badge: ${card.badge}`}>
                    {card.badge}
                  </span>
                  <button className="exp__heart" aria-label={`Guardar ${card.title} en favoritos`} aria-pressed="false">
                    <Icon name="heart" size={16} />
                  </button>
                  <Image src={card.image} alt={card.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw" style={{ objectFit: "cover", objectPosition: "center top" }} />
                </div>
                <div className="exp__body">
                  <span className="exp__cat">{card.cat}</span>
                  <h3 className="exp__title">{card.title}</h3>
                  <div className="exp__meta">
                    <span className="exp__rating">
                      <Icon name="star" size={14} />
                      {card.rating}
                      <span style={{ color: "var(--ink-2)" }}> · {card.reviews}</span>
                    </span>
                    <span className="exp__price">
                      <strong>{card.price}</strong>
                    </span>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
