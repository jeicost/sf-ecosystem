export type UserPlan = 'super_admin' | 'admin' | 'scale' | 'growth' | 'starter'

// ─── Hardcoded section access mapping (used as fallback + during client-side checks)
// ─── This mapping is replicated in Supabase's section_access_rules table (Fase 2)
// ─── Queried version can replace this in Fase 4 when caching/cache-invalidation is added
export const PLAN_SECTIONS: Record<UserPlan, string[]> = {
  super_admin: ['marketing', 'comercial', 'strategy', 'operations', 'finanzas'],
  admin:   ['marketing', 'comercial', 'strategy', 'finanzas'],
  scale:   ['marketing', 'comercial', 'strategy', 'finanzas'],
  growth:  ['marketing', 'comercial', 'strategy'],
  starter: ['marketing'],
}

export function canAccessSection(plan: UserPlan, slug: string): boolean {
  return PLAN_SECTIONS[plan]?.includes(slug) ?? false
}
