import { createServiceClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { encryptSecret } from '@/lib/crypto'
import { resolveRequestClient, getSessionUser } from '@/lib/resolve-client'
import { platformIntegrations } from '@/lib/integrations/platform-status'

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
    const access = await resolveRequestClient(clientId)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const db = createServiceClient()

    // Get all tool connections for client
    const { data: connections, error: connectError } = await db
      .from('tool_connections')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'connected')

    if (connectError) throw connectError

    // Plan lives on the authenticated session user's metadata, not on brand_profiles
    // (brand_profiles has no user_id column — see docs/DEBT.md (bb)), same pattern
    // as resolve-client.ts/proxy.ts.
    const user = await getSessionUser()
    const userSubscriptionPlan = (user?.user_metadata?.plan as string | undefined) || 'free'

    // Las conexiones de PLATAFORMA (Claude, OpenAI, Apollo/Hunter vía el motor
    // comercial) no viven en tool_connections porque no son de nadie en
    // particular: las pone Startup Factory y valen para todos. Sin esto la
    // página enseñaba "desconectado" sobre cinco integraciones que llevan
    // meses funcionando.
    const platform = platformIntegrations()

    return NextResponse.json({
      connectedTools: (connections || []).map((c) => c.tool_id),
      platformTools: platform.filter((p) => p.connected).map((p) => p.toolId),
      platformNotes: Object.fromEntries(platform.map((p) => [p.toolId, p.note])),
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

    // F1 (auditoría 08-10): las BYO API keys se guardaban en claro. Se cifran
    // en reposo antes de tocar la BD — tanto el auth_token como cualquier
    // metadata.api_key/apiKey (las tres formas que lee getClientApiKey).
    const encAuthToken = authToken ? encryptSecret(authToken) : null
    const encMetadata: Record<string, any> = { ...(metadata || {}) }
    if (typeof encMetadata.api_key === 'string') encMetadata.api_key = encryptSecret(encMetadata.api_key)
    if (typeof encMetadata.apiKey === 'string') encMetadata.apiKey = encryptSecret(encMetadata.apiKey)

    if (!clientId || !toolId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate user has access to this client
    const access = await resolveRequestClient(clientId)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
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
          auth_token: encAuthToken,
          metadata: encMetadata,
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
        auth_token: encAuthToken,
        metadata: encMetadata,
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
    const access = await resolveRequestClient(clientId)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
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
