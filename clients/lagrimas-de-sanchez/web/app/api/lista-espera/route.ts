import { NextResponse } from "next/server";
import { esSku } from "@/lib/catalogo";
import { site } from "@/lib/site";

/**
 * Lista de espera para el estado "tienda cerrada".
 *
 * Mientras no haya claves de Stripe, cada visita que pulsa Comprar se
 * perdería. En su lugar se apunta el correo y llega al buzón por el mismo
 * canal server-side que usan los pedidos.
 *
 * Contra el abuso: un honeypot (los bots de formularios rellenan el campo
 * invisible y se les responde "ok" sin enviar nada) y un límite por IP en
 * memoria. El límite es por instancia serverless — mejor esfuerzo, no
 * garantía — que para un formulario temporal es exactamente suficiente.
 */
const BUZON = (process.env.PEDIDOS_EMAIL || site.email).trim();

const VENTANA_MS = 60_000;
const MAX_POR_VENTANA = 5;
const golpes = new Map<string, { n: number; desde: number }>();

function limitada(ip: string): boolean {
  const ahora = Date.now();
  const g = golpes.get(ip);
  if (!g || ahora - g.desde > VENTANA_MS) {
    golpes.set(ip, { n: 1, desde: ahora });
    return false;
  }
  g.n++;
  return g.n > MAX_POR_VENTANA;
}

export async function POST(request: Request) {
  let body: { email?: string; sku?: string; _honey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "peticion_invalida" }, { status: 400 });
  }

  // Honeypot: a los bots se les dice que sí y no se envía nada.
  if (body._honey) return NextResponse.json({ ok: true });

  const ip = (request.headers.get("x-forwarded-for") ?? "?").split(",")[0].trim();
  if (limitada(ip)) {
    return NextResponse.json({ ok: false, error: "demasiadas" }, { status: 429 });
  }

  const email = (body.email ?? "").trim().slice(0, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ ok: false, error: "email_invalido" }, { status: 400 });
  }
  if (!esSku(body.sku)) {
    return NextResponse.json({ ok: false, error: "sku_desconocido" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(BUZON)}`, {
      method: "POST",
      headers: { "content-type": "application/json", Referer: site.url },
      body: JSON.stringify({
        _subject: `Lista de espera · ${body.sku}`,
        email,
        producto: body.sku,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`formsubmit ${res.status}`);
  } catch (err) {
    console.error("[lista-espera]", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: "no_enviado" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
