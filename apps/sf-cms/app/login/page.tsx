import { redirect } from 'next/navigation'

// Legacy single-password login (SEC-05). It POSTed to /api/auth/login,
// which never existed — a dead surface that only causes confusion.
// The real login is Supabase Auth at /admin/login.
export default function LegacyLoginRedirect() {
  redirect('/admin/login')
}
