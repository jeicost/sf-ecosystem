import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { buildCopyText } from '@/lib/quick-actions/copy-text'
import { getQuickAction } from '@/lib/quick-actions/registry'

// Sends a Marketing quick-action result into the approval pipeline — the same
// approval_queue that New Brief writes to and that /approvals reads. Before
// this, quick-action content lived only in quick_actions_results and never
// reached the review flow, so "crear post" (quick action) and "New Brief"
// produced content with silently different destinies.
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { action_id } = await request.json()
    if (!action_id) return NextResponse.json({ error: 'Missing action_id' }, { status: 400 })

    const admin = adminClient()
    const { data: action, error: fetchError } = await admin
      .from('quick_actions_results')
      .select('id, client_id, action_type, input_data, output_data')
      .eq('id', action_id)
      .single()

    if (fetchError || !action) {
      return NextResponse.json({ error: 'Action result not found' }, { status: 404 })
    }
    if (!(await userCanAccessClient(user, action.client_id))) {
      return NextResponse.json({ error: 'No access to this action' }, { status: 403 })
    }

    const out = (action.output_data ?? {}) as Record<string, any>
    // Copy legible para CUALQUIER tipo de output (antes solo social_post/
    // newsletter/text llegaban aquí; structured/image/video morían sin destino).
    const def = getQuickAction(action.action_type)
    const outputType =
      def?.resolveOutputType?.((action.input_data ?? {}) as Record<string, unknown>) ??
      def?.outputType ??
      'structured'
    const copy = buildCopyText(outputType, out) || JSON.stringify(out)

    const hashtags: string[] | null = Array.isArray(out.hashtags) ? out.hashtags : null
    const platform: string =
      typeof out.platform === 'string' && out.platform ? out.platform : outputType

    // Imagen generada → asset_url para que /approvals muestre la preview
    const assetUrl: string | null = typeof out.image_url === 'string' ? out.image_url : null

    const { data: queueItem, error: insertError } = await admin
      .from('approval_queue')
      .insert({
        client_id: action.client_id,
        platform,
        tipo: 'content',
        copy,
        caption: copy.slice(0, 300),
        hashtags,
        asset_url: assetUrl,
        status: 'pending_review',
        submitted_at: new Date().toISOString(),
        tone_warning: false,
      })
      .select('id')
      .single()

    if (insertError || !queueItem) {
      return NextResponse.json({ error: `Failed to queue for approval: ${insertError?.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, queueId: queueItem.id })
  } catch (error) {
    console.error('approvals POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send to approvals' },
      { status: 500 }
    )
  }
}
