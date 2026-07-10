import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { clientId, action, data } = await req.json()

    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    }

    // Get the current user to verify they own this client
    const client = createClient()
    const { data: { user } } = await client.auth.getUser()

    if (!user?.user_metadata?.client_id || user.user_metadata.client_id !== clientId) {
      if (user?.user_metadata?.plan !== 'admin' && user?.user_metadata?.plan !== 'super_admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    // Get brand profile
    const db = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    const { data: profile } = await db
      .from('brand_profiles')
      .select('*')
      .eq('client_id', clientId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const { data: pillars } = await db
      .from('content_pillars')
      .select('*')
      .eq('client_id', clientId)

    const { data: references } = await db
      .from('brand_references')
      .select('*')
      .eq('client_id', clientId)

    // Generate memory markdown
    const timestamp = new Date().toISOString().split('T')[0]
    const memory = {
      client_name: profile.name || 'Unknown',
      client_id: clientId,
      updated_at: timestamp,
      identity: {
        name: profile.name,
        mission: profile.mission,
        tone_of_voice: profile.tone_of_voice,
        values: profile.values,
        description: profile.description
      },
      pillars: pillars?.map((p: any) => ({
        name: p.pillar_name,
        description: p.description
      })) || [],
      references_count: references?.length || 0,
      total_references: references?.map((r: any) => ({
        title: r.title,
        url: r.url,
        pillar: r.pillar,
        why_worked: r.why_worked
      })) || []
    }

    // Return memory object (could be saved to file system or sent to AI)
    return NextResponse.json({
      status: 'saved',
      memory,
      message: `Brand Brain memory for ${profile.name} recorded`
    })
  } catch (error: any) {
    console.error('Memory save error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
