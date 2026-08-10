"use client";

import { useState } from "react";

/**
 * Formulario cualificado de /360/demo (y embebido en /360/destinos).
 *
 * La web antigua resolvía el B2B con un `mailto:` enterrado. Aquí se pide lo
 * mínimo para poder preparar la llamada: quién eres, qué gestionas, dónde y
 * qué te duele. Postea al endpoint existente /api/waitlist, que reenvía por
 * formsubmit y NUNCA finge éxito (si no confirma, 502 y error visible).
 *
 * Ojo: cada campo nuevo tiene que estar en EXTRA_FIELDS de
 * app/api/waitlist/route.ts o se pierde sin avisar. `city` y `vertical` ya están.
 *
 * `defaultVertical` permite llegar preseleccionado desde cada página de
 * vertical (/360/demo?v=destino|alojamiento|agencia).
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

export function DemoForm({ defaultVertical = "" }: { defaultVertical?: string }) {
  const [state, setState] = useState<State>("idle");
  const [mods, setMods] = useState<string[]>([]);

  function toggle(m: string) {
    setMods((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // Honeypot: si un bot lo rellena, fingimos éxito y no enviamos nada.
    if (fd.get("website")) {
      setState("ok");
      return;
    }
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
          city: fd.get("city"),
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
        <h3 className="h-card">Recibido. Ya está en la bandeja del equipo.</h3>
        <p style={{ marginTop: 0 }}>
          Te escribimos <strong>en menos de 24 horas laborables</strong> al correo que nos has
          dejado, con dos o tres huecos para la media hora. Contesta una persona que conoce el
          producto, no un automatismo.
        </p>
        <p style={{ margin: 0 }} className="small">
          Si quieres que llevemos algo preparado, responde a ese correo con la web de tu
          organización o el nombre de tu destino. ¿Prefieres escribir tú? info@discoolver.com
        </p>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      {/* Honeypot invisible para bots — un humano nunca lo ve ni lo rellena. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-5000px", height: 0, width: 0, opacity: 0 }}
      />

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

      <div className="grid g-2" style={{ gap: 16 }}>
        <div className="field">
          <label htmlFor="f-org">Organización o establecimiento</label>
          <input id="f-org" name="organization" required />
        </div>
        <div className="field">
          <label htmlFor="f-city">Destino o ciudad</label>
          <input id="f-city" name="city" required placeholder="Ronda, Costa del Sol…" />
        </div>
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
        <select id="f-vertical" name="vertical" required defaultValue={defaultVertical}>
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
        Al enviar aceptas que tratemos estos datos solo para preparar y responder a tu solicitud.
        Puedes pedirnos que los borremos en info@discoolver.com.{" "}
        <a href="/privacidad" style={{ color: "var(--b-muted)", textDecoration: "underline" }}>
          Política de privacidad
        </a>
        .
      </p>
    </form>
  );
}
