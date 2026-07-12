import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireAuthGate } from '@/lib/auth-gate'

const TABLES = [
  'clients',
  'brand_profiles', 
  'content_pillars',
  'brain_resources',
  'brain_learnings',
  'brain_sources',
]

export async function POST() {
  try {
    await requireAuthGate()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({ error: 'No service key' }, { status: 500 })
  }

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    serviceKey
  )

  const results: Record<string, any> = {}

  for (const table of TABLES) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1)

      results[table] = {
        accessible: !error,
        error: error?.message
      }
    } catch (e: any) {
      results[table] = { accessible: false, error: e.message }
    }
  }

  return NextResponse.json({
    results,
    note: 'Tables with errors likely have RLS blocking authenticated reads'
  })
}
