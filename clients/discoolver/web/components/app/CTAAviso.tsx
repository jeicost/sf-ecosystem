"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";

/**
 * El campo que faltaba en el cierre.
 *
 * El CTA final decía «¿Tu ciudad no está? Déjanos tu email y te avisamos cuando
 * abra» y debajo había tres botones, ninguno de ellos un campo de email: la
 * página pedía una acción que no ofrecía. Esto es esa acción.
 */
const T = {
  es: {
    ciudad: "¿Qué ciudad?",
    email: "tu@email.com",
    boton: "Avisadme",
    ok: "Hecho. Te escribimos el día que abra.",
    error: "No hemos podido guardarlo. Prueba otra vez en un momento.",
    aria: "Avisadme cuando abra mi ciudad",
  },
  en: {
    ciudad: "Which city?",
    email: "you@email.com",
    boton: "Notify me",
    ok: "Done. We'll write the day it opens.",
    error: "We couldn't save it. Try again in a moment.",
    aria: "Notify me when my city opens",
  },
} as const;

export function CTAAviso({ locale = "es", etiqueta }: { locale?: Locale; etiqueta: string }) {
  const [abierto, setAbierto] = useState(false);
  const t = T[locale === "en" ? "en" : "es"];
  const [ciudad, setCiudad] = useState("");
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"" | "enviando" | "ok" | "error">("");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    try {
      const r = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // "city" es la clave de la whitelist EXTRA_FIELDS del endpoint.
        body: JSON.stringify({ email: email.trim(), city: ciudad.trim(), source: "ciudad-cierre", locale }),
      });
      setEstado(r.ok ? "ok" : "error");
    } catch {
      setEstado("error");
    }
  }

  if (estado === "ok") return <p className="cta__aviso-ok">{t.ok}</p>;

  if (!abierto)
    return (
      <button type="button" className="cta__aviso-abrir" onClick={() => setAbierto(true)}>
        {etiqueta} <span aria-hidden="true">→</span>
      </button>
    );

  return (
    <form className="cta__aviso" onSubmit={enviar} aria-label={t.aria}>
      <input
        type="text"
        placeholder={t.ciudad}
        value={ciudad}
        onChange={(e) => setCiudad(e.target.value)}
        required
        aria-label={t.ciudad}
      />
      <input
        type="email"
        placeholder={t.email}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        aria-label={t.email}
      />
      <button type="submit" className="btn btn-dark" disabled={estado === "enviando"}>
        {t.boton}
      </button>
      {estado === "error" && <span className="cta__aviso-error">{t.error}</span>}
    </form>
  );
}
