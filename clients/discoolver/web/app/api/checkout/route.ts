import { NextResponse } from "next/server";
import Stripe from "stripe";
import { CATALOGO, RENUNCIA, necesitaRenuncia, type Sku } from "@/lib/checkout";
import { site } from "@/lib/site";

/**
 * Crea una sesión de Stripe Checkout (hosted) para un SKU del catálogo.
 *
 * POST { sku: "madrid-digital" | "madrid-papel", locale?: "es" | "en" }
 * → { url } — la página de pago de Stripe.
 *
 * Diseño deliberadamente mínimo para el 1-sept: sin carrito (una guía por
 * compra), precios inline desde lib/checkout.ts (nada que sincronizar en el
 * dashboard), y el fulfillment lo confirma el webhook, nunca la URL de éxito
 * (cualquiera puede visitar /gracias; solo Stripe firma un pago real).
 *
 * Env necesarias (Vercel, production):
 *   STRIPE_SECRET_KEY      sk_live_… (o sk_test_… para probar)
 *   NEXT_PUBLIC_CHECKOUT   "1" para enseñar los botones de compra
 */
export async function POST(request: Request) {
  // Se valida la petición ANTES de mirar la configuración. Así una compra mal
  // formada —o sin la renuncia al desistimiento— se rechaza igual esté Stripe
  // configurado o no, y la regla legal se puede probar sin claves de por medio.
  let body: { sku?: string; locale?: string; renuncia?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const producto = CATALOGO[body.sku as Sku];
  if (!producto) {
    return NextResponse.json({ ok: false, error: "unknown_sku" }, { status: 400 });
  }
  const locale = body.locale === "en" ? "en" : "es";

  // La renuncia al desistimiento se comprueba AQUÍ, no solo en la interfaz.
  // Una casilla del navegador se salta con una petición a mano; si la venta de
  // contenido digital dependiera solo de ella, la renuncia no valdría nada.
  if (necesitaRenuncia(producto) && body.renuncia !== true) {
    return NextResponse.json({ ok: false, error: "falta_renuncia" }, { status: 400 });
  }
  const aceptadaEn = new Date().toISOString();

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    // Config incompleta: mejor un error claro que un 500 críptico.
    return NextResponse.json({ ok: false, error: "checkout_not_configured" }, { status: 503 });
  }

  const stripe = new Stripe(key);
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: producto.precio,
            product_data: {
              name: producto.nombre[locale],
              description: producto.descripcion[locale],
            },
          },
        },
      ],
      // El papel necesita dirección; la digital, solo el email.
      ...(producto.envio
        ? { shipping_address_collection: { allowed_countries: ["ES", "PT", "FR", "IT", "DE", "NL", "BE", "GB", "IE", "AT"] } }
        : {}),
      // La renuncia viaja con el pago, con su texto y su fecha: si mañana
      // alguien reclama los 14 días, la prueba de que la aceptó —y cuándo—
      // está en el propio cobro, no en un log nuestro que se puede perder.
      metadata: necesitaRenuncia(producto)
        ? {
            sku: producto.sku,
            desistimiento_renunciado: "si",
            renuncia_aceptada_en: aceptadaEn,
            renuncia_texto: RENUNCIA[locale].slice(0, 480),
          }
        : { sku: producto.sku },
      success_url: `${site.url}${locale === "en" ? "/en" : ""}/gracias?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site.url}${locale === "en" ? "/en" : ""}/#guias`,
    });
    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    console.error("[checkout]", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: "stripe_error" }, { status: 502 });
  }
}
