import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { adminClient } from '@/lib/supabase'
import { getStripe, mapSubscriptionStatus } from '@/lib/billing/stripe'
import { billingPlan, type BillingPlanId } from '@/lib/billing/plans'

// POST /api/billing/webhook — la única fuente de verdad sobre quién ha pagado.
//
// Es pública en proxy.ts porque Stripe no tiene sesión: la autenticación es la
// FIRMA del cuerpo con STRIPE_WEBHOOK_SECRET. Sin firma válida no se toca nada.
//
// Y se lee el cuerpo CRUDO con req.text(): verificar la firma sobre un JSON ya
// parseado y vuelto a serializar falla siempre, porque el reserializado no es
// byte a byte el que Stripe firmó.

export const dynamic = 'force-dynamic'

/** Aplica a la marca lo que dice una suscripción de Stripe. */
async function syncSubscription(sub: Stripe.Subscription) {
  const db = adminClient()
  const clientId = sub.metadata?.mira_client_id

  // Sin el id en los metadatos queda el cliente de Stripe como último recurso:
  // pasa con suscripciones creadas a mano desde el panel de Stripe.
  let target = clientId
  if (!target && typeof sub.customer === 'string') {
    const { data } = await db.from('clients').select('id').eq('stripe_customer_id', sub.customer).maybeSingle()
    target = data?.id
  }
  if (!target) {
    console.error('billing/webhook: subscription with no client to apply it to', sub.id)
    return
  }

  const planId = sub.metadata?.mira_plan as BillingPlanId | undefined
  const update: Record<string, unknown> = {
    stripe_subscription_id: sub.id,
    subscription_status: mapSubscriptionStatus(sub.status),
  }
  if (typeof sub.customer === 'string') update.stripe_customer_id = sub.customer

  // El plan y los asientos SOLO se mueven si Stripe dice qué plan es. Un
  // evento sin metadatos no debe degradar a nadie a Starter por defecto.
  if (planId) {
    const plan = billingPlan(planId)
    update.plan = plan.id
    update.max_seats = plan.seats
  }

  // La suscripción manda sobre la prueba: una vez pagando, trial_ends_at
  // dejaría un aviso de "te quedan 3 días" a alguien que ya es cliente.
  if (sub.status === 'active') update.trial_ends_at = null

  const { error } = await db.from('clients').update(update).eq('id', target)
  if (error) console.error('billing/webhook: could not update client', target, error.message)
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !secret) {
    // 503 y no 200: si Stripe recibe un OK creerá que se procesó y no
    // reintentará, y los cobros de ese rato se perderían en silencio.
    return NextResponse.json({ error: 'billing not configured' }, { status: 503 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    const raw = await req.text()
    event = stripe.webhooks.constructEvent(raw, signature, secret)
  } catch (err) {
    console.error('billing/webhook: bad signature:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.subscription && typeof session.subscription === 'string') {
          const sub = await stripe.subscriptions.retrieve(session.subscription)
          // La sesión sabe el plan; la suscripción recién creada puede no
          // tenerlo si se creó desde un enlace de pago. Se copia antes de
          // aplicar para que el sync no se quede sin plan.
          if (session.metadata?.mira_client_id && !sub.metadata?.mira_client_id) {
            sub.metadata = { ...sub.metadata, ...session.metadata }
          }
          await syncSubscription(sub)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscription(event.data.object)
        break

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        if (typeof invoice.customer === 'string') {
          const db = adminClient()
          await db
            .from('clients')
            .update({ subscription_status: 'past_due' })
            .eq('stripe_customer_id', invoice.customer)
        }
        break
      }
      default:
        // Los demás eventos se reconocen sin hacer nada: devolver error haría
        // que Stripe reintentara para siempre algo que no nos interesa.
        break
    }
  } catch (error) {
    console.error('billing/webhook: handler failed for', event.type, error)
    // 500 para que Stripe reintente: es un fallo nuestro, no del evento.
    return NextResponse.json({ error: 'handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
