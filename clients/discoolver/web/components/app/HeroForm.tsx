"use client";

import { useState } from "react";
import { AvisoDatos } from "@/components/ui/AvisoDatos";
import { Icon } from "@/components/ui/Icon";
import type { Locale } from "@/lib/i18n";

const CITIES = [
  "Madrid",
  "Barcelona",
  "Málaga",
  "Ronda",
  "Ibiza",
  "Aranjuez",
  "Punta Cana",
  "Santo Domingo",
  "Bangkok",
  "Otra ciudad",
];

export function HeroForm({ locale }: { locale: Locale }) {
  const [cityIndex, setCityIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const es = locale === "es";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, city: CITIES[cityIndex], source: "hero", locale }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form
      className="hero__searchbar"
      aria-label={es ? "Formulario de aviso de apertura de ciudad" : "City opening alert form"}
      onSubmit={handleSubmit}
    >
      <button
        type="button"
        className="search__field"
        aria-label={
          es
            ? `Ciudad seleccionada: ${CITIES[cityIndex]}. Haz clic para cambiar.`
            : `Selected city: ${CITIES[cityIndex]}. Click to change.`
        }
        onClick={() => setCityIndex((i) => (i + 1) % CITIES.length)}
      >
        <span className="search__label">{es ? "Tu ciudad" : "Your city"}</span>
        <span className="search__value">{CITIES[cityIndex]} ↻</span>
      </button>
      <div className="search__field" style={{ gridColumn: "span 2" }}>
        <label htmlFor="hero-email" className="search__label">
          {/* Decía «Email para tu código de acceso» y prometía un correo que
              ningún sistema envía: la autorespuesta solo se adjunta al lead de
              360-demo. Se promete lo que sí se cumple. */}
          {es ? "Email para el aviso" : "Email for the alert"}
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
      <button
        type="submit"
        className="search__btn"
        aria-label={es ? "Avisarme cuando abra mi ciudad" : "Notify me when my city opens"}
        disabled={status === "loading"}
      >
        <Icon name="arrow-right" />
      </button>
      <div style={{ gridColumn: "1 / -1", padding: "0 22px 14px" }}>
        <AvisoDatos
          locale={locale}
          finalidad={es ? "avisarte el día que abra tu ciudad" : "let you know the day your city opens"}
        />
      </div>
      {status === "done" && (
        <span role="status" style={{ gridColumn: "1 / -1", padding: "10px 22px 14px", fontSize: 13, color: "var(--accent)" }}>
          {es ? "Apuntado. Te avisamos el día que abra tu ciudad." : "You're on the list. We'll write the day your city opens."}
        </span>
      )}
      {status === "error" && (
        <span role="alert" style={{ gridColumn: "1 / -1", padding: "10px 22px 14px", fontSize: 13, color: "#ff8f7d" }}>
          {es
            ? "No se pudo enviar la solicitud. Inténtalo de nuevo en unos minutos."
            : "We couldn't send your request. Please try again in a few minutes."}
        </span>
      )}
    </form>
  );
}
