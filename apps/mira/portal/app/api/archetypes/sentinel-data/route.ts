import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'
import { fetchSentinelData } from '@/lib/sentinel-data'

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId')
  const resolved = await resolveRequestClient(clientId)
  if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: resolved.status })

  const result = await fetchSentinelData(adminClient(), resolved.clientId)
  return NextResponse.json(result)
}
