import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import type { HomeContent } from "@/lib/content/home";
import type { Locale } from "@/lib/i18n";

/**
 * Guías de autor — el bloque de muestra.
 *
 * REGLA INNEGOCIABLE DEL BRIEF, y la razón de que este componente exista tal
 * y como está: las muestras tienen que ser IDENTIFICABLES COMO MUESTRA a
 * primera vista. Sin etiqueta, en una página donde se cobra, son publicidad
 * engañosa.
 *
 * Por eso aquí NO hay:
 *  · caras de personas, ni reales ni generadas — los avatares son personajes
 *    de la marca, que nadie puede confundir con una firma real;
 *  · handles plausibles de Instagram — los nombres son de personaje;
 *  · precio ni botón de compra — el único CTA lleva a /influencers.
 *
 * Toda la web se sostiene sobre «nadie paga por aparecer, cada firma es real».
 * Que alguien descubriera que estas firmas son inventadas destruiría justo el
 * activo que se está construyendo.
 *
 * SUSTITUCIÓN: en cuanto haya una guía de autor real, entra con foto, arroba y
 * CTA. Con dos reales, este bloque de muestras se elimina entero — convivir
 * con ejemplos cuando ya hay producto real resta en vez de sumar.
 */
const MUESTRAS = [
  { slug: "autor-zorro", ciudad: "Madrid", tono: "#22578a" },
  { slug: "autor-buho", ciudad: "Barcelona", tono: "#8f004d" },
  { slug: "autor-flamenco", ciudad: "Málaga", tono: "#c47f3e" },
] as const;

export function GuiasDeAutor({ content, locale = "es" }: { content: HomeContent; locale?: Locale }) {
  const es = locale !== "en";
  return (
    <section className="section autor" id="guias-de-autor" aria-labelledby="autor-title">
      <div className="container">
        <Reveal delay={0}>
          <div className="section__head">
            <div className="section__head-text">
              <span className="eyebrow">{content.autor_eyebrow}</span>
              <h2 className="display-lg section__title" id="autor-title">
                {content.autor_titulo}
              </h2>
              <p className="section__lead">{content.autor_lead}</p>
            </div>
          </div>
        </Reveal>

        <ul className="autor__rejilla" role="list">
          {MUESTRAS.map((m, i) => (
            <Reveal delay={i * 80} key={m.slug}>
              <li className="autor__card">
                <span className="autor__etiqueta">{content.autor_etiqueta}</span>
                <div className="autor__portada" style={{ ["--tono" as string]: m.tono }}>
                  <span className="autor__ciudad">{m.ciudad}</span>
                  <span className="autor__firma">{content.autor_firma_hueco}</span>
                </div>
                <div className="autor__pie">
                  <Image
                    className="autor__avatar"
                    src={`/assets/guias/${m.slug}.jpg`}
                    alt=""
                    width={80}
                    height={80}
                  />
                  <p>{content.autor_pie.replace("{ciudad}", m.ciudad)}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={280}>
          {/* Único CTA del bloque, y no es de compra: convierte la muestra en
              captación de creadores en vez de en relleno de catálogo. */}
          <p className="autor__cta">
            <Link href={es ? "/influencers" : "/en/influencers"}>
              {content.autor_cta} <span aria-hidden="true">→</span>
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
