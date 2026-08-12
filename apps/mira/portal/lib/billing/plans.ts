// El catálogo comercial: qué se vende, a cuánto y qué incluye.
//
// ⚠️ OJO CON EL NOMBRE `plan`. En este producto conviven DOS taxonomías y NO
// son la misma:
//
//   · `auth.users.user_metadata.plan` → lib/plans.ts (UserPlan). Gobierna qué
//     DEPARTAMENTOS ve una persona. Valores: starter/growth/scale/admin/...
//   · `clients.plan` → este fichero (BillingPlanId). Gobierna qué PAGA una
//     marca y cuánta gente y cuántas marcas caben. Valores: starter,
//     starter_multi, brand, growth, brand_house.
//
// Comparten la palabra "growth" y significan cosas distintas. La primera es
// permisos heredados; la segunda es la factura. No mezclarlas.
//
// Las cifras salen del modelo del 12-ago-2026 y están duplicadas —a
// propósito— en la landing (apps/mira-landing/lib/content/home.ts). Si cambia
// un precio hay que tocar los dos sitios: la landing es lo que el cliente lee
// antes de pagar y esto es lo que se le cobra. Que no cuadren es un problema
// legal, no estético.

export type BillingPlanId = 'starter' | 'starter_multi' | 'brand' | 'growth' | 'brand_house'

export interface BillingPlan {
  id: BillingPlanId
  /** Como se llama en la landing y en la factura. */
  name: string
  /** Paquete comercial: el autoservicio se compra con tarjeta, el asistido se habla. */
  package: 'starter' | 'enterprise'
  /** Cuota mensual sin IVA, en euros. */
  monthlyEur: number
  monthlyUsd: number
  /** Cuota de alta. 0 = autoservicio gratis. */
  setupEur: number
  /** Personas con acceso incluidas. */
  seats: number
  /** Marcas que caben bajo esta suscripción. */
  brands: number
  /** Imágenes al mes incluidas (el único contador visible junto a licitaciones). */
  images: number
  /** true = se puede contratar solo, con tarjeta y sin hablar con nadie. */
  selfServe: boolean
  blurb: string
}

export const BILLING_PLANS: Record<BillingPlanId, BillingPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    package: 'starter',
    monthlyEur: 99,
    monthlyUsd: 108,
    setupEur: 0,
    seats: 2,
    brands: 1,
    images: 30,
    selfServe: true,
    blurb: 'Marca personal, emprendedores y startups',
  },
  starter_multi: {
    id: 'starter_multi',
    name: 'Starter Multi',
    package: 'starter',
    monthlyEur: 179,
    monthlyUsd: 195,
    setupEur: 0,
    seats: 3,
    brands: 3,
    images: 60,
    selfServe: true,
    blurb: 'Varios proyectos a la vez',
  },
  brand: {
    id: 'brand',
    name: 'Marca',
    package: 'enterprise',
    monthlyEur: 690,
    monthlyUsd: 752,
    setupEur: 1200,
    seats: 4,
    brands: 1,
    images: 150,
    selfServe: false,
    blurb: 'Pymes con una marca y un equipo',
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    package: 'enterprise',
    monthlyEur: 1290,
    monthlyUsd: 1406,
    setupEur: 1200,
    seats: 8,
    brands: 1,
    images: 350,
    selfServe: false,
    blurb: 'Publicas a diario y produces de verdad',
  },
  brand_house: {
    id: 'brand_house',
    name: 'Casa de Marcas',
    package: 'enterprise',
    monthlyEur: 2490,
    monthlyUsd: 2714,
    setupEur: 1200,
    seats: 14,
    brands: 3,
    images: 750,
    selfServe: false,
    blurb: 'Grupos con varias marcas',
  },
}

/** Complementos que se suman a cualquier plan. Precio mensual salvo los de pago único. */
export const BILLING_ADDONS = {
  seat: { name: 'Persona adicional', eur: 75, recurring: true },
  tenders: { name: 'Licitaciones', eur: 190, recurring: true },
  extra_brand: { name: 'Marca adicional', eur: 490, recurring: true },
  image_pack: { name: '100 imágenes más', eur: 79, recurring: false },
  diagnosis: { name: 'Diagnóstico de Marca', eur: 490, recurring: false },
} as const

/** Planes desconocidos caen a Starter: nunca damos más de lo pagado por un valor raro en BD. */
export function billingPlan(id: unknown): BillingPlan {
  return typeof id === 'string' && id in BILLING_PLANS
    ? BILLING_PLANS[id as BillingPlanId]
    : BILLING_PLANS.starter
}

/** Los que se pueden comprar con tarjeta sin hablar con nadie. */
export const SELF_SERVE_PLANS = Object.values(BILLING_PLANS).filter((p) => p.selfServe)
