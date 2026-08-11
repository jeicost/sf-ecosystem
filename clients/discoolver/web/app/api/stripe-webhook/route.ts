import { NextResponse } from "next/server";
import Stripe from "stripe";

/**
 * Webhook de Stripe — el ÚNICO sitio que da un pago por bueno.
 *
 * checkout.session.completed → reenvía el pedido por email (formsubmit, el
 * mismo canal server-side que ya usa la waitlist) con comprador, SKU, importe
 * y dirección si es papel. El fulfillment de la digital es manual mientras el
 * export del dg-editor no esté automatizado: el pedido llega al buzón y se
 * responde con la guía. Está anotado como paso 2 en STRIPE.md.
 *
 * Env: STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET (whsec_… del endpoint que se
 * crea en el dashboard de Stripe apuntando a /api/stripe-webhook).
 */
const FORWARD_TO = process.env.WAITLIST_FORWARD_EMAIL || "carlos@discoolver.com";

export async function POST(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  const whsec = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key || !whsec) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const stripe = new Stripe(key);
  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature ?? "", whsec);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    const pedido = {
      _subject: `🛒 PEDIDO ${s.metadata?.sku ?? "?"} — ${((s.amount_total ?? 0) / 100).toFixed(2)}€`,
      _template: "table",
      sku: s.metadata?.sku ?? "desconocido",
      importe: `${((s.amount_total ?? 0) / 100).toFixed(2)} €`,
      email: s.customer_details?.email ?? "—",
      nombre: s.customer_details?.name ?? "—",
      direccion: s.collected_information?.shipping_details
        ? JSON.stringify(s.collected_information.shipping_details.address)
        : "digital — sin envío",
      session: s.id,
    };
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${FORWARD_TO}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(pedido),
      });
      if (!res.ok) console.error("[stripe-webhook] formsubmit", res.status);
    } catch (err) {
      // El pago YA está cobrado: nunca devolvemos error a Stripe por el email.
      console.error("[stripe-webhook] forward", err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.json({ received: true });
}
