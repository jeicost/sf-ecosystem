import { NextResponse } from "next/server";
import Stripe from "stripe";
import { CATALOGO, esSku, precioES } from "@/lib/catalogo";
import { TARIFAS } from "@/lib/envio";
import { site } from "@/lib/site";

/**
 * Webhook de Stripe — el ÚNICO sitio que da un pago por bueno.
 *
 * /gracias no confirma nada: cualquiera puede escribir esa ruta en la barra del
 * navegador. Solo Stripe firma un cobro real, y esa firma se comprueba aquí.
 *
 * checkout.session.completed → manda el pedido al buzón con comprador, SKU,
 * importe, dirección y tarifa de envío elegida. El fulfillment es manual
 * mientras el volumen lo permita: llega el correo, se prepara la caja y se
 * numera la botella a mano.
 *
 * Env: STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET (el whsec_… del endpoint que
 * se crea en el panel apuntando a /api/stripe-webhook).
 */

const BUZON = (process.env.PEDIDOS_EMAIL || site.email).trim();

/**
 * Un pedido internacional que ha pagado el porte peninsular está mal cobrado.
 *
 * Pasa porque Stripe Checkout enseña TODAS las tarifas al comprador sin poder
 * filtrarlas por el país que acaba de escribir (ver lib/envio.ts). Se compara
 * contra el importe, no contra el nombre de la tarifa: el nombre habría que
 * expandirlo con otra llamada a la API y el importe ya viene en el evento.
 */
function revisar(pais: string | undefined, porteCobrado: number): string | null {
  if (!pais || pais === "ES") return null;
  const peninsular = TARIFAS.find((t) => t.id === "es")?.importe ?? 0;
  if (porteCobrado <= peninsular) {
    return `⚠️ REVISAR ANTES DE ENVIAR: destino ${pais} con porte de ${precioES(porteCobrado)}. Se ha cobrado la tarifa peninsular y el envío cuesta más.`;
  }
  return null;
}

export async function POST(request: Request) {
  const clave = process.env.STRIPE_SECRET_KEY;
  const whsec = process.env.STRIPE_WEBHOOK_SECRET;
  if (!clave || !whsec) {
    return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });
  }

  const stripe = new Stripe(clave);
  const firma = request.headers.get("stripe-signature");
  const cuerpo = await request.text();

  let evento: Stripe.Event;
  try {
    evento = await stripe.webhooks.constructEventAsync(cuerpo, firma ?? "", whsec);
  } catch {
    return NextResponse.json({ ok: false, error: "firma_invalida" }, { status: 400 });
  }

  if (evento.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true, ignorado: evento.type });
  }

  const s = evento.data.object;

  // Una sesión "completed" solo cuenta si el pago está confirmado: con métodos
  // asíncronos el evento llega antes que el dinero.
  if (s.payment_status !== "paid") {
    return NextResponse.json({ ok: true, ignorado: "sin_pago" });
  }
  // Stripe reintenta el evento hasta recibir un 2xx. La marca en metadata hace
  // el reenvío idempotente: al-menos-una-vez sin pedidos duplicados en el buzón.
  if (s.metadata?.avisado === "1") {
    return NextResponse.json({ ok: true, ignorado: "ya_avisado" });
  }

  const sku = s.metadata?.sku;
  const producto = esSku(sku) ? CATALOGO[sku] : null;
  // Según la versión de API del endpoint, la dirección llega en un campo u otro.
  type ConEnvio = {
    shipping_details?: { name?: string | null; address?: Stripe.Address | null } | null;
  };
  const detalles =
    s.collected_information?.shipping_details ?? (s as unknown as ConEnvio).shipping_details;
  const dir = detalles?.address;
  const porte = s.shipping_cost?.amount_total ?? 0;

  const aviso = revisar(dir?.country ?? undefined, porte);

  const lineas = [
    aviso,
    `Producto: ${producto?.nombre ?? sku ?? "desconocido"}`,
    `Importe: ${precioES(s.amount_total ?? 0)}`,
    `Email: ${s.customer_details?.email ?? "—"}`,
    `Nombre: ${detalles?.name ?? s.customer_details?.name ?? "—"}`,
    "",
    "Dirección de envío:",
    dir
      ? [dir.line1, dir.line2, `${dir.postal_code} ${dir.city}`, dir.state, dir.country]
          .filter(Boolean)
          .join("\n")
      : "—",
    "",
    `Porte cobrado: ${precioES(porte)}`,
    `Sesión: ${s.id}`,
  ].filter(Boolean);

  // Se registra siempre en el log, pase lo que pase con el correo: si el aviso
  // falla, el pedido no se pierde — está en Stripe y está aquí.
  console.log("[pedido]", JSON.stringify({ sku, id: s.id, total: s.amount_total }));

  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(BUZON)}`, {
      method: "POST",
      headers: { "content-type": "application/json", Referer: site.url },
      body: JSON.stringify({
        _subject: `Pedido · ${producto?.nombre ?? sku} · ${precioES(s.amount_total ?? 0)}`,
        pedido: lineas.join("\n"),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`formsubmit ${res.status}`);
    // Marca de "ya avisado" DESPUÉS de que el aviso haya salido de verdad.
    await stripe.checkout.sessions.update(s.id, {
      metadata: { ...(s.metadata ?? {}), avisado: "1" },
    });
  } catch (err) {
    // Un 500 hace que Stripe REINTENTE el evento. Junto con la marca de
    // metadata, eso convierte "el aviso falló" en "el aviso llegará", en vez
    // de en un pedido perdido en silencio. El pedido está siempre en Stripe
    // y en el log de arriba, pase lo que pase.
    console.error("[webhook aviso]", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: "aviso_fallido" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
