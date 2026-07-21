import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// The old handler deleted a legacy 'sf-cms-session' cookie that no longer
// exists — the real Supabase session (sb-* cookies) stayed alive (SEC-09).
// signOut() through the SSR client invalidates the session server-side and
// clears the auth cookies via the client's cookie adapter.
export async function GET() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
