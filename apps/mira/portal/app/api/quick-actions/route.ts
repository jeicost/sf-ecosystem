import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, resolveRequestClient, userCanAccessClient } from '@/lib/resolve-client'
import { generateQuickAction, QuickActionError } from '@/lib/quick-actions/generate'

// Generación síncrona (Claude + imagen en la misma invocación): el default de
// 60s se quedaba corto con imágenes lentas y dejaba filas zombis en processing.
export const maxDuration = 300

// Fila processing más vieja que esto = la función murió sin marcar failed.
const REAPER_THRESHOLD_MS = 10 * 60 * 1000

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action_type, input_data, department, project_id } = body

    if (!action_type || !input_data || !department) {
      return NextResponse.json(
        { error: 'Missing action_type, input_data, or department' },
        { status: 400 }
      )
    }

    // Multi-empresa: clientId del body validado por grant; sin él, primer grant.
    // (Mismo patrón que project-memory — nunca el primer grant a ciegas.)
    const access = await resolveRequestClient(body.clientId ?? null)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const result = await generateQuickAction({
      clientId: access.clientId,
      userId: access.userId,
      department,
      actionType: action_type,
      inputData: input_data,
      projectId: project_id ?? null,
    })

    return NextResponse.json({
      success: true,
      action_id: result.actionId,
      output_data: result.outputData,
      processing_time_ms: result.processingTimeMs,
    })
  } catch (error) {
    console.error('Quick action endpoint error:', error)
    const status = error instanceof QuickActionError ? error.status : 500
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action_id = searchParams.get('action_id')

    if (!action_id) {
      return NextResponse.json({ error: 'Missing action_id' }, { status: 400 })
    }

    const admin = adminClient()
    const { data, error } = await admin
      .from('quick_actions_results')
      .select('*')
      .eq('id', action_id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Ownership: la fila pertenece a un cliente — validar el grant antes de devolverla
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    } else if (!(await userCanAccessClient(user, data.client_id))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }

    // Reaper: una fila processing con más de 10 min es una función muerta —
    // marcarla failed aquí evita que el cliente haga polling para siempre.
    if (
      data.status === 'processing' &&
      Date.now() - new Date(data.created_at).getTime() > REAPER_THRESHOLD_MS
    ) {
      let { data: reaped, error: reapError } = await admin
        .from('quick_actions_results')
        .update({ status: 'failed', error_message: 'Timed out — generation never completed' })
        .eq('id', action_id)
        .eq('status', 'processing')
        .select('*')
        .single()
      if (reapError?.message.includes('error_message')) {
        // Columna ausente hasta aplicar 0048 — al menos dejar la fila en failed
        ;({ data: reaped } = await admin
          .from('quick_actions_results')
          .update({ status: 'failed' })
          .eq('id', action_id)
          .eq('status', 'processing')
          .select('*')
          .single())
      }
      if (reaped) return NextResponse.json(reaped)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Quick action GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Query failed' },
      { status: 500 }
    )
  }
}

// PATCH: mark a result as liked/unliked. The column existed since the
// original schema but no route ever wrote to it — the heart button in
// QuickActionResult.tsx was purely local state until now.
export async function PATCH(req: NextRequest) {
  try {
    const { action_id, liked } = await req.json()
    if (!action_id || typeof liked !== 'boolean') {
      return NextResponse.json({ error: 'Missing action_id or liked' }, { status: 400 })
    }

    const admin = adminClient()
    const { data: existing, error: fetchError } = await admin
      .from('quick_actions_results')
      .select('client_id')
      .eq('id', action_id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!(await userCanAccessClient(user, existing.client_id))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }

    const { error: updateError } = await admin
      .from('quick_actions_results')
      .update({ liked_by_user: liked })
      .eq('id', action_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, action_id, liked })
  } catch (error) {
    console.error('Quick action PATCH error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Update failed' },
      { status: 500 }
    )
  }
}
