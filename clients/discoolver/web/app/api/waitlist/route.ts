import { NextRequest, NextResponse } from "next/server";

/**
 * Waitlist / creator-application endpoint.
 *
 * GUARDA PRIMERO, AVISA DESPUÉS. El lead se escribe en la tabla `leads` de
 * Supabase (proyecto sf-cms) y solo entonces se intenta el aviso por email a
 * formsubmit.co. Si el aviso falla, la respuesta sigue siendo 200 porque el
 * lead ya está a salvo; el `notified: false` de la fila marca cuáles hay que
 * repescar a mano.
 *
 * EL ORDEN ERA EL CONTRARIO Y COSTÓ CARO. Hasta el 13-ago-2026 esto solo
 * reenviaba a formsubmit sin guardar nada, así que cuando el par
 * (carlos@discoolver.com, discoolver.com) resultó no estar activado en
 * formsubmit, los SIETE formularios de la web devolvieron 502 durante horas y
 * cada lead se perdió sin rastro. No volver a dejar un tercero como único
 * destino de un lead.
 *
 * DOS TRAMPAS DE FORMSUBMIT, las dos vividas:
 *  1. Sin cabecera `Referer` responde «Make sure you open this page through a
 *     web server» — y el fetch de Node NO la manda sola. Va explícita abajo.
 *  2. La activación es por par (destino, dominio), no por destino. Que
 *     `carlos@discoolver.com` estuviera activado desde creators-landing no
 *     servía para discoolver.com: hacía falta pulsar otro enlace de
 *     activación, en un correo que solo ve ese buzón.
 *
 * Solo se responde 502 si fallan las DOS vías, que es cuando el visitante
 * necesita saber que no ha quedado registrado.
 */

/**
 * Tres buzones según a quién le toca contestar (decisión de Carlos, 20-ago-2026).
 * Antes todo caía en uno solo y había que triar a mano por el asunto.
 *
 *   info@   → B2B: los cuatro formularios de discoolver 360.
 *   mk@     → creadores e influencers.
 *   hello@  → todo lo demás: landing, ciudades, blog y la tienda de guías.
 *
 * ⚠️ formsubmit se activa por par (destino, dominio): cada uno de los tres
 * buzones necesita su PROPIO enlace de activación pulsado desde discoolver.com.
 * Añadir un buzón nuevo aquí sin activarlo tira sus leads al correo — aunque el
 * lead sigue a salvo en la tabla `leads`, que es el motivo de que se guarde antes.
 */
const EMAIL_B2B = (process.env.LEADS_EMAIL_B2B || "info@discoolver.com").trim();
const EMAIL_CREATORS = (process.env.LEADS_EMAIL_CREATORS || "mk@discoolver.com").trim();
// OJO: aquí NO se usa el viejo WAITLIST_FORWARD_EMAIL a propósito. Sigue
// definido en Vercel apuntando a carlos@discoolver.com y, si se dejara en la
// cadena, ganaría sobre la decisión de repartir en tres buzones. Borrar esa
// variable del proyecto cuando se despliegue esto.
const EMAIL_GENERAL = (process.env.LEADS_EMAIL_GENERAL || "hello@discoolver.com").trim();

/** A qué buzón va cada `source`. Lo que no esté aquí cae en EMAIL_GENERAL. */
const ROUTING: Record<string, string> = {
  "360-demo": EMAIL_B2B,
  "360-destinos": EMAIL_B2B,
  "360-alojamientos": EMAIL_B2B,
  "360-agencias": EMAIL_B2B,
  influencer: EMAIL_CREATORS,
  "creator-guide": EMAIL_CREATORS,
  "creator-video": EMAIL_CREATORS,
};

function destinoPara(source: string): string {
  return ROUTING[source] ?? EMAIL_GENERAL;
}

/** El sitio canónico: formsubmit exige un Referer con pinta de web real. */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://discoolver.com").replace(/\/$/, "");

const LEADS_URL = process.env.LEADS_SUPABASE_URL?.replace(/\/$/, "");
const LEADS_KEY = process.env.LEADS_SUPABASE_ANON_KEY;

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

/**
 * Guarda el lead. Devuelve el id de la fila, o null si no se pudo escribir.
 *
 * `return=minimal` no es un capricho de eficiencia: la política de RLS deja
 * insertar a anon pero NO leer, así que pedir la fila de vuelta haría fallar
 * el INSERT entero.
 */
async function guardar(lead: Record<string, unknown>): Promise<boolean> {
  if (!LEADS_URL || !LEADS_KEY) {
    console.error("[waitlist] sin LEADS_SUPABASE_URL/KEY — el lead no se persiste");
    return false;
  }
  try {
    const res = await fetch(`${LEADS_URL}/rest/v1/leads`, {
      method: "POST",
      headers: {
        apikey: LEADS_KEY,
        Authorization: `Bearer ${LEADS_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(lead),
    });
    if (!res.ok) {
      console.error("[waitlist] insert falló", { status: res.status, body: await res.text().catch(() => "") });
      return false;
    }
    return true;
  } catch (err) {
    console.error("[waitlist] supabase inalcanzable", err);
    return false;
  }
}

/** Aviso por email. Best-effort: su fallo no invalida el lead. */
async function avisar(payload: Record<string, string>, destino: string): Promise<boolean> {
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${destino}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Sin estas dos, formsubmit rechaza la petición creyendo que viene de
        // un fichero HTML abierto en local. Node no las manda por su cuenta.
        Referer: `${SITE_URL}/`,
        Origin: SITE_URL,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json().catch(() => null)) as { success?: string | boolean; message?: string } | null;
    if (!res.ok || String(data?.success) !== "true") {
      console.error("[waitlist] formsubmit no confirmó", { status: res.status, message: data?.message });
      return false;
    }
    return true;
  } catch (err) {
    console.error("[waitlist] formsubmit inalcanzable", err);
    return false;
  }
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

  // Primero el aviso —con tope de 8 s para que un formsubmit lento no deje al
  // visitante mirando el botón— y después el guardado, que así puede anotar en
  // la propia fila si el aviso salió o no. Anon no puede hacer UPDATE, de modo
  // que `notified` hay que escribirlo en el INSERT o no se escribe nunca.
  const destino = destinoPara(source);
  const avisado = await avisar(payload, destino);
  const guardado = await guardar({
    site: "discoolver",
    source: source || "unknown",
    email,
    locale: clean(body?.locale) ?? "es",
    payload: Object.fromEntries(Object.entries(payload).filter(([k]) => !k.startsWith("_") && k !== "email")),
    notified: avisado,
  });

  if (!guardado && !avisado) {
    // Han fallado las dos vías: el lead se ha perdido de verdad y el
    // formulario debe decirlo en vez de dar las gracias.
    return NextResponse.json({ ok: false, error: "forward_failed" }, { status: 502 });
  }
  if (!avisado) {
    console.warn("[waitlist] lead guardado pero SIN aviso por email", { source, email, destino });
  }
  return NextResponse.json({ ok: true });
}
