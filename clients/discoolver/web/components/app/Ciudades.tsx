"use client";

import Image from "next/image";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { AppHomeContent } from "@/lib/content/app-home";

/**
 * El selector de ciudades — sustituye al carrusel de "Sitios publicados".
 *
 * POR QUÉ SE FUE EL CARRUSEL. Enseñaba seis locales reales con fotos de
 * personajes que no eran de esos locales (el Cine Doré ilustrado con un zorro
 * cenando, 1862 Dry Bar con el Coliseo). En un producto que vende criterio
 * editorial, eso costaba más de lo que aportaba.
 *
 * QUÉ HACE ESTE. Un portal por ciudad abierta. Al abrirse enseña el recuento y
 * **tres nombres reales** de sitios publicados: es lo único de la sección que
 * demuestra, y salen de la misma API que sirve la plataforma, nunca escritos a
 * mano. La última tira es la ciudad que no está, y su formulario guarda QUÉ
 * ciudad pide cada visitante — la mejor señal para decidir la siguiente
 * apertura.
 *
 * ⚠️ ILUSTRACIONES PENDIENTES. El diseño pide una ilustración por ciudad (la
 * ciudad como jungla habitada, con su monumento reconocible y su animal). No
 * están generadas todavía. Mientras falten, el portal se pinta con un degradado
 * de marca y tipografía: en cuanto exista `public/assets/ciudades/{slug}.webp`
 * se añade a ILUSTRACIONES y la tira la usa sin tocar nada más.
 */
const ILUSTRACIONES: Record<string, string> = {
  // madrid: "/assets/ciudades/madrid.webp",
};

/** Tonos de reposo mientras no hay ilustración. Estables por ciudad. */
const TONOS = ["#2a1033", "#0f2233", "#221a0f", "#102a22", "#2a1018"];

export type CiudadPortal = { slug: string; nombre: string; sitios: number; destacados: string[] };

export function Ciudades({
  content,
  ciudades,
  locale = "es",
}: {
  content: AppHomeContent;
  ciudades: CiudadPortal[];
  locale?: Locale;
}) {
  const es = locale !== "en";
  // "cerrada" es el índice de la tira de la ciudad que no está.
  const [activa, setActiva] = useState<number | "cerrada" | null>(0);
  const [ciudadPedida, setCiudadPedida] = useState("");
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"" | "enviando" | "ok" | "error">("");

  async function pedir(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    try {
      const r = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // `city` es la clave que admite la whitelist del endpoint: es el dato
        // que decide qué ciudad se abre después, así que no puede perderse.
        body: JSON.stringify({ email: email.trim(), city: ciudadPedida.trim(), source: "ciudad-portal", locale }),
      });
      setEstado(r.ok ? "ok" : "error");
    } catch {
      setEstado("error");
    }
  }

  // Separador a mano: el ICU del entorno de build no garantiza es-ES y el
  // contador salía "1099" en vez de "1.099" (mismo motivo que en platform-stats).
  const mil = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, es ? "." : ",");

  return (
    <section className="section portales" id="ciudades" aria-labelledby="ciudades-title">
      <div className="container">
        <div className="section__head">
          <div className="section__head-text">
            <span className="eyebrow">{content.ciudades_eyebrow}</span>
            <h2 className="display-lg section__title" id="ciudades-title">
              {content.ciudades_title}
            </h2>
            <p className="section__lead">{content.ciudades_lead}</p>
          </div>
        </div>

        <div className="portales__fila">
          {ciudades.map((c, i) => {
            const abierta = activa === i;
            const ilustracion = ILUSTRACIONES[c.slug];
            // La API devuelve los tres primeros de `list_plan`, que a veces son
            // fiestas o pueblos de la provincia. Un campo por ciudad en el CMS
            // (`ciudad_madrid_destacados`) permite elegirlos a mano sin tocar
            // código; si está vacío, mandan los de la base de datos.
            const manual = (content[`ciudad_${c.slug}_destacados` as keyof AppHomeContent] as string | undefined)?.trim();
            const destacados = manual ? manual.split("·").map((x) => x.trim()).filter(Boolean) : c.destacados;
            return (
              <article
                key={c.slug || c.nombre}
                className={`portal${abierta ? " is-abierto" : ""}`}
                style={{ ["--tono" as string]: TONOS[i % TONOS.length] }}
                onMouseEnter={() => setActiva(i)}
                onFocusCapture={() => setActiva(i)}
              >
                <button
                  type="button"
                  className="portal__disparador"
                  aria-expanded={abierta}
                  onClick={() => setActiva(i)}
                >
                  <span className="visually-hidden">{c.nombre}</span>
                </button>
                {ilustracion && (
                  <Image
                    className="portal__ilustracion"
                    src={ilustracion}
                    alt=""
                    fill
                    sizes="(max-width: 880px) 100vw, 33vw"
                    loading={i === 0 ? "eager" : "lazy"}
                    priority={i === 0}
                  />
                )}
                <span className="portal__contador">{mil(c.sitios)}</span>
                <span className="portal__vertical" aria-hidden="true">
                  {c.nombre}
                </span>
                <div className="portal__contenido">
                  <h3 className="portal__nombre">{c.nombre}</h3>
                  <p className="portal__sitios">
                    {mil(c.sitios)} {content.ciudades_sitios}
                  </p>
                  {destacados.length > 0 && (
                    <p className="portal__destacados">{destacados.join(" · ")}</p>
                  )}
                  <a
                    className="btn btn-primary portal__cta"
                    href={`https://app.discoolver.com/search?city=${encodeURIComponent(c.slug)}`}
                  >
                    {content.ciudades_cta.replace("{ciudad}", c.nombre)} <span aria-hidden="true">→</span>
                  </a>
                </div>
              </article>
            );
          })}

          {/* La ciudad que no está. No se abre al pasar por encima: solo al
              clic, para que no robe el sitio a las que sí tienen catálogo. */}
          <article className={`portal portal--cerrada${activa === "cerrada" ? " is-abierto" : ""}`}>
            <button
              type="button"
              className="portal__disparador"
              aria-expanded={activa === "cerrada"}
              onClick={() => setActiva(activa === "cerrada" ? 0 : "cerrada")}
            >
              <span className="visually-hidden">{content.ciudades_cerrada_title}</span>
            </button>
            <span className="portal__vertical" aria-hidden="true">
              {content.ciudades_cerrada_vertical}
            </span>
            <div className="portal__contenido">
              <h3 className="portal__nombre">{content.ciudades_cerrada_title}</h3>
              <p className="portal__sitios">{content.ciudades_cerrada_lead}</p>
              {estado === "ok" ? (
                <p className="portal__ok">{content.ciudades_cerrada_ok}</p>
              ) : (
                <form className="portal__form" onSubmit={pedir}>
                  <input
                    type="text"
                    required
                    placeholder={content.ciudades_cerrada_ciudad}
                    aria-label={content.ciudades_cerrada_ciudad}
                    value={ciudadPedida}
                    onChange={(e) => setCiudadPedida(e.target.value)}
                  />
                  <input
                    type="email"
                    required
                    placeholder={content.ciudades_cerrada_email}
                    aria-label={content.ciudades_cerrada_email}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" disabled={estado === "enviando"}>
                    {content.ciudades_cerrada_cta} <span aria-hidden="true">→</span>
                  </button>
                  {estado === "error" && <span className="portal__error">{content.ciudades_cerrada_error}</span>}
                </form>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
