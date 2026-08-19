"use client";

import { useState } from "react";
import { PLATFORM } from "@/lib/platform";
import type { Locale } from "@/lib/i18n";

/**
 * La puerta del hero: un solo botón primario, el correo como vía rápida.
 *
 * ⚠️ ENLACE MÁGICO — LO QUE FALTA. El brief pide que el botón diga «Entrar sin
 * contraseña» y que el microcopy prometa un enlace por correo. Comprobado el
 * 19-ago-2026 contra app.discoolver.com: su autenticación es **correo +
 * contraseña y Google**, no hay passwordless. Prometerlo hoy dejaría al
 * visitante esperando un correo que nadie manda, que es peor que no pedirlo.
 *
 * Por eso el copy del enlace mágico vive detrás de `MAGIC_LINK`. El día que
 * Diego exponga el endpoint (o una entrega de sesión por JWT) se pone a `true`
 * y se cablea `destino()`: es el único cambio necesario, los textos ya están
 * escritos abajo.
 */
const MAGIC_LINK = false;

const T = {
  es: {
    placeholder: "tu@email.com",
    botonMagico: "Entrar sin contraseña",
    boton: "Entrar en la plataforma",
    notaMagica: "Te mandamos un enlace. Sin contraseña, sin formulario — y tus sitios guardados te esperan luego en el móvil.",
    nota: "Entras al momento. Guardamos tu correo para reconocerte la próxima vez.",
    secundario: "o mira la ciudad sin entrar",
    ciudadPregunta: "¿Tu ciudad no está? Avísame cuando abra",
    ciudadPlaceholder: "tu@email.com",
    ciudadCiudad: "¿Qué ciudad?",
    ciudadBoton: "Avisadme",
    ciudadOk: "Hecho. Te escribimos el día que abra.",
    ciudadError: "No hemos podido guardarlo. Prueba otra vez en un momento.",
    aria: "Entrar en la plataforma",
  },
  en: {
    placeholder: "you@email.com",
    botonMagico: "Sign in without a password",
    boton: "Enter the platform",
    notaMagica: "We'll email you a link. No password, no form — and your saved places will be waiting on your phone.",
    nota: "You're in right away. We keep your email to recognise you next time.",
    secundario: "or just browse the city",
    ciudadPregunta: "City not listed? Tell me when it opens",
    ciudadPlaceholder: "you@email.com",
    ciudadCiudad: "Which city?",
    ciudadBoton: "Notify me",
    ciudadOk: "Done. We'll write the day it opens.",
    ciudadError: "We couldn't save it. Try again in a moment.",
    aria: "Enter the platform",
  },
} as const;

export function HeroEntrar({ locale = "es" }: { locale?: Locale }) {
  const t = T[locale === "en" ? "en" : "es"];
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);

  // La salida para quien no tiene ciudad no ocupa sitio hasta que se pide.
  const [abierto, setAbierto] = useState(false);
  const [avisoEmail, setAvisoEmail] = useState("");
  const [avisoCiudad, setAvisoCiudad] = useState("");
  const [avisoEstado, setAvisoEstado] = useState<"" | "enviando" | "ok" | "error">("");

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const correo = email.trim();
    if (correo) {
      try {
        await fetch("/api/waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: correo, source: "entrar", locale }),
        });
      } catch {
        // El lead es problema nuestro: a nadie se le cierra la puerta por esto.
      }
    }
    window.location.href = PLATFORM.home;
  }

  async function avisar(e: React.FormEvent) {
    e.preventDefault();
    setAvisoEstado("enviando");
    try {
      const r = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: avisoEmail.trim(),
          // La whitelist del endpoint (EXTRA_FIELDS) admite "city": mandarlo
          // como "ciudad" lo tiraría por el camino sin avisar.
          city: avisoCiudad.trim(),
          source: "ciudad",
          locale,
        }),
      });
      setAvisoEstado(r.ok ? "ok" : "error");
    } catch {
      setAvisoEstado("error");
    }
  }

  return (
    <div className="hero-entrar">
      <form onSubmit={entrar} aria-label={t.aria}>
        <div className="hero-entrar__row">
          <label className="hero-entrar__field">
            <span className="visually-hidden">{locale === "en" ? "Your email" : "Tu email"}</span>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t.placeholder}
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {MAGIC_LINK ? t.botonMagico : t.boton} <span aria-hidden="true">→</span>
          </button>
        </div>
        <p className="hero-entrar__nota">{MAGIC_LINK ? t.notaMagica : t.nota}</p>
      </form>

      <a className="hero-entrar__secundario" href={PLATFORM.home}>
        {t.secundario} <span aria-hidden="true">→</span>
      </a>

      {avisoEstado === "ok" ? (
        <p className="hero-entrar__aviso-ok">{t.ciudadOk}</p>
      ) : abierto ? (
        <form className="hero-entrar__aviso" onSubmit={avisar}>
          <label className="visually-hidden" htmlFor="aviso-ciudad">
            {t.ciudadCiudad}
          </label>
          <input
            id="aviso-ciudad"
            type="text"
            placeholder={t.ciudadCiudad}
            value={avisoCiudad}
            onChange={(ev) => setAvisoCiudad(ev.target.value)}
            required
          />
          <label className="visually-hidden" htmlFor="aviso-email">
            {t.ciudadPlaceholder}
          </label>
          <input
            id="aviso-email"
            type="email"
            placeholder={t.ciudadPlaceholder}
            value={avisoEmail}
            onChange={(ev) => setAvisoEmail(ev.target.value)}
            required
          />
          <button type="submit" className="btn btn-ghost" disabled={avisoEstado === "enviando"}>
            {t.ciudadBoton}
          </button>
          {avisoEstado === "error" && <span className="hero-entrar__aviso-error">{t.ciudadError}</span>}
        </form>
      ) : (
        <button type="button" className="hero-entrar__salida" onClick={() => setAbierto(true)}>
          {t.ciudadPregunta} <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
}
