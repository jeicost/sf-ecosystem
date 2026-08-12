import Stripe from 'stripe'
import type { BillingPlanId } from './plans'

// El cobro, montado para poder existir ANTES de que existan las claves.
//
// Esto es deliberado y no es pereza: el día que se cree la cuenta de Stripe,
// encender el cobro tiene que ser pegar tres variables en Vercel, no un
// desarrollo. Hasta entonces todo el portal funciona igual, la página de
// facturación dice la verdad ("todavía no se puede pagar aquí") y ninguna
// ruta revienta por un `new Stripe(undefined)`.
//
// Regla: NADA en este fichero se ejecuta al importarlo. Si el cliente se
// creara arriba del módulo, el build de una página que lo importe sin claves
// fallaría, que es exactamente el fallo que no queremos heredar.

let cached: Stripe | null = null

/** ¿Hay claves? Si no, el resto del sistema degrada en vez de romper. */
export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

/** El cliente, o null si no está configurado. Nunca lanza. */
export function getStripe(): Stripe | null {
  if (!stripeEnabled()) return null
  if (!cached) cached = new Stripe(process.env.STRIPE_SECRET_KEY!)
  return cached
}

// Los IDs de precio viven en variables de entorno, no en el código: son
// distintos en prueba y en producción, y un `price_xxx` hardcodeado es la
// forma clásica de cobrar en el entorno equivocado.
const PRICE_ENV: Record<BillingPlanId, string> = {
  starter: 'STRIPE_PRICE_STARTER',
  starter_multi: 'STRIPE_PRICE_STARTER_MULTI',
  brand: 'STRIPE_PRICE_BRAND',
  growth: 'STRIPE_PRICE_GROWTH',
  brand_house: 'STRIPE_PRICE_BRAND_HOUSE',
}

/** El price id de un plan, o null si no está configurado ese plan todavía. */
export function priceIdFor(plan: BillingPlanId): string | null {
  return process.env[PRICE_ENV[plan]] || null
}

/** Qué planes se pueden cobrar HOY con la configuración que hay. */
export function billablePlans(): BillingPlanId[] {
  if (!stripeEnabled()) return []
  return (Object.keys(PRICE_ENV) as BillingPlanId[]).filter((p) => priceIdFor(p))
}

/** URL base para las vueltas de Stripe (éxito, cancelación, portal). */
export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://mira.startupsfactory.es'
}

/**
 * Traduce el estado de una suscripción de Stripe al de `clients`.
 *
 * `clients.subscription_status` tiene un CHECK con cinco valores (migración
 * 0069) y Stripe maneja ocho. Un estado no contemplado que llegue crudo a la
 * BD rompe el insert y deja el webhook fallando en silencio, así que aquí se
 * mapea explícitamente y lo desconocido cae a 'paused' — degradar, nunca
 * regalar acceso.
 */
export function mapSubscriptionStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'trialing':
      return 'trialing'
    case 'active':
      return 'active'
    case 'past_due':
    case 'unpaid':
      return 'past_due'
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled'
    default:
      return 'paused'
  }
}
