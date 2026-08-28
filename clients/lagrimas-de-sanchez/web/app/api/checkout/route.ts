import { NextResponse } from "next/server";
import Stripe from "stripe";
import { CATALOGO, PAISES_CON_ALCOHOL, PAISES_SIN_ALCOHOL, esSku } from "@/lib/catalogo";
import { tarifasPara } from "@/lib/envio";
import { site } from "@/lib/site";

/**
 * Crea una sesión de Stripe Checkout para un SKU del catálogo.
 *
 * POST { sku } → { url }
 *
 * Todo lo que importa se decide AQUÍ, no en el navegador: el importe, los
 * países a los que se puede enviar y el porte. El cliente solo manda un SKU.
 * Un precio que viajara desde el front sería un precio editable desde las
 * herramientas de desarrollo.
 *
 * Env (Vercel, production):
 *   STRIPE_SECRET_KEY      sk_live_… (o sk_test_… para probar)
 *   STRIPE_TAX             "1" para activar Stripe Tax — requiere tener el
 *                          impuesto configurado y la dirección de origen dada
 *                          de alta en el panel. Sin eso, Stripe rechaza la
 *                          sesión, por eso va detrás de una variable.
 *   NEXT_PUBLIC_SITE_URL   dominio canónico
 */

/**
 * Tope de SESIONES REVISADAS (no de coincidencias) al contar existencias.
 * Tiene que estar muy por encima del stock mayor: si el tope fuera menor,
 * el contador se quedaría corto y el producto no se agotaría nunca.
 */
const TOPE_REVISION = 2000;

/**
 * Cuenta cuántas unidades de un SKU se han pagado ya.
 *
 * La fuente de verdad es Stripe, no una base de datos nuestra: si el pago
 * existe, la unidad está vendida. Es una comprobación eventual —dos compras
 * simultáneas en el último par de unidades podrían colarse— y para un primer
 * lote de mil botellas eso es asumible. Si esto crece, el arreglo es una fila
 * con un contador y un incremento atómico en el webhook, no más listados.
 */
async function vendidas(stripe: Stripe, sku: string): Promise<number> {
  let n = 0;
  let revisadas = 0;
  // Solo sesiones completadas: las abandonadas no son ventas y no hay que
  // pagar el coste de recorrerlas.
  for await (const s of stripe.checkout.sessions.list({ limit: 100, status: "complete" })) {
    if (++revisadas > TOPE_REVISION) break;
    if (s.payment_status === "paid" && s.metadata?.sku === sku) n++;
  }
  return n;
}

export async function POST(request: Request) {
  let body: { sku?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "peticion_invalida" }, { status: 400 });
  }

  if (!esSku(body.sku)) {
    return NextResponse.json({ ok: false, error: "sku_desconocido" }, { status: 400 });
  }
  const producto = CATALOGO[body.sku];

  const clave = process.env.STRIPE_SECRET_KEY;
  if (!clave) {
    // Config incompleta: mejor un error claro que un 500 críptico.
    return NextResponse.json({ ok: false, error: "pago_no_configurado" }, { status: 503 });
  }

  const stripe = new Stripe(clave);

  try {
    if ((await vendidas(stripe, producto.sku)) >= producto.stock) {
      return NextResponse.json({ ok: false, error: "agotado" }, { status: 409 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "es",
      // Solo tarjeta (incluye Apple/Google Pay): los métodos asíncronos crean
      // sesiones "completed" sin pago confirmado y rompen el control de stock.
      payment_method_types: ["card"],
      // La sesión caduca en 30 min: acota la ventana en la que dos compradores
      // pueden tener la misma última unidad en el carrito.
      expires_at: Math.floor(Date.now() / 1000) + 1800,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: producto.precio,
            product_data: {
              name: producto.nombre,
              description: producto.descripcion,
              // Stripe Tax necesita saber que es un bien físico para aplicar
              // el tipo correcto en cada país de destino.
              ...(process.env.STRIPE_TAX === "1"
                ? { tax_code: "txcd_99999999" }
                : {}),
            },
          },
        },
      ],
      shipping_address_collection: {
        allowed_countries: [
          ...(producto.alcohol ? PAISES_CON_ALCOHOL : PAISES_SIN_ALCOHOL),
        ] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
      },
      shipping_options: tarifasPara(producto).map((t) => ({
        shipping_rate_data: {
          type: "fixed_amount" as const,
          display_name: t.nombre,
          fixed_amount: { amount: t.importe, currency: "eur" },
          delivery_estimate: {
            minimum: { unit: "business_day" as const, value: t.diasMin },
            maximum: { unit: "business_day" as const, value: t.diasMax },
          },
        },
      })),
      // El IVA por destino lo calcula Stripe. Va detrás de una variable porque
      // exige tener el impuesto activado en el panel: si no lo está, activarlo
      // aquí tumbaría todas las compras.
      ...(process.env.STRIPE_TAX === "1" ? { automatic_tax: { enabled: true } } : {}),
      metadata: {
        sku: producto.sku,
        alcohol: producto.alcohol ? "si" : "no",
      },
      success_url: `${site.url}/gracias?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site.url}/${producto.alcohol ? "vino" : "botella"}`,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    console.error("[checkout]", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: "error_stripe" }, { status: 502 });
  }
}
