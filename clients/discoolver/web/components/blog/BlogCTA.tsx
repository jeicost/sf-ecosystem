"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Lo que convierte un artículo del blog en algo útil para el negocio.
 *
 * El blog son 55 puertas de entrada por SEO —"terrazas con piscina en Madrid",
 * "tiendas de sneakers"— por las que alguien entra buscando exactamente lo que
 * vendemos. Hasta hoy leía y se iba: cero formularios en todo el blog.
 *
 * Se reutiliza el endpoint de la waitlist que ya existe y ya funciona, con
 * `source: "blog"` para poder separar después de dónde vino cada email. No se
 * inventa una lista nueva: la promesa es la misma que en el resto de la web
 * —avisarte cuando salga la guía de tu ciudad— y cumplirla dos veces desde dos
 * listas distintas sería pedir el email para nada.
 */
export function BlogCTA({ ciudad }: { ciudad: string }) {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "hecho" | "error">("idle");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, city: ciudad, source: "blog" }),
      });
      setEstado(res.ok ? "hecho" : "error");
    } catch {
      setEstado("error");
    }
  }

  return (
    <aside className="blog-cta">
      <div className="blog-cta__texto">
        <p className="blog-cta__eyebrow">La guía de {ciudad}</p>
        <h2 className="blog-cta__titulo">
          Esto es un artículo. La guía es todo lo demás.
        </h2>
        <p className="blog-cta__lead">
          Cada año elegimos lo mejor de {ciudad} entre miles de recomendaciones de
          creadores, y lo editamos en una guía que se guarda. Digital y papel, con IA
          para recorrer la ciudad a tu ritmo.
        </p>
        <p style={{ marginTop: 14 }}>
          <Link href="/guias" className="btn btn-primary">
            Ver las guías
          </Link>
        </p>
      </div>

      <div className="blog-cta__form">
        {estado === "hecho" ? (
          <p className="blog-cta__ok">
            Hecho. Te escribimos cuando la guía de {ciudad} entre en edición.
          </p>
        ) : (
          <form onSubmit={enviar}>
            <label htmlFor="blog-email" className="blog-cta__label">
              ¿Te avisamos cuando salga?
            </label>
            <div className="blog-cta__fila">
              <input
                id="blog-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                autoComplete="email"
              />
              <button type="submit" className="btn btn-primary" disabled={estado === "enviando"}>
                {estado === "enviando" ? "Enviando…" : "Avísame"}
              </button>
            </div>
            {estado === "error" && (
              <p role="alert" className="blog-cta__error">
                No se pudo enviar. Prueba otra vez o escribe a hello@discoolver.com.
              </p>
            )}
          </form>
        )}
      </div>
    </aside>
  );
}
