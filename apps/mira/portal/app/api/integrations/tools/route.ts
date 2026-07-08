import { createServiceClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireClientAccess } from '@/lib/auth-server'

interface ConnectToolRequest {
  clientId: string
  toolId: string
  accountEmail?: string
  accountHandle?: string
  authToken?: string
  metadata?: Record<string, any>
}

interface DisconnectToolRequest {
  clientId: string
  toolId: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    }

    // Validate user has access to this client
    const authResult = await requireClientAccess(request, clientId)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const db = createServiceClient()

    // Get all tool connections for client
    const { data: connections, error: connectError } = await db
      .from('tool_connections')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'connected')

    if (connectError) throw connectError

    // Get user subscription plan from brand_profiles
    const { data: profile, error: profileError } = await db
      .from('brand_profiles')
      .select('user_id')
      .eq('id', clientId)
      .single()

    if (profileError) throw profileError

    // Get subscription from auth.users user_metadata
    const { data: authUser, error: authError } = await db
      .from('auth.users')
      .select('user_metadata')
      .eq('id', profile.user_id)
      .single()

    const userSubscriptionPlan = authUser?.user_metadata?.plan || 'free'

    return NextResponse.json({
      connectedTools: (connections || []).map((c) => c.tool_id),
      userSubscriptionPlan,
    })
  } catch (error) {
    console.error('Get tools error:', error)
    return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ConnectToolRequest
    const { clientId, toolId, accountEmail, accountHandle, authToken, metadata } = body

    if (!clientId || !toolId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate user has access to this client
    const authResult = await requireClientAccess(request, clientId)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const db = createServiceClient()

    // Check if tool already connected
    const { data: existing } = await db
      .from('tool_connections')
      .select('id')
      .eq('client_id', clientId)
      .eq('tool_id', toolId)
      .single()

    if (existing) {
      // Update existing connection
      const { error: updateError } = await db
        .from('tool_connections')
        .update({
          status: 'connected',
          account_email: accountEmail || null,
          account_handle: accountHandle || null,
          auth_token: authToken || null,
          metadata: metadata || {},
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('client_id', clientId)
        .eq('tool_id', toolId)

      if (updateError) throw updateError
    } else {
      // Create new connection
      const { error: insertError } = await db.from('tool_connections').insert({
        client_id: clientId,
        tool_id: toolId,
        status: 'connected',
        account_email: accountEmail || null,
        account_handle: accountHandle || null,
        auth_token: authToken || null,
        metadata: metadata || {},
        connected_at: new Date().toISOString(),
      })

      if (insertError) throw insertError
    }

    // Update tool setup progress
    const { data: allConnections } = await db
      .from('tool_connections')
      .select('tool_id')
      .eq('client_id', clientId)
      .eq('status', 'connected')

    const criticalTools = [
      'canva',
      'buffer',
      'linkedin-navigator',
      'salesforce',
    ]
    const connectedCritical = (allConnections || []).filter((c) =>
      criticalTools.includes(c.tool_id)
    ).length

    await db
      .from('tool_setup_progress')
      .upsert(
        {
          client_id: clientId,
          critical_tools_connected: connectedCritical,
          total_critical_tools: criticalTools.length,
          setup_percentage: Math.round((connectedCritical / criticalTools.length) * 100),
          last_checked: new Date().toISOString(),
        },
        { onConflict: 'client_id' }
      )

    return NextResponse.json({ success: true, toolId })
  } catch (error) {
    console.error('Connect tool error:', error)
    return NextResponse.json({ error: 'Failed to connect tool' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as DisconnectToolRequest
    const { clientId, toolId } = body

    if (!clientId || !toolId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate user has access to this client
    const authResult = await requireClientAccess(request, clientId)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const db = createServiceClient()

    const { error: deleteError } = await db
      .from('tool_connections')
      .delete()
      .eq('client_id', clientId)
      .eq('tool_id', toolId)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true, toolId })
  } catch (error) {
    console.error('Disconnect tool error:', error)
    return NextResponse.json({ error: 'Failed to disconnect tool' }, { status: 500 })
  }
}
