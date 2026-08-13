"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { PLATFORM } from "@/lib/platform";
import type { Locale } from "@/lib/i18n";

/**
 * La puerta del hero: entrar en la plataforma, con el correo opcional.
 *
 * QUÉ SUSTITUYE. Antes había un formulario que pedía ciudad y correo, los dos
 * obligatorios, y prometía avisar «el día que abra tu ciudad». La plataforma
 * ya está abierta, así que pedir permiso para entrar en algo que está abierto
 * era el mayor freno del embudo.
 *
 * CÓMO FUNCIONA AHORA. El correo es opcional y nunca bloquea:
 *   · Con correo → se guarda el lead y se entra.
 *   · Sin correo → se entra igual, sin dejar nada.
 * Escribir el correo no puede costarle al visitante la entrada, así que si el
 * guardado falla se entra de todos modos: el lead es nuestro problema, no suyo.
 *
 * ⚠️ LO QUE FALTA PARA QUE EL CORREO **INICIE SESIÓN**. La idea es que dejar el
 * correo te deje dentro ya identificado. Eso no depende de esta web: hace falta
 * que app.discoolver.com acepte una entrega de sesión (enlace mágico o SSO por
 * JWT, lo que Diego prefiera). Mientras no exista, el correo se guarda y la
 * entrada es anónima. El día que exista, solo hay que cambiar `destino()`.
 */
export function HeroEntrar({ locale = "es" }: { locale?: Locale }) {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const es = locale === "es";

  function destino(): string {
    // Cuando la plataforma acepte la entrega de sesión, aquí se construye la
    // URL con el correo firmado. Hoy entra sin identificar.
    return PLATFORM.home;
  }

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
        // Da igual: no se le cierra la puerta a nadie por esto.
      }
    }
    window.location.href = destino();
  }

  return (
    <form className="hero-entrar" onSubmit={entrar} aria-label={es ? "Entrar en la plataforma" : "Enter the platform"}>
      <div className="hero-entrar__row">
        <label className="hero-entrar__field">
          <span className="visually-hidden">{es ? "Tu email (opcional)" : "Your email (optional)"}</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={es ? "tu@correo.com — opcional" : "you@email.com — optional"}
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={enviando}>
          {es ? "Entrar" : "Enter"} <Icon name="arrow-up-right" size={14} />
        </button>
      </div>
      <p className="hero-entrar__nota">
        {es
          ? "Déjanos tu correo y te reconocemos la próxima vez. O entra sin más y mira la ciudad — no hace falta cuenta."
          : "Leave your email and we'll remember you next time. Or just walk in and look around — no account needed."}
      </p>
    </form>
  );
}
