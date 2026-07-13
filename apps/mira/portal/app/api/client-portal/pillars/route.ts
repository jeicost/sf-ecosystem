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
      .select('content_pillars')
      .eq('id', clientId)
      .single()

    if (error || !data?.content_pillars) {
      return NextResponse.json([])
    }

    // Convert array of pillar strings to objects with name
    const pillars = (data.content_pillars || []).map((name: string) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
    }))

    return NextResponse.json(pillars)
  } catch (error) {
    console.error('Error in client-portal pillars:', error)
    return NextResponse.json([], { status: 200 })
  }
}
