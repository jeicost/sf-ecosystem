'use client'

export type { UserPlan } from './plans'
export { PLAN_SECTIONS, canAccessSection } from './plans'
import type { UserPlan } from './plans'

export interface MiraUser {
  id: string
  name: string
  email: string
  role: 'owner' | 'member' | 'client'
  plan: UserPlan
  avatar: string
}

// localStorage cache for client-side display — NOT the security gate (middleware handles that)
export function getUser(): MiraUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('mira_user')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function setUser(user: MiraUser) {
  localStorage.setItem('mira_user', JSON.stringify(user))
}

export function clearUser() {
  localStorage.removeItem('mira_user')
}
