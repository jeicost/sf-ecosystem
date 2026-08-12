import { NextRequest, NextResponse } from 'next/server'
import { resolveRequestClient } from '@/lib/resolve-client'
import { adminClient } from '@/lib/supabase'
import { billingPlan, BILLING_PLANS, type BillingPlanId } from '@/lib/billing/plans'
import { getStripe, priceIdFor, appUrl, stripeEnabled } from '@/lib/billing/stripe'

// POST /api/billing/checkout — {plan} → una URL de pago de Stripe.
//
// El cliente en prueba llega aquí desde /billing. Se le crea (o reutiliza) su
// cliente de Stripe, se le abre una sesión de Checkout y Stripe se encarga del
// resto. Quien confirma el cobro NO es esta ruta: es el webhook. Aquí solo se
// abre la puerta; fiarse de la vuelta del navegador para dar acceso es el
// error clásico (basta con teclear la URL de éxito a mano).

export async function POST(req: NextRequest) {
  try {
    if (!stripeEnabled()) {
      return NextResponse.json(
        { error: 'Card payments are not switched on yet. Write to us and we will set it up manually.' },
        { status: 503 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const access = await resolveRequestClient(typeof body.clientId === 'string' ? body.clientId : null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const planId = (typeof body.plan === 'string' ? body.plan : 'starter') as BillingPlanId
    const plan = billingPlan(planId)
    if (!plan.selfServe) {
      return NextResponse.json(
        { error: `${plan.name} includes onboarding done by us — let's talk instead.` },
        { status: 400 }
      )
    }

    const price = priceIdFor(plan.id)
    if (!price) {
      return NextResponse.json({ error: `${plan.name} is not available for card payment yet.` }, { status: 503 })
    }

    const stripe = getStripe()!
    const db = adminClient()

    const { data: client } = await db
      .from('clients')
      .select('id, name, owner_email, stripe_customer_id')
      .eq('id', access.clientId)
      .maybeSingle()
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    // El cliente de Stripe se reutiliza siempre que exista: crear uno nuevo en
    // cada pago parte el historial de facturas en dos y deja al cliente sin
    // poder ver lo que ya pagó desde el portal de facturación.
    let customerId = client.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: client.owner_email ?? undefined,
        name: client.name,
        metadata: { mira_client_id: client.id },
      })
      customerId = customer.id
      await db.from('clients').update({ stripe_customer_id: customerId }).eq('id', client.id)
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      // El id de la marca viaja en los metadatos de la SUSCRIPCIÓN, no solo de
      // la sesión: los eventos posteriores (renovación, impago, baja) traen la
      // suscripción y no la sesión, y sin esto el webhook no sabría a quién
      // aplicarlos.
      subscription_data: { metadata: { mira_client_id: client.id, mira_plan: plan.id } },
      metadata: { mira_client_id: client.id, mira_plan: plan.id },
      success_url: `${appUrl()}/billing?paid=1`,
      cancel_url: `${appUrl()}/billing?canceled=1`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      // Sin esto no hay NIF en la factura, y una empresa española que no puede
      // deducirse el gasto no renueva.
      tax_id_collection: { enabled: true },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('billing/checkout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not start the payment' },
      { status: 500 }
    )
  }
}

// GET /api/billing/checkout — qué planes se pueden pagar hoy con tarjeta.
export async function GET() {
  const plans = Object.values(BILLING_PLANS)
    .filter((p) => p.selfServe)
    .map((p) => ({ ...p, payable: Boolean(priceIdFor(p.id)) }))
  return NextResponse.json({ enabled: stripeEnabled(), plans })
}
