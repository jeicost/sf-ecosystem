"use client";

import { useEffect, useState } from "react";
import { UI, type Locale } from "@/lib/i18n";
import { AvisoDatos } from "./AvisoDatos";
import { Icon } from "./Icon";

/**
 * City-request waitlist form ("¿Tu ciudad no está? Avísame"). Posts to
 * /api/waitlist, que guarda el lead en base de datos y avisa por correo — el
 * endpoint nunca finge éxito, así que ambos desenlaces se le enseñan al
 * usuario. Ciudad en texto libre a propósito: la gracia es que pidan ciudades
 * que todavía no cubrimos.
 *
 * PRERRELLENO. Las siete fichas del catálogo y el CTA de la tienda apuntan
 * todas a este mismo formulario, y hasta el 13-ago-2026 quien pulsaba
 * «Avísame» sobre Madrid aterrizaba en un campo *ciudad* vacío y obligatorio,
 * teniendo que teclear «Madrid» otra vez. Ahora esos enlaces llevan
 * `data-ciudad` y este formulario lo recoge.
 *
 * Se hace con un listener delegado en `document` y no con `useSearchParams`
 * porque los enlaces salen de componentes de servidor (no pueden pasar
 * onClick) y porque la página es estática: `useSearchParams` obligaría a
 * envolverla en un Suspense y a renderizarla bajo demanda. Un click delegado
 * no cuesta nada y funciona con ambos.
 */
export function HeroForm({ locale }: { locale: Locale }) {
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const es = locale === "es";

  useEffect(() => {
    function alPulsar(e: MouseEvent) {
      const origen = (e.target as HTMLElement | null)?.closest?.("[data-ciudad]");
      const ciudad = origen?.getAttribute("data-ciudad");
      if (ciudad) setCity(ciudad);
    }
    document.addEventListener("click", alPulsar);
    return () => document.removeEventListener("click", alPulsar);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, city, source: "hero", locale }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form
      className="hero__searchbar"
      aria-label={es ? "Formulario de aviso: pide la guía de tu ciudad" : "Waitlist form: request your city's guide"}
      onSubmit={handleSubmit}
    >
      <div className="search__field">
        <label htmlFor="waitlist-city" className="search__label">
          {UI[locale].heroForm.city}
        </label>
        <input
          id="waitlist-city"
          type="text"
          className="search__input"
          placeholder="Madrid, Bangkok, Lisboa…"
          required
          aria-required="true"
          autoComplete="address-level2"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </div>
      <div className="search__field" style={{ gridColumn: "span 2" }}>
        <label htmlFor="hero-email" className="search__label">
          {es ? "Email para el aviso" : "Email for the alert"}
        </label>
        <input
          id="hero-email"
          type="email"
          className="search__input"
          placeholder={UI[locale].heroForm.emailPlaceholder}
          required
          aria-required="true"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <button type="submit" className="search__btn" aria-label={UI[locale].heroForm.ariaSubmit} disabled={status === "loading"}>
        {UI[locale].heroForm.submit} <Icon name="arrow-right" />
      </button>
      <div style={{ gridColumn: "1 / -1", padding: "0 22px 14px" }}>
        <AvisoDatos locale={locale} finalidad={es ? "avisarte cuando salga esa guía" : "let you know when that guide is out"} />
      </div>
      {status === "done" && (
        <span role="status" style={{ gridColumn: "1 / -1", padding: "0 22px 14px", fontSize: 13, color: "var(--accent)" }}>
          {UI[locale].heroForm.done}
        </span>
      )}
      {status === "error" && (
        <span role="alert" style={{ gridColumn: "1 / -1", padding: "0 22px 14px", fontSize: 13, color: "#ff8f7d" }}>
          {es
            ? "No se pudo enviar la solicitud. Inténtalo de nuevo en unos minutos."
            : "We couldn't send your request. Please try again in a few minutes."}
        </span>
      )}
    </form>
  );
}
