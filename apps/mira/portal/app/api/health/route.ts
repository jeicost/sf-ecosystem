import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-admin'

/**
 * Healthcheck — pings Supabase and reports env var presence. No auth (needs
 * to be reachable by external uptime monitors), read-only, no client data.
 */
export async function GET() {
  const checks: Record<string, boolean> = {
    anthropic_key: !!process.env.ANTHROPIC_API_KEY,
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  let dbOk = false
  try {
    const db = createServiceClient()
    const { error } = await db.from('clients').select('id', { count: 'exact', head: true }).limit(1)
    dbOk = !error
  } catch {
    dbOk = false
  }
  checks.database = dbOk

  const ok = Object.values(checks).every(Boolean)
  return NextResponse.json({ status: ok ? 'ok' : 'degraded', checks }, { status: ok ? 200 : 503 })
}
