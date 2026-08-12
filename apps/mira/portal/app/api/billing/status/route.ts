import { NextRequest, NextResponse } from 'next/server'
import { resolveRequestClient } from '@/lib/resolve-client'
import { adminClient } from '@/lib/supabase'
import { getSeatUsage } from '@/lib/seats'
import { billingPlan, BILLING_ADDONS } from '@/lib/billing/plans'
import { getStripe, stripeEnabled, priceIdFor, appUrl } from '@/lib/billing/stripe'

// GET /api/billing/status — qué plan tiene esta marca, qué paga y qué le queda.
export async function GET(req: NextRequest) {
  try {
    const access = await resolveRequestClient(req.nextUrl.searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const db = adminClient()
    const { data: client } = await db
      .from('clients')
      .select('id, name, plan, max_seats, subscription_status, trial_ends_at, stripe_customer_id, stripe_subscription_id, onboarding_mode')
      .eq('id', access.clientId)
      .maybeSingle()
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const plan = billingPlan(client.plan)
    const seats = await getSeatUsage(client.id)

    // CUENTA GESTIONADA: alta asistida y sin suscripción de Stripe. Son las 11
    // marcas que existen desde antes de que hubiera cobro en el producto, con
    // condiciones acordadas fuera de la plataforma.
    //
    // Su `clients.plan` es 'starter' por el DEFAULT de la migración 0069, no
    // porque nadie decidiera que pagan 99 €. Enseñarles esa cifra en su propia
    // página de facturación sería contarles una tarifa que no es la suya —y
    // que, según el caso, se queda muy corta. Mientras no se fije el tier real
    // de cada una, la página dice lo que sí es cierto: que su plan lo lleva
    // Startup Factory. En cuanto se ponga el tier de verdad, esto deja de
    // aplicar solo.
    const managedAccount = client.onboarding_mode === 'assisted' && !client.stripe_subscription_id

    const trialDaysLeft = client.trial_ends_at
      ? Math.max(0, Math.ceil((new Date(client.trial_ends_at).getTime() - Date.now()) / 86_400_000))
      : null

    return NextResponse.json({
      clientId: client.id,
      clientName: client.name,
      plan: {
        ...plan,
        // El límite real es el de la BD, no el del catálogo: un cliente puede
        // tener asientos comprados de más y enseñarle el número del folleto
        // sería mentirle sobre su propia cuenta.
        seats: client.max_seats ?? plan.seats,
      },
      managedAccount,
      subscriptionStatus: client.subscription_status,
      trialEndsAt: client.trial_ends_at,
      trialDaysLeft,
      onboardingMode: client.onboarding_mode,
      seatsUsed: seats?.used ?? null,
      seatsMax: seats?.max ?? null,
      addons: BILLING_ADDONS,
      payments: {
        enabled: stripeEnabled(),
        payableNow: stripeEnabled() && Boolean(priceIdFor(plan.id)),
        hasSubscription: Boolean(client.stripe_subscription_id),
      },
    })
  } catch (error) {
    console.error('billing/status error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not read your billing' },
      { status: 500 }
    )
  }
}

// POST /api/billing/status — abre el portal de facturación de Stripe.
//
// Es donde el cliente cambia la tarjeta, descarga facturas y se da de baja
// solo. Construir eso a mano son semanas; Stripe lo da hecho y además es lo
// que exige la normativa de suscripciones (poder cancelar sin escribir a nadie).
export async function POST(req: NextRequest) {
  try {
    if (!stripeEnabled()) {
      return NextResponse.json({ error: 'Billing portal is not available yet.' }, { status: 503 })
    }
    const body = await req.json().catch(() => ({}))
    const access = await resolveRequestClient(typeof body.clientId === 'string' ? body.clientId : null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const db = adminClient()
    const { data: client } = await db
      .from('clients')
      .select('stripe_customer_id')
      .eq('id', access.clientId)
      .maybeSingle()

    if (!client?.stripe_customer_id) {
      return NextResponse.json({ error: 'There is nothing to manage yet — no subscription on this brand.' }, { status: 400 })
    }

    const session = await getStripe()!.billingPortal.sessions.create({
      customer: client.stripe_customer_id,
      return_url: `${appUrl()}/billing`,
    })
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('billing/portal error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not open the billing portal' },
      { status: 500 }
    )
  }
}
