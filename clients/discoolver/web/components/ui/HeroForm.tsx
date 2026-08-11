"use client";

import { useState } from "react";
import { UI, type Locale } from "@/lib/i18n";
import { Icon } from "./Icon";

/**
 * City-request waitlist form ("¿Tu ciudad no está? Avísame"). Posts to
 * /api/waitlist which forwards server-side to formsubmit.co — the endpoint
 * never fakes success, so both outcomes are surfaced to the user. Free-text
 * city (the whole point is asking for cities we don't cover yet).
 */
export function HeroForm({ locale = "es" }: { locale?: Locale }) {
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, city, source: "hero" }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className="hero__searchbar" aria-label={locale === "en" ? "Waitlist form: request your city's guide" : "Formulario de aviso: pide la guía de tu ciudad"} onSubmit={handleSubmit}>
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
          Email para el aviso
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
      {status === "done" && (
        <span role="status" style={{ gridColumn: "1 / -1", padding: "10px 22px 14px", fontSize: 13, color: "var(--accent)" }}>
          {UI[locale].heroForm.done}
        </span>
      )}
      {status === "error" && (
        <span role="alert" style={{ gridColumn: "1 / -1", padding: "10px 22px 14px", fontSize: 13, color: "#ff8f7d" }}>
          No se pudo enviar la solicitud. Inténtalo de nuevo en unos minutos.
        </span>
      )}
    </form>
  );
}
