import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'
import { fetchOracleVariants } from '@/lib/oracle-data'

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId')
  const role = req.nextUrl.searchParams.get('role')
  const resolved = await resolveRequestClient(clientId)
  if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: resolved.status })
  if (!role) return NextResponse.json({ error: 'Missing role' }, { status: 400 })

  const result = await fetchOracleVariants(adminClient(), resolved.clientId, role)
  return NextResponse.json(result)
}
