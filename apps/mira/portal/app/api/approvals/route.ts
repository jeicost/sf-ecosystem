import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'

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
      .select('id, client_id, action_type, output_data')
      .eq('id', action_id)
      .single()

    if (fetchError || !action) {
      return NextResponse.json({ error: 'Action result not found' }, { status: 404 })
    }
    if (!(await userCanAccessClient(user, action.client_id))) {
      return NextResponse.json({ error: 'No access to this action' }, { status: 403 })
    }

    const out = (action.output_data ?? {}) as Record<string, any>
    // Best-effort copy extraction across the real quick-action output shapes
    // (social_post: copy/hashtags/platform; newsletter: subject+sections; text: plain).
    const copy: string =
      typeof out.copy === 'string' ? out.copy
      : typeof out.content === 'string' ? out.content
      : typeof out.subject === 'string'
        ? [out.subject, ...(Array.isArray(out.sections) ? out.sections.map((s: any) => [s?.title, s?.content].filter(Boolean).join('\n')) : [])].join('\n\n')
      : typeof out === 'string' ? out
      : JSON.stringify(out)

    const hashtags: string[] | null = Array.isArray(out.hashtags) ? out.hashtags : null
    const platform: string = typeof out.platform === 'string' && out.platform ? out.platform : 'Content'

    const { data: queueItem, error: insertError } = await admin
      .from('approval_queue')
      .insert({
        client_id: action.client_id,
        platform,
        tipo: 'content',
        copy,
        caption: copy.slice(0, 300),
        hashtags,
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
