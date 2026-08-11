"use client";

import { useState } from "react";
import { Icon } from "./Icon";

/**
 * City-request waitlist form ("¿Tu ciudad no está? Avísame"). Posts to
 * /api/waitlist which forwards server-side to formsubmit.co — the endpoint
 * never fakes success, so both outcomes are surfaced to the user. Free-text
 * city (the whole point is asking for cities we don't cover yet).
 */
export function HeroForm() {
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
    <form className="hero__searchbar" aria-label="Formulario de aviso: pide la guía de tu ciudad" onSubmit={handleSubmit}>
      <div className="search__field">
        <label htmlFor="waitlist-city" className="search__label">
          Tu ciudad
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
          placeholder="tu@correo.com"
          required
          aria-required="true"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <button type="submit" className="search__btn" aria-label="Avisarme cuando salga la guía" disabled={status === "loading"}>
        Avísame <Icon name="arrow-right" />
      </button>
      {status === "done" && (
        <span role="status" style={{ gridColumn: "1 / -1", padding: "10px 22px 14px", fontSize: 13, color: "var(--accent)" }}>
          Hecho. Te avisamos cuando la guía de tu ciudad entre en edición.
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
