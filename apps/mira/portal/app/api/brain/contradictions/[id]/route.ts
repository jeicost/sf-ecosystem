import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { applyBrainChange } from '@/lib/brain-tools'

// Resolver una contradicción del Brand Brain con un clic.
//
//   keep_current → status='resolved', no se toca el brand_data (el valor que
//                  ya estaba gana). Cierra el aviso sin cambiar nada.
//   adopt_new    → aplica el valor propuesto al brand_data en la ruta exacta
//                  de field_path (p.ej. 'identity.mission') reutilizando
//                  applyBrainChange, que ya hace el deep-merge y registra
//                  procedencia, y marca status='resolved'.
//   dismiss      → status='dismissed'. No es un conflicto real (falso
//                  positivo del sintetizador); no vuelve a contarse.
//
// Antes de esto no existía NINGUNA forma de cerrar una contradicción: se
// creaban, se contaban en el índice y en el lint semanal, y ahí se quedaban
// para siempre.

type Action = 'keep_current' | 'adopt_new' | 'dismiss'
const ACTIONS: Action[] = ['keep_current', 'adopt_new', 'dismiss']

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const action = body.action as Action
    const note = typeof body.note === 'string' ? body.note.slice(0, 500) : null

    if (!ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `action must be one of: ${ACTIONS.join(', ')}` },
        { status: 400 }
      )
    }

    const admin = adminClient()
    const { data: row, error } = await admin
      .from('brain_contradictions')
      .select('id, client_id, project_id, field_path, existing_value_excerpt, proposed_value_excerpt, status')
      .eq('id', id)
      .maybeSingle()

    if (error || !row) {
      return NextResponse.json({ error: 'Contradiction not found' }, { status: 404 })
    }
    if (!(await userCanAccessClient(user, row.client_id))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }
    if (row.status !== 'open') {
      return NextResponse.json(
        { error: `This contradiction is already ${row.status}` },
        { status: 409 }
      )
    }

    // Resolver una contradicción cambia la fuente de verdad de la marca:
    // misma regla que las propuestas (app/api/brain/proposals/[id]), la
    // agencia decide.
    const plan = (user.user_metadata?.plan as string) ?? 'starter'
    const isAgency = plan === 'super_admin' || plan === 'admin'
    if (!isAgency) {
      return NextResponse.json(
        { error: 'Contradictions are resolved by the agency.' },
        { status: 403 }
      )
    }

    if (action === 'adopt_new') {
      const proposed = row.proposed_value_excerpt?.trim()
      if (!proposed) {
        return NextResponse.json(
          { error: 'This contradiction has no proposed value to adopt — resolve it by hand in the editor.' },
          { status: 400 }
        )
      }
      try {
        await applyBrainChange(
          row.client_id,
          { target: 'brand_profile', op: 'merge', payload: { brand_data: nest(row.field_path, proposed) } },
          row.project_id,
          { sourceType: 'manual', sourceRef: `contradiction:${row.id}` }
        )
      } catch (applyError) {
        return NextResponse.json(
          { error: applyError instanceof Error ? applyError.message : 'Could not apply the proposed value' },
          { status: 500 }
        )
      }
    }

    const { error: updateError } = await admin
      .from('brain_contradictions')
      .update({
        status: action === 'dismiss' ? 'dismissed' : 'resolved',
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        resolution_note: note ?? defaultNote(action),
      })
      .eq('id', row.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      status: action === 'dismiss' ? 'dismissed' : 'resolved',
      applied: action === 'adopt_new',
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}

/**
 * 'identity.mission' + 'texto' → { identity: { mission: 'texto' } }, para que
 * el deep-merge de applyBrainChange escriba en la ruta exacta sin pisar sus
 * hermanas. Un field_path plano ('mission') produce { mission: 'texto' }.
 */
function nest(fieldPath: string, value: string): Record<string, unknown> {
  const parts = fieldPath.split('.').filter(Boolean)
  if (parts.length === 0) return {}
  return parts.reduceRight<Record<string, unknown> | string>((acc, key) => ({ [key]: acc }), value) as Record<string, unknown>
}

function defaultNote(action: Action): string {
  if (action === 'keep_current') return 'Kept the existing Brand Brain value.'
  if (action === 'adopt_new') return 'Adopted the value proposed by the source document.'
  return 'Dismissed — not a real conflict.'
}
