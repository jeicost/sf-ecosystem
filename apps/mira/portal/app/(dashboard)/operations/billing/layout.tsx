import React from 'react'
import { requireSuperAdminOrRedirect } from '@/lib/require-super-admin'

// Internal-agency page: super_admin only. Real clients are redirected to /home.
export default async function GuardedLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdminOrRedirect()
  return <>{children}</>
}
