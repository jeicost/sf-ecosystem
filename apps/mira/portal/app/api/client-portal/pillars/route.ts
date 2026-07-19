import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-admin'
import { resolveRequestClient } from '@/lib/resolve-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    }

    const auth = await resolveRequestClient(clientId)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const db = createServiceClient()

    // Canonical source: content_pillars table (one row per pillar)
    const { data, error } = await db
      .from('content_pillars')
      .select('id, pillar_name, description, themes')
      .eq('client_id', auth.clientId)

    if (error || !data?.length) {
      return NextResponse.json([])
    }

    const pillars = data.map((p) => ({
      id: p.id,
      name: p.pillar_name,
      description: p.description,
      themes: p.themes,
    }))

    return NextResponse.json(pillars)
  } catch (error) {
    console.error('Error in client-portal pillars:', error)
    return NextResponse.json([], { status: 200 })
  }
}
