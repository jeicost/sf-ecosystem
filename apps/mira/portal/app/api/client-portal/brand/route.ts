import { NextRequest, NextResponse } from 'next/server'
import { requireClientAccess } from '@/lib/require-client-access'
import { adminClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // SECURITY FIX: Authenticate user and validate client access
    // Never trust clientId from request params
    const { user, clientId } = await requireClientAccess()

    const db = adminClient()

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
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden: No client access' }, { status: 403 })
    }
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error in client-portal brand:', error)
    return NextResponse.json(null, { status: 200 })
  }
}
