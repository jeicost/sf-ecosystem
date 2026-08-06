"use client";

import { useState } from "react";

/**
 * Formulario cualificado de /360/demo.
 *
 * La web antigua resolvía el B2B con un `mailto:` enterrado. Aquí se pide lo
 * mínimo para poder preparar la llamada: quién eres, qué gestionas y qué te
 * duele. Postea al endpoint existente /api/waitlist, que reenvía por
 * formsubmit y NUNCA finge éxito (si no confirma, 502 y error visible).
 *
 * Ojo: cada campo nuevo tiene que estar en EXTRA_FIELDS de
 * app/api/waitlist/route.ts o se pierde sin avisar.
 */

const VERTICALES = [
  "Destino · ayuntamiento, patronato o DMO",
  "Alojamiento · hotel, hostal o apartamentos",
  "Agencia · DMC, touroperador o receptivo",
  "Otro",
];

const MODULOS = [
  "Marketplace",
  "Software de caja (POS)",
  "Plan My Trip",
  "Calendario inteligente",
  "Asistente de voz local",
  "Señalética y tótems",
  "Business Intelligence",
  "Todavía no lo sé",
];

type State = "idle" | "sending" | "ok" | "error";

export function DemoForm() {
  const [state, setState] = useState<State>("idle");
  const [mods, setMods] = useState<string[]>([]);

  function toggle(m: string) {
    setMods((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState("sending");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "360-demo",
          email: fd.get("email"),
          name: fd.get("name"),
          organization: fd.get("organization"),
          role: fd.get("role"),
          phone: fd.get("phone"),
          vertical: fd.get("vertical"),
          modules: mods.join(", "),
          message: fd.get("message"),
        }),
      });
      setState(res.ok ? "ok" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "ok") {
    return (
      <div className="card" style={{ borderColor: "var(--b-primary)" }}>
        <h3 className="h-card">Recibido</h3>
        <p style={{ margin: 0 }}>
          Te escribimos al email que nos has dejado para cuadrar la demo. Contesta una persona del
          equipo, no un automatismo.
        </p>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="grid g-2" style={{ gap: 16 }}>
        <div className="field">
          <label htmlFor="f-name">Nombre y apellidos</label>
          <input id="f-name" name="name" required autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="f-role">Cargo</label>
          <input id="f-role" name="role" placeholder="Director de turismo, dirección de hotel…" />
        </div>
      </div>

      <div className="field">
        <label htmlFor="f-org">Organización o establecimiento</label>
        <input id="f-org" name="organization" required />
      </div>

      <div className="grid g-2" style={{ gap: 16 }}>
        <div className="field">
          <label htmlFor="f-email">Email</label>
          <input id="f-email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="f-phone">Teléfono (opcional)</label>
          <input id="f-phone" name="phone" type="tel" autoComplete="tel" />
        </div>
      </div>

      <div className="field">
        <label htmlFor="f-vertical">Qué gestionas</label>
        <select id="f-vertical" name="vertical" required defaultValue="">
          <option value="" disabled>
            Elige una opción
          </option>
          {VERTICALES.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Qué módulos te interesan</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
          {MODULOS.map((m) => {
            const on = mods.includes(m);
            return (
              <button
                type="button"
                key={m}
                onClick={() => toggle(m)}
                aria-pressed={on}
                style={{
                  fontFamily: "var(--b-body)",
                  fontSize: 13.5,
                  padding: "8px 14px",
                  borderRadius: 999,
                  cursor: "pointer",
                  color: on ? "#fff" : "var(--b-muted)",
                  background: on ? "var(--b-primary)" : "transparent",
                  border: `1px solid ${on ? "var(--b-primary)" : "var(--b-line-soft)"}`,
                }}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      <div className="field">
        <label htmlFor="f-msg">Qué problema quieres resolver</label>
        <textarea
          id="f-msg"
          name="message"
          placeholder="Ej.: la oficina de turismo no puede cobrar, o el comercio local no aparece en el recorrido del visitante."
        />
      </div>

      <button type="submit" className="btn btn-1" disabled={state === "sending"}>
        {state === "sending" ? "Enviando…" : "Pedir la demo"} <span aria-hidden="true">→</span>
      </button>

      {state === "error" && (
        <p style={{ color: "var(--b-primary)", fontSize: 14, margin: 0 }} role="alert">
          No se pudo enviar. Inténtalo de nuevo en unos minutos o escribe a info@discoolver.com.
        </p>
      )}

      <p className="small" style={{ margin: 0, color: "var(--b-slate)", fontSize: 13 }}>
        Solo usamos estos datos para preparar y responder a tu solicitud.{" "}
        <a href="/privacidad" style={{ color: "var(--b-muted)", textDecoration: "underline" }}>
          Política de privacidad
        </a>
        .
      </p>
    </form>
  );
}
