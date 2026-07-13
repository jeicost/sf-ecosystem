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
      .from('brand_profiles')
      .select('*')
      .eq('id', clientId)
      .single()

    if (error || !data) {
      return NextResponse.json(null)
    }

    return NextResponse.json({
      id: data.id,
      brand_name: data.brand_name,
      mission: data.mission,
      tone_of_voice: data.tone_of_voice,
      created_at: data.created_at,
      updated_at: data.updated_at,
    })
  } catch (error) {
    console.error('Error in client-portal brand:', error)
    return NextResponse.json(null, { status: 200 })
  }
}
