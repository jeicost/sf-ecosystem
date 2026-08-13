"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import type { AppHomeContent } from "@/lib/content/app-home";
import { localeFromPath, UI } from "@/lib/i18n";
import { PLATFORM } from "@/lib/platform";

const IMAGES = ["/assets/img-owl.jpg", "/assets/img-fox.jpg", "/assets/img-koala-rome.jpg", "/assets/img-bear.jpg", "/assets/img-metro-kangaroo.jpg", "/assets/img-rabbit-cave.jpg"];

// 2026-08-10: fuera ratings, nº de reseñas y precios — eran inventados (ver
// repaso de negocio; la normativa de reseñas falsas no es broma). Las tarjetas
// ahora son sitios REALES del catálogo publicado (badge = ciudad) y cada una
// abre la plataforma, que es donde está la ficha de verdad. Los filtros falsos
// que no filtraban se retiran con ellos.

export function Experiences({ content }: { content: AppHomeContent }) {
  // Las tarjetas son copy del CMS, pero el remate ("ficha completa", "ver todo
  // el catálogo") es interfaz y estaba escrito en español para las dos webs.
  const t = UI[localeFromPath(usePathname())].home;
  const cards = [1, 2, 3, 4, 5, 6].map((n) => ({
    badge: content[`exp_${n}_badge` as keyof AppHomeContent],
    cat: content[`exp_${n}_cat` as keyof AppHomeContent],
    title: content[`exp_${n}_title` as keyof AppHomeContent],
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
            <a className="btn btn-ghost" href={PLATFORM.search}>
              {t.verCatalogo} <Icon name="arrow-up-right" size={14} />
            </a>
          </div>
        </Reveal>
        <div className="exps">
          {cards.map((card, i) => (
            <Reveal delay={i * 60} key={card.title}>
              <a href={PLATFORM.search} style={{ display: "block" }} aria-label={`${card.title} — ${card.cat}. ${t.abrirEnPlataforma}`}>
                <article className="exp">
                  <div className="exp__media">
                    <span className="exp__badge" aria-hidden="true">
                      {card.badge}
                    </span>
                    <Image src={card.image} alt={card.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw" style={{ objectFit: "cover", objectPosition: "center top" }} />
                  </div>
                  <div className="exp__body">
                    <span className="exp__cat">{card.cat}</span>
                    <h3 className="exp__title">{card.title}</h3>
                    <div className="exp__meta">
                      <span className="exp__rating">{t.fichaCompleta}</span>
                      <span className="exp__price">
                        <Icon name="arrow-up-right" size={14} />
                      </span>
                    </div>
                  </div>
                </article>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
