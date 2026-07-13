import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    }

    const db = createServiceClient()

    const { data, error } = await db
      .from('mira_clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (error || !data) {
      return NextResponse.json(null)
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      email: data.email,
      plan: data.tier || 'standard',
      created_at: data.created_at,
      logo_url: data.logo_url,
    })
  } catch (error) {
    console.error('Error in client-portal info:', error)
    return NextResponse.json(null, { status: 200 })
  }
}
