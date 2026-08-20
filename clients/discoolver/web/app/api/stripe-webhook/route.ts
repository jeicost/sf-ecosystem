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
/** La tienda de guías es B2C: va al buzón general, el mismo que la landing. */
const FORWARD_TO = (process.env.LEADS_EMAIL_GENERAL || "hello@discoolver.com").trim();

/** Sitio canónico: formsubmit exige un Referer con pinta de web real. */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://discoolver.com").replace(/\/$/, "");

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
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          // Sin Referer/Origin formsubmit rechaza la petición creyendo que viene
          // de un HTML abierto en local, y Node no las manda por su cuenta. Aquí
          // faltaban: el pedido de alguien que YA HA PAGADO no llegaba a nadie
          // y solo quedaba un console.error que nadie lee (auditoría 20-ago-2026).
          Referer: `${SITE_URL}/`,
          Origin: SITE_URL,
        },
        body: JSON.stringify(pedido),
      });
      // formsubmit responde 200 aunque rechace: hay que mirar el cuerpo.
      const data = (await res.json().catch(() => null)) as { success?: string | boolean } | null;
      const ok = res.ok && (data?.success === true || data?.success === "true");
      if (!ok) {
        console.error("[stripe-webhook] PEDIDO PAGADO SIN AVISAR", {
          status: res.status, session: pedido.session, destino: FORWARD_TO,
        });
      }
    } catch (err) {
      // El pago YA está cobrado: nunca devolvemos error a Stripe por el email.
      console.error("[stripe-webhook] forward", err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.json({ received: true });
}
