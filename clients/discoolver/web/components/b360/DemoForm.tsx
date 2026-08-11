"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";

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

const T = {
  es: {
    verticales: [
      "Destino · ayuntamiento, patronato o DMO",
      "Alojamiento · hotel, hostal o apartamentos",
      "Agencia · DMC, touroperador o receptivo",
      "Otro",
    ],
    modulos: [
      "Marketplace",
      "Software de caja (POS)",
      "Plan My Trip",
      "Calendario inteligente",
      "Asistente de voz local",
      "Señalética y tótems",
      "Business Intelligence",
      "Todavía no lo sé",
    ],
    okTitle: "Recibido. Ya está en la bandeja del equipo.",
    okBody1a: "Te escribimos ",
    okBody1b: "en menos de 24 horas laborables",
    okBody1c:
      " al correo que nos has dejado, con dos o tres huecos para la media hora. Contesta una persona que conoce el producto, no un automatismo.",
    okBody2:
      "Si quieres que llevemos algo preparado, responde a ese correo con la web de tu organización o el nombre de tu destino. ¿Prefieres escribir tú? info@discoolver.com",
    name: "Nombre y apellidos",
    role: "Cargo",
    rolePh: "Director de turismo",
    org: "Organización o establecimiento",
    city: "Destino o ciudad",
    cityPh: "Ronda, Costa del Sol…",
    email: "Email",
    phone: "Teléfono (opcional)",
    vertical: "Qué gestionas",
    chooseOne: "Elige una opción",
    modules: "Qué módulos te interesan",
    problem: "Qué problema quieres resolver",
    problemPh:
      "Ej.: la oficina de turismo no puede cobrar, o el comercio local no aparece en el recorrido del visitante.",
    sending: "Enviando…",
    submit: "Pedir la demo",
    error: "No se pudo enviar. Inténtalo de nuevo en unos minutos o escribe a info@discoolver.com.",
    legal1:
      "Al enviar aceptas que tratemos estos datos solo para preparar y responder a tu solicitud. Puedes pedirnos que los borremos en info@discoolver.com.",
    legal2: "Política de privacidad",
  },
  en: {
    verticales: [
      "Destination · city council, tourism board or DMO",
      "Accommodation · hotel, hostel or apartments",
      "Agency · DMC, tour operator or inbound",
      "Other",
    ],
    modulos: [
      "Marketplace",
      "Point of sale software (POS)",
      "Plan My Trip",
      "Smart Calendar",
      "Local voice assistant",
      "Signage & interactive kiosks",
      "Business Intelligence",
      "Not sure yet",
    ],
    okTitle: "Received. It's in the team's inbox.",
    okBody1a: "We'll write to you ",
    okBody1b: "within 24 working hours",
    okBody1c:
      " at the email you left, with two or three slots for the half hour. A person who knows the product replies — not an automation.",
    okBody2:
      "Want us to come prepared? Reply to that email with your organization's website or your destination's name. Prefer to write first? info@discoolver.com",
    name: "Full name",
    role: "Role",
    rolePh: "Head of tourism",
    org: "Organization or property",
    city: "Destination or city",
    cityPh: "Ronda, Costa del Sol…",
    email: "Email",
    phone: "Phone (optional)",
    vertical: "What do you manage",
    chooseOne: "Choose an option",
    modules: "Which modules interest you",
    problem: "What problem do you want to solve",
    problemPh:
      "E.g.: the tourist office can't take payments, or local businesses don't show up on the visitor's route.",
    sending: "Sending…",
    submit: "Book the demo",
    error: "Couldn't send. Try again in a few minutes or write to info@discoolver.com.",
    legal1:
      "By submitting you agree we use this data only to prepare and answer your request. Ask us to delete it any time at info@discoolver.com.",
    legal2: "Privacy policy",
  },
} as const;

type State = "idle" | "sending" | "ok" | "error";

export function DemoForm({ defaultVertical = "", locale = "es" }: { defaultVertical?: string; locale?: Locale }) {
  const t = T[locale];
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
        <h3 className="h-card">{t.okTitle}</h3>
        <p style={{ marginTop: 0 }}>
          {t.okBody1a}<strong>{t.okBody1b}</strong>{t.okBody1c}
        </p>
        <p style={{ margin: 0 }} className="small">
          {t.okBody2}
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
          <label htmlFor="f-name">{t.name}</label>
          <input id="f-name" name="name" required autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="f-role">{t.role}</label>
          <input id="f-role" name="role" placeholder={t.rolePh} />
        </div>
      </div>

      <div className="grid g-2" style={{ gap: 16 }}>
        <div className="field">
          <label htmlFor="f-org">{t.org}</label>
          <input id="f-org" name="organization" required />
        </div>
        <div className="field">
          <label htmlFor="f-city">{t.city}</label>
          <input id="f-city" name="city" required placeholder={t.cityPh} />
        </div>
      </div>

      <div className="grid g-2" style={{ gap: 16 }}>
        <div className="field">
          <label htmlFor="f-email">{t.email}</label>
          <input id="f-email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="f-phone">{t.phone}</label>
          <input id="f-phone" name="phone" type="tel" autoComplete="tel" />
        </div>
      </div>

      <div className="field">
        <label htmlFor="f-vertical">{t.vertical}</label>
        <select id="f-vertical" name="vertical" required defaultValue={defaultVertical}>
          <option value="" disabled>
            {t.chooseOne}
          </option>
          {t.verticales.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>{t.modules}</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
          {t.modulos.map((m) => {
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
        <label htmlFor="f-msg">{t.problem}</label>
        <textarea
          id="f-msg"
          name="message"
          placeholder={t.problemPh}
        />
      </div>

      <button type="submit" className="btn btn-1" disabled={state === "sending"}>
        {state === "sending" ? t.sending : t.submit} <span aria-hidden="true">→</span>
      </button>

      {state === "error" && (
        <p style={{ color: "var(--b-primary)", fontSize: 14, margin: 0 }} role="alert">
          {t.error}
        </p>
      )}

      <p className="small" style={{ margin: 0, color: "var(--b-slate)", fontSize: 13 }}>
        {t.legal1}{" "}
        <a href="/privacidad" style={{ color: "var(--b-muted)", textDecoration: "underline" }}>
          {t.legal2}
        </a>
        .
      </p>
    </form>
  );
}
