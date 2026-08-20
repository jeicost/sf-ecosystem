import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import type { HomeContent } from "@/lib/content/home";
import type { Locale } from "@/lib/i18n";

/**
 * Guías de autor — el bloque de muestra.
 *
 * REGLA INNEGOCIABLE DEL BRIEF: las muestras tienen que ser IDENTIFICABLES
 * COMO MUESTRA a primera vista. Sin etiqueta, en una página donde se cobra,
 * son publicidad engañosa. Por eso la etiqueta va SIEMPRE visible, en el flujo
 * y encima de la portada — no superpuesta: encima taparía la mancheta
 * `discoolver`, que es justo lo que hace reconocible a la publicación.
 *
 * QUÉ CAMBIÓ (19-ago-2026, decisión de Carlos). Antes esto eran tres tarjetas
 * de color plano con un hueco «según [tu nombre]» y avatares de animales de
 * marca. No enseñaba el producto: quien llega no entiende qué compra. Ahora
 * son portadas de verdad, montadas con el MISMO motor que las guías reales
 * (`design/24-portada-star.html` de `~/Developer/discoolver-dg-editor`, el
 * sistema WIRED documentado en `design/inspiracion-portadas/README.md`).
 *
 * Se regeneran con `scripts/portadas-autor.py` (retrato con Freepik Mystic →
 * recorte con rembg → render de la plantilla con Playwright). Ese script
 * guarda los parámetros exactos de cada portada: paleta, cita y desplazamiento.
 *
 * LO QUE SIGUE PROHIBIDO, y por qué esto no lo incumple: las personas de las
 * portadas son ficticias y generadas, así que NO llevan arroba de Instagram,
 * ni número de seguidores, ni testimonio, ni precio, ni botón de compra. Una
 * cara inventada dentro de una maqueta rotulada «Ejemplo de formato» es una
 * maqueta; esa misma cara con un @ y una cifra de seguidores sería prueba
 * social falsa, que es lo que la web no puede permitirse.
 *
 * SUSTITUCIÓN: en cuanto haya una guía de autor real, entra con su foto, su
 * arroba y su CTA. Con dos reales, este bloque de muestras se elimina entero.
 */
/* Las siete de la colección, en el mismo orden que el bloque de producto de
   arriba, y con su misma paleta: los dos bloques tienen que leerse como una
   sola familia, no como dos sistemas distintos. */
const MUESTRAS = [
  { slug: "madrid", ciudad: "Madrid" },
  { slug: "barcelona", ciudad: "Barcelona" },
  { slug: "malaga", ciudad: "Málaga" },
  { slug: "valencia", ciudad: "Valencia" },
  { slug: "ibiza", ciudad: "Ibiza" },
  { slug: "bangkok", ciudad: "Bangkok" },
  { slug: "dubai", ciudad: "Dubái" },
] as const;

export function GuiasDeAutor({ content, locale }: { content: HomeContent; locale: Locale }) {
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
            <Reveal delay={Math.min(i, 3) * 70} key={m.slug}>
              <li className="autor__card">
                <span className="autor__etiqueta">{content.autor_etiqueta}</span>
                <div className="autor__portada">
                  <Image
                    src={`/assets/guias/portada-guia-${m.slug}.webp`}
                    /* El alt dice que la persona es inventada: la etiqueta lo
                       resuelve para quien ve, y esto para quien escucha. */
                    alt={
                      es
                        ? `Portada de ejemplo de una guía de ${m.ciudad}, firmada por un creador ficticio`
                        : `Sample cover of a ${m.ciudad} guide, signed by a fictional creator`
                    }
                    width={720}
                    height={1018}
                    sizes="(max-width: 560px) 92vw, (max-width: 860px) 46vw, (max-width: 1180px) 31vw, 23vw"
                  />
                </div>
                <p className="autor__pie">{content.autor_pie.replace("{ciudad}", m.ciudad)}</p>
              </li>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={240}>
          {/* La etiqueta de cada portada dice que es una muestra; esto dice que
              la persona tampoco es real. Hace falta desde que las portadas
              llevan caras: el pie habla de «quien la vive» y, con un retrato
              realista al lado, esa frase parecía describir a esa persona. */}
          <p className="autor__nota">{content.autor_nota}</p>
        </Reveal>

        <Reveal delay={300}>
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
