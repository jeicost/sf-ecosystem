import { createServerComponentClient } from '@sf/supabase'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'

// Resolve which client the user may act on. super_admin can target any client
// (the active workspace); regular users only clients they have a grant for.
async function resolveClientId(
  admin: ReturnType<typeof adminClient>,
  user: { id: string; user_metadata?: Record<string, unknown> },
  requestedClientId: string | null
): Promise<string | null> {
  const isSuperAdmin = user.user_metadata?.plan === 'super_admin'

  if (requestedClientId) {
    if (isSuperAdmin) return requestedClientId
    const { data: grant } = await admin
      .from('mira_project_access')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('project_id', requestedClientId)
      .limit(1)
    if (grant?.length) return requestedClientId
  }

  const { data: accessData } = await admin
    .from('mira_project_access')
    .select('project_id')
    .eq('user_id', user.id)
    .limit(1)
  if (accessData?.length) return accessData[0].project_id

  if (isSuperAdmin && typeof user.user_metadata?.client_id === 'string') {
    return user.user_metadata.client_id
  }
  return null
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        getAll: () => cookieStore.getAll(),
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = adminClient()
    const clientId = await resolveClientId(
      admin,
      user,
      new URL(req.url).searchParams.get('clientId')
    )
    if (!clientId) {
      return NextResponse.json({ error: 'No client access' }, { status: 403 })
    }

    const [{ data: profileData, error: profileError }, { data: pillarsData, error: pillarsError }] = await Promise.all([
      admin
        .from('brand_profiles')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle(),
      admin
        .from('content_pillars')
        .select('*')
        .eq('client_id', clientId),
    ])

    if (profileError) {
      return NextResponse.json({ data: null, message: 'No brand profile yet' }, { status: 200 })
    }

    return NextResponse.json({ data: profileData, pillars: pillarsData || [] }, { status: 200 })
  } catch (error) {
    console.error('Brand brain GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, brand_data, name, mission, tone_of_voice, values, description, pillars } = body

    const cookieStore = await cookies()
    const supabase = createServerComponentClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        getAll: () => cookieStore.getAll(),
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = adminClient()
    const clientId = await resolveClientId(
      admin,
      user,
      typeof body.client_id === 'string' ? body.client_id : null
    )
    if (!clientId) {
      return NextResponse.json({ error: 'No client access' }, { status: 403 })
    }

    // If no ID, create new profile
    if (!id) {
      const { data: newProfile, error: insertError } = await admin
        .from('brand_profiles')
        .insert({
          client_id: clientId,
          name: name || '',
          mission: mission || '',
          tone_of_voice: tone_of_voice || {},
          values: values || [],
          description: description || '',
          brand_data: brand_data || {},
        })
        .select()
        .single()

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      return NextResponse.json({ data: newProfile }, { status: 201 })
    }

    // Update existing profile
    const { data: updatedProfile, error: updateError } = await admin
      .from('brand_profiles')
      .update({
        name: name || undefined,
        mission: mission || undefined,
        tone_of_voice: tone_of_voice || undefined,
        values: values || undefined,
        description: description || undefined,
        brand_data: brand_data || undefined,
      })
      .eq('id', id)
      .eq('client_id', clientId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // If pillars are provided, upsert them to the content_pillars table
    if (pillars && Array.isArray(pillars)) {
      const pillarsWithClientId = pillars.map(p => ({
        ...p,
        client_id: clientId,
      }))

      const { error: pillarsError } = await admin
        .from('content_pillars')
        .upsert(pillarsWithClientId, { onConflict: 'client_id,pillar_name' })

      if (pillarsError) {
        console.error('Error upserting pillars:', pillarsError)
      }
    }

    return NextResponse.json({ data: updatedProfile }, { status: 200 })
  } catch (error) {
    console.error('Brand brain PUT error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
