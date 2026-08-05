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
 * responde 502 y los tres formularios (HeroForm, AppComingSoon,
 * InfluencerForm) muestran el error al usuario.
 */

const FORWARD_EMAIL = (process.env.WAITLIST_FORWARD_EMAIL || "carlos@discoolver.com").trim();

/** `_subject` distinto según el formulario de origen (campo `source`). */
const SUBJECTS: Record<string, string> = {
  hero: "Discoolver waitlist — Hero (home)",
  app: "Discoolver waitlist — App coming soon",
  influencer: "Discoolver — Creator application",
};

/** Campos opcionales admitidos (whitelist: nada más se reenvía). */
const EXTRA_FIELDS = ["city", "type", "region", "instagram", "tiktok", "youtube", "website", "other", "message"] as const;

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
