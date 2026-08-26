"use client";

import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import type { AppHomeContent } from "@/lib/content/app-home";
import type { Locale } from "@/lib/i18n";
import { UI, t } from "@/lib/i18n";

/**
 * La próxima ciudad — reescrita el 19-ago-2026 con el brief del CEO.
 *
 * FUERA EL CONTADOR, Y NO ES CUESTIÓN DE COPY. Un reloj que llega a 00:00:00
 * sin apertura ese día es un incumplimiento público que cualquiera puede
 * comprobar; y contradice el argumento de la casa —"abre cuando sus sitios
 * están revisados"— que es una condición de calidad, no una fecha. Las
 * aperturas dependen de revisión humana, justo lo que se retrasa.
 *
 * En su lugar va la LISTA DE ESTADOS, que dice lo mismo sin comprometer día:
 * las abiertas con su recuento vivo, Bangkok en revisión y una fila para pedir
 * la tuya.
 *
 * NO SE PROMETE VOTO. El brief daba dos redacciones según si el orden de
 * apertura lo deciden de verdad los usuarios. No lo deciden: la colección de
 * guías ya publica el orden (Madrid, Barcelona, Málaga, Valencia, Ibiza,
 * Bangkok, Dubái) dos secciones más arriba en esta misma página. Prometer "la
 * decidís vosotros" se contradiría con solo hacer scroll, así que se usa la
 * alternativa: dejas el correo y entras el primer día.
 *
 * Los badges de App Store y Google Play también se van: imitaban a los
 * oficiales, no llevaban a ninguna parte y su uso está sujeto a las guías de
 * marca de Apple y Google. Un enlace de texto alimenta la misma lista.
 */
export type EstadoCiudad = { nombre: string; sitios: number };

export function AppComingSoon({
  content,
  locale,
  abiertas,
}: {
  content: AppHomeContent;
  locale: Locale;
  abiertas: EstadoCiudad[];
}) {
  const txt = t(locale).app;
  const es = locale !== "en";
  const [ciudad, setCiudad] = useState("");
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"" | "enviando" | "ok" | "error">("");
  const mil = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, es ? "." : ",");

  async function pedir(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    try {
      const r = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // `city` es lo que da valor a este formulario: sin saber QUÉ ciudad
        // pide cada uno, la lista de correos no dice nada.
        body: JSON.stringify({ email: email.trim(), city: ciudad.trim(), source: "proxima-ciudad", locale }),
      });
      setEstado(r.ok ? "ok" : "error");
    } catch {
      setEstado("error");
    }
  }

  return (
    <section className="section app-soon" id="app" aria-labelledby="app-soon-title">
      <div className="container app-soon__grid">
        <Reveal delay={0}>
          <div>
            <span className="eyebrow app-soon__eyebrow">{content.app_soon_eyebrow}</span>
            <h2 className="display-lg app-soon__titulo" id="app-soon-title">
              {content.app_soon_title_1}{" "}
              <span className="app-soon__acento">{content.app_soon_title_2}</span>
            </h2>
            <p className="app-soon__lead">{content.app_soon_desc}</p>

            {estado === "ok" ? (
              <p className="app-soon__ok" role="status">
                {content.app_soon_ok}
              </p>
            ) : (
              <>
                <form className="app-soon__form" aria-label={txt.formAria} onSubmit={pedir}>
                  {/* Campo libre a propósito: un desplegable cerrado solo
                      recoge las ciudades que ya habíamos pensado, y la señal
                      que importa es justo la que no esperábamos. */}
                  <input
                    type="text"
                    required
                    placeholder={content.app_soon_ciudad}
                    aria-label={content.app_soon_ciudad}
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                  />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder={content.app_soon_email}
                    aria-label={content.app_soon_email}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" disabled={estado === "enviando"}>
                    {content.app_soon_cta} <Icon name="arrow-right" size={14} />
                  </button>
                </form>
                <p className="app-soon__nota">{content.app_soon_nota}</p>
              </>
            )}
            {estado === "error" && (
              <p className="app-soon__error" role="alert">
                {txt.error}
              </p>
            )}

            {/* Ni badge de App Store ni de Google Play mientras las apps no
                existan: un enlace de texto a la misma lista. */}
            <a className="app-soon__app" href="#app">
              {content.app_soon_app} <span aria-hidden="true">→</span>
            </a>
          </div>
        </Reveal>

        <Reveal delay={140}>
          {/* El espacio del reloj lo ocupa el estado real de cada ciudad. Las
              abiertas y su recuento salen de la misma fuente que el hero y los
              portales: si Diego abre una ciudad, aparece aquí sola. */}
          <ul className="estados" aria-label={content.app_soon_estados_aria}>
            {abiertas.map((c) => (
              <li className="estado estado--abierta" key={c.nombre}>
                <span className="estado__punto" aria-hidden="true" />
                <span className="estado__ciudad">{c.nombre}</span>
                <span className="estado__dato">
                  {content.app_soon_abierta} · {mil(c.sitios)} {content.app_soon_sitios}
                </span>
              </li>
            ))}
            <li className="estado estado--revision">
              <span className="estado__punto" aria-hidden="true" />
              <span className="estado__ciudad">Bangkok</span>
              <span className="estado__dato">{content.app_soon_revision}</span>
            </li>
            <li className="estado estado--tuya">
              <span className="estado__punto" aria-hidden="true" />
              <span className="estado__ciudad">{content.app_soon_tu_ciudad}</span>
              <span className="estado__dato">{content.app_soon_pidela}</span>
            </li>
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
