export type UserPlan = 'super_admin' | 'admin' | 'scale' | 'growth' | 'starter'

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
}

export function canAccessSection(plan: UserPlan, slug: string): boolean {
  return PLAN_SECTIONS[plan]?.includes(slug) ?? false
}

// Cheapest real client plan (excludes admin/super_admin) that includes a given
// section — used to tell a blocked user which plan they'd need to upgrade to.
const CLIENT_PLAN_ORDER: UserPlan[] = ['starter', 'growth', 'scale']

export function minPlanForSection(slug: string): UserPlan | null {
  for (const plan of CLIENT_PLAN_ORDER) {
    if (PLAN_SECTIONS[plan].includes(slug)) return plan
  }
  return null
}
