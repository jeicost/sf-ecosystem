import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import type { InfluencersContent } from "@/lib/content/influencers";

/**
 * «Quién está dentro» — el bloque de prueba que la página no tenía.
 *
 * Se le pedía a un creador que pusiera su marca personal en el producto sin
 * enseñarle a nadie que ya lo hubiera hecho: ni una guía publicada, ni un
 * nombre, ni una cifra.
 *
 * VERSIÓN PROVISIONAL, a propósito. Mientras no haya creadores firmados con
 * permiso por escrito, aquí no van caras ni testimonios: van los cuatro
 * números reales del catálogo, servidos desde la misma fuente que el resto de
 * la web. Inventar un testimonio en la página que promete «cero publi
 * encubierta» sería el peor sitio posible para hacerlo.
 *
 * El día que haya creadores publicables, esto pasa a la fila de caras que
 * describe el brief y los números bajan a pie de bloque.
 */
export function QuienEstaDentro({
  content,
  datos,
}: {
  content: InfluencersContent;
  datos: { sitios: string; creadores: string; ciudades: string };
}) {
  const cifras = [
    { n: datos.sitios, t: content.dentro_sitios },
    { n: datos.creadores, t: content.dentro_creadores },
    { n: datos.ciudades, t: content.dentro_ciudades },
    { n: "0", t: content.dentro_pagadas },
  ].filter((c) => c.n);

  return (
    <section className="section dentro" aria-labelledby="dentro-title">
      <div className="container dentro__grid">
        <Reveal delay={0}>
          <div>
            <span className="eyebrow">{content.dentro_eyebrow}</span>
            <h2 className="display-lg section__title" id="dentro-title">
              {content.dentro_titulo}
            </h2>
            <p className="section__lead">{content.dentro_lead}</p>
            <ul className="dentro__cifras" role="list">
              {cifras.map((c) => (
                <li key={c.t}>
                  <span className="dentro__n">{c.n}</span>
                  <span className="dentro__t">{c.t}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="dentro__foto">
            <Image
              src="/assets/categorias/cultura.jpg"
              alt=""
              width={900}
              height={614}
              sizes="(max-width: 900px) 100vw, 45vw"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
