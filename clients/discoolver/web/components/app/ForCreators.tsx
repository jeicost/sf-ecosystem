"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { creadoresPorPais, iniciales, rotar, tonoAvatar } from "@/lib/creators";
import type { AppHomeContent } from "@/lib/content/app-home";
import type { Locale } from "@/lib/i18n";

/**
 * Quién recomienda — la prueba de que detrás de cada sitio hay una persona.
 *
 * QUÉ ERA. Cuatro tarjetas escritas para captar creadores ("Monetizable",
 * "Escalable", "Cobras por lo que tus recomendaciones generan") en medio de una
 * home dirigida al viajero. Además de romper el hilo, la de cobrar sugería que
 * las recomendaciones están pagadas — justo lo contrario de lo que promete el
 * hero con su "0 recomendaciones patrocinadas". Todo ese argumento vive ahora
 * donde le corresponde: en /influencers.
 *
 * QUÉ ES AHORA. Una fila de creadores reales, con cara, arroba, ciudad y
 * territorio. Y una salida discreta al programa de creadores al final.
 *
 * ⚠️ LA LISTA ESTÁ VACÍA A PROPÓSITO. Hoy no existe ni un creador publicable:
 * la plataforma los lista como "Influencer 1 … Influencer 10" y en el repo solo
 * hay fotos de banco haciendo de persona — exactamente lo que el CLAUDE.md
 * prohíbe usar como cara de quien firma algo. Mientras `CREADORES` esté vacío,
 * la sección se sirve sin la fila: enseña el argumento, no una prueba falsa.
 *
 * Para encenderla hace falta, por creador: foto propia, arroba real, ciudad,
 * territorio y **permiso por escrito**. La frase en primera persona es
 * opcional — si no la ha dicho, no se escribe por él.
 */
type Creador = {
  /** Ruta de su foto en public/assets/creadores/. Nunca banco de imágenes. */
  foto: string;
  handle: string;
  ciudad: string;
  /** Territorio en el que recomienda, con el nombre de las ocho canónicas. */
  territorio: string;
  /** Suya, literal. Si no la ha dicho, se deja vacía. */
  frase?: string;
  /** Su perfil en la plataforma o sus sitios publicados. */
  href: string;
};

const CREADORES: Creador[] = [];

export function ForCreators({ content, locale = "es" }: { content: AppHomeContent; locale?: Locale }) {
  const es = locale !== "en";
  const grupos = creadoresPorPais();
  const PAISES: Record<string, { es: string; en: string }> = {
    es: { es: "España", en: "Spain" },
    th: { es: "Tailandia", en: "Thailand" },
    ae: { es: "Emiratos", en: "UAE" },
  };

  // Quién encabeza cada país cambia en cada carga. Se decide DESPUÉS de montar
  // —no durante el render— porque la home se prerenderiza: sortearlo en el
  // servidor lo dejaría congelado hasta el siguiente build, y sortearlo en el
  // render rompería la hidratación al no coincidir servidor y cliente.
  const [giro, setGiro] = useState(0);
  useEffect(() => {
    setGiro(Math.floor(Math.random() * 997));
  }, []);

  return (
    <section className="section creadores" id="creators" aria-labelledby="creators-title">
      <div className="container">
        <Reveal delay={0}>
          <div className="section__head">
            <div className="section__head-text">
              <span className="eyebrow">{content.creators_eyebrow}</span>
              <h2 className="display-lg section__title" id="creators-title">
                {content.creators_title_1}{" "}
                <span style={{ color: "var(--primary)" }}>{content.creators_title_highlight}</span>
              </h2>
              <p className="section__lead">{content.creators_lead}</p>
            </div>
          </div>
        </Reveal>

        {/* Por país, con avatar y con el arranque rotando en cada carga: así
            no encabeza siempre el mismo y el bloque se ve vivo sin barajar
            nada — la rotación conserva el orden relativo. */}
        <Reveal delay={120}>
          <div className="creadores__paises">
            {grupos.map((g) => (
              <section className="pais" key={g.mercado}>
                <h3 className="pais__nombre">
                  {es ? PAISES[g.mercado].es : PAISES[g.mercado].en}
                  <span className="pais__n">{g.lista.length}</span>
                  {g.proximamente && (
                    <span className="pais__pronto">{es ? "Próximamente" : "Coming soon"}</span>
                  )}
                </h3>
                <ul className="pais__lista" role="list">
                  {rotar(g.lista, giro).map((c) => (
                    <li key={c.handle}>
                      <a
                        className="creador"
                        href={`https://instagram.com/${c.handle}`}
                        rel="noopener"
                        target="_blank"
                      >
                        {c.foto ? (
                          <Image
                            className="creador__avatar"
                            src={c.foto}
                            alt={es ? `${c.nombre}, creador en ${c.donde}` : `${c.nombre}, creator in ${c.donde}`}
                            width={112}
                            height={112}
                          />
                        ) : (
                          <span
                            className="creador__avatar creador__avatar--iniciales"
                            style={{ ["--tono" as string]: tonoAvatar(c.handle) }}
                            aria-hidden="true"
                          >
                            {iniciales(c.nombre)}
                          </span>
                        )}
                        <span className="creador__nombre">{c.nombre}</span>
                        <span className="creador__handle">@{c.handle}</span>
                        <span className="creador__donde">{c.donde}</span>
                        {c.territorio && <span className="creador__territorio">{c.territorio}</span>}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          {content.creators_refuerzo && <p className="creadores__refuerzo">{content.creators_refuerzo}</p>}
        </Reveal>

        {/* La captación de creadores baja a una línea: es otro público y otra
            landing. Nunca un bloque destacado en la home del viajero. */}
        <Reveal delay={180}>
          <p className="creadores__salida">
            {content.creators_salida}{" "}
            <Link href={es ? "/influencers" : "/en/influencers"}>
              {content.creators_cta} <span aria-hidden="true">→</span>
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
