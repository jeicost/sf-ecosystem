export function isSuperAdmin(userPlan: string | undefined): boolean {
  return userPlan === 'super_admin'
}
