import { requireSession } from '@/lib/auth/require-session'
import { resolveAccess } from '@/lib/auth/access'
import { AdminShell } from '@/components/admin/AdminShell'

export const metadata = {
  title: 'Admin — SF-CMS',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSession()
  const isGlobalAdmin = user ? (await resolveAccess(user)).isGlobalAdmin : false

  return <AdminShell isGlobalAdmin={isGlobalAdmin}>{children}</AdminShell>
}
