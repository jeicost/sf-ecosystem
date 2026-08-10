import { NextRequest, NextResponse } from "next/server";

/**
 * Waitlist / creator-application endpoint.
 *
 * Reenvía server-side a formsubmit.co AJAX — el mecanismo estándar de forms
 * en las webs de clientes SF (mismo patrón que NC Global LeadMagnet y que
 * `clients/discoolver/creators-landing`, el proyecto hermano de Discoolver
 * ya en producción).
 *
 * Destino: env `WAITLIST_FORWARD_EMAIL`, con fallback `carlos@discoolver.com`
 * — la dirección que creators-landing usa en producción vía formsubmit, es
 * decir, la única de Discoolver ya ACTIVADA en formsubmit.co. Si se cambia el
 * destino (p. ej. a hola@discoolver.com), el primer envío dispara el email de
 * activación de formsubmit y los envíos fallarán (502 aquí, error visible en
 * el form) hasta que ese buzón confirme la activación — hacer un envío de
 * prueba real tras cambiarlo.
 *
 * Este endpoint NUNCA finge éxito: si formsubmit no confirma la entrega,
 * responde 502 y los formularios (HeroForm en la home, InfluencerForms en
 * /influencers) muestran el error al usuario.
 */

const FORWARD_EMAIL = (process.env.WAITLIST_FORWARD_EMAIL || "carlos@discoolver.com").trim();

/** `_subject` distinto según el formulario de origen (campo `source`). */
const SUBJECTS: Record<string, string> = {
  hero: "Discoolver waitlist — Hero (home)",
  app: "Discoolver waitlist — App coming soon",
  influencer: "Discoolver — Creator application",
  // /influencers, dos tracks: guía propia (creador con audiencia) y vídeo
  // (creador que empieza). Asunto distinto para poder triarlos en bandeja.
  "creator-guide": "Discoolver creators — Quiero mi guía",
  "creator-video": "Discoolver creators — Envío mi vídeo",
  // discoolver 360 (B2B). Un asunto por vertical para poder triar en bandeja:
  // un ayuntamiento y un hostal no se contestan igual ni con el mismo plazo.
  "360-demo": "discoolver 360 — Solicitud de demo",
  "360-destinos": "discoolver 360 — Destino / patronato / DMO",
  "360-alojamientos": "discoolver 360 — Alojamiento",
  "360-agencias": "discoolver 360 — Agencia / DMC",
};

/** Campos opcionales admitidos (whitelist: nada más se reenvía). */
const EXTRA_FIELDS = [
  "name",
  "handle",
  "link",
  "city",
  "type",
  "region",
  "instagram",
  "tiktok",
  "youtube",
  "website",
  "other",
  "message",
  // Campos de discoolver 360 (B2B). Si se añade uno al formulario y NO se
  // añade aquí, se pierde en silencio: la whitelist descarta todo lo demás.
  "organization",
  "role",
  "phone",
  "vertical",
  "modules",
] as const;

function clean(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const s = value.trim().slice(0, 2000);
  return s || undefined;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const email = clean(body?.email) ?? "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  const source = clean(body?.source) ?? "";
  const payload: Record<string, string> = {
    email,
    source: source || "unknown",
    _subject: SUBJECTS[source] ?? "Discoolver waitlist",
    _template: "table",
  };
  // El lead B2B recibe confirmación con plazo — la misma promesa que hace la
  // pantalla de éxito del DemoForm. Solo en la demo: los forms B2C no la llevan.
  if (source === "360-demo") {
    payload._autoresponse =
      "Recibido — tu solicitud de demo ya está en la bandeja del equipo de discoolver 360. " +
      "Te escribimos en menos de 24 horas laborables con dos o tres huecos para la media hora. " +
      "Si quieres que llevemos algo preparado, responde a este correo con la web de tu organización " +
      "o el nombre de tu destino.";
  }
  for (const key of EXTRA_FIELDS) {
    const value = clean(body?.[key]);
    if (value) payload[key] = value;
  }
  if (Array.isArray(body?.focus)) {
    const focus = body.focus
      .filter((f): f is string => typeof f === "string")
      .join(", ")
      .slice(0, 500);
    if (focus) payload.focus = focus;
  }

  try {
    const res = await fetch(`https://formsubmit.co/ajax/${FORWARD_EMAIL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => null)) as { success?: string | boolean; message?: string } | null;
    if (!res.ok || String(data?.success) !== "true") {
      console.error("[waitlist] formsubmit forward failed", { status: res.status, message: data?.message });
      return NextResponse.json({ ok: false, error: "forward_failed" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[waitlist] formsubmit unreachable", err);
    return NextResponse.json({ ok: false, error: "forward_failed" }, { status: 502 });
  }
}
