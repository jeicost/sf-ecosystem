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
    const { data, error } = await db
      .from('brand_profiles')
      .select('name, mission, tone_of_voice, values, description, brand_data')
      .eq('client_id', auth.clientId)
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json(null)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in client-portal brand:', error)
    return NextResponse.json(null, { status: 200 })
  }
}
