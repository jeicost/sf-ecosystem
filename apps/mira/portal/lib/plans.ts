export type UserPlan = 'super_admin' | 'admin' | 'scale' | 'growth' | 'starter'

export const PLAN_SECTIONS: Record<UserPlan, string[]> = {
  super_admin: ['marketing', 'comercial', 'estrategia', 'innovacion', 'admin', 'finanzas'],
  admin:   ['marketing', 'comercial', 'estrategia', 'innovacion', 'admin', 'finanzas'],
  scale:   ['marketing', 'comercial', 'estrategia', 'innovacion', 'admin', 'finanzas'],
  growth:  ['marketing', 'comercial', 'estrategia'],
  starter: ['marketing'],
}

export function canAccessSection(plan: UserPlan, slug: string): boolean {
  return PLAN_SECTIONS[plan]?.includes(slug) ?? false
}
