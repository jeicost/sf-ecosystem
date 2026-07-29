export type UserPlan = 'super_admin' | 'admin' | 'scale' | 'growth' | 'starter' | 'consulta'

// ─── Hardcoded section access mapping (used as fallback + during client-side checks)
// ─── This mapping is replicated in Supabase's section_access_rules table (Fase 2)
// ─── Queried version can replace this in Fase 4 when caching/cache-invalidation is added
// 'operations' (Admin/Support dept) is included in every tier, same as
// 'marketing' — it's baseline support/process tooling, not a premium upsell
// (matches how it's presented everywhere else in the app: same footing as
// the other 4 departments, not gated behind a plan badge).
export const PLAN_SECTIONS: Record<UserPlan, string[]> = {
  super_admin: ['marketing', 'comercial', 'strategy', 'operations', 'finanzas'],
  admin:   ['marketing', 'comercial', 'strategy', 'finanzas', 'operations'],
  scale:   ['marketing', 'comercial', 'strategy', 'finanzas', 'operations'],
  growth:  ['marketing', 'comercial', 'strategy', 'operations'],
  starter: ['marketing', 'operations'],
  // 'consulta' (P5): cliente sin toolkit — solo consulta/responde cuestionarios
  // y accede al hub de soporte. No es un plan de upsell (ver CLIENT_PLAN_ORDER).
  consulta: ['operations'],
}

export function canAccessSection(plan: UserPlan, slug: string): boolean {
  return PLAN_SECTIONS[plan]?.includes(slug) ?? false
}

// ─── Feature entitlements por plan (P5) ───────────────────────────────────
// PLAN_SECTIONS gatea SOLO departamentos; esto gatea features transversales
// (enlaces globales + guards server-side en las rutas de generación).
export interface PlanFeatures {
  toolkitGenerate: boolean
  questionnaires: boolean
}

export const PLAN_FEATURES: Record<UserPlan, PlanFeatures> = {
  super_admin: { toolkitGenerate: true, questionnaires: true },
  admin:       { toolkitGenerate: true, questionnaires: true },
  scale:       { toolkitGenerate: true, questionnaires: true },
  growth:      { toolkitGenerate: true, questionnaires: true },
  starter:     { toolkitGenerate: true, questionnaires: true },
  consulta:    { toolkitGenerate: false, questionnaires: true },
}

/** Acepta el plan crudo de user_metadata (unknown); planes desconocidos caen a 'starter' (mismo fallback que proxy.ts). */
export function canUseFeature(plan: unknown, feature: keyof PlanFeatures): boolean {
  const key: UserPlan =
    typeof plan === 'string' && plan in PLAN_FEATURES ? (plan as UserPlan) : 'starter'
  return PLAN_FEATURES[key][feature]
}

// Cheapest real client plan (excludes admin/super_admin) that includes a given
// section — used to tell a blocked user which plan they'd need to upgrade to.
// 'consulta' queda fuera a propósito: no es un destino de upgrade.
const CLIENT_PLAN_ORDER: UserPlan[] = ['starter', 'growth', 'scale']

export function minPlanForSection(slug: string): UserPlan | null {
  for (const plan of CLIENT_PLAN_ORDER) {
    if (PLAN_SECTIONS[plan].includes(slug)) return plan
  }
  return null
}
