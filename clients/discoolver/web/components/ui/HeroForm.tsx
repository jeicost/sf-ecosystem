"use client";

import { useState } from "react";
import { Icon } from "./Icon";

const CITIES = [
  "Madrid",
  "Barcelona",
  "Sevilla",
  "Valencia",
  "Bilbao",
  "Málaga",
  "Zaragoza",
  "Granada",
  "San Sebastián",
  "Palma",
  "Toledo",
  "Córdoba",
];

export function HeroForm() {
  const [cityIndex, setCityIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, city: CITIES[cityIndex] }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className="hero__searchbar" aria-label="Formulario de acceso a la lista de espera" onSubmit={handleSubmit}>
      <button
        type="button"
        className="search__field"
        aria-label={`Ciudad seleccionada: ${CITIES[cityIndex]}. Haz clic para cambiar.`}
        onClick={() => setCityIndex((i) => (i + 1) % CITIES.length)}
      >
        <span className="search__label">Tu ciudad</span>
        <span className="search__value">{CITIES[cityIndex]} ↻</span>
      </button>
      <div className="search__field" style={{ gridColumn: "span 2" }}>
        <label htmlFor="hero-email" className="search__label">
          Email para tu código de acceso
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
      <button type="submit" className="search__btn" aria-label="Pedir invitación" disabled={status === "loading"}>
        <Icon name="arrow-right" />
      </button>
      {status === "done" && (
        <span className="sr-only" role="status">
          Solicitud enviada, revisa tu correo.
        </span>
      )}
    </form>
  );
}
