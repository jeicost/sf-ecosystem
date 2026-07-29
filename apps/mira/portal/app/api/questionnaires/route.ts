import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, resolveRequestClient } from '@/lib/resolve-client'
import {
  isAgencyPlan,
  isMissingTableError,
  normalizeKind,
  QUESTIONNAIRES_UNAVAILABLE,
  type QuestionnaireRow,
} from '@/lib/questionnaires'

// GET /api/questionnaires?clientId= — lista de cuestionarios del cliente.
// La agencia ve todos; el cliente no ve borradores (workspace de la agencia).
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const access = await resolveRequestClient(searchParams.get('clientId'))
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const user = await getSessionUser()
    const agency = isAgencyPlan(user?.user_metadata?.plan)

    const admin = adminClient()
    let query = admin
      .from('client_questionnaires')
      .select('*, questionnaire_questions(count)')
      .eq('client_id', access.clientId)
      .order('created_at', { ascending: false })
    if (!agency) {
      query = query.in('status', ['sent', 'in_progress', 'completed', 'ingested'])
    }

    const { data, error } = await query
    if (error) {
      if (isMissingTableError(error)) {
        // Resiliente pre-migración: lista vacía + aviso, nunca un 500.
        return NextResponse.json({ questionnaires: [], unavailable: QUESTIONNAIRES_UNAVAILABLE })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const questionnaires = (data ?? []).map((row: Record<string, unknown>) => {
      const counts = row.questionnaire_questions as Array<{ count: number }> | undefined
      const { questionnaire_questions: _qq, ...rest } = row
      return { ...rest, question_count: counts?.[0]?.count ?? 0 }
    })

    return NextResponse.json({ questionnaires })
  } catch (error) {
    console.error('questionnaires GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error cargando cuestionarios' },
      { status: 500 }
    )
  }
}

// POST /api/questionnaires — creación manual por la agencia:
// { clientId, title, intro?, projectId?, questions: [{section?, prompt, help?, kind?, options?, required?, maps_to?}] }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAgencyPlan(user.user_metadata?.plan)) {
      return NextResponse.json(
        { error: 'Solo la agencia puede crear cuestionarios' },
        { status: 403 }
      )
    }

    const access = await resolveRequestClient(body.clientId ?? null)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const rawQuestions: unknown[] = Array.isArray(body.questions) ? body.questions : []
    if (!title || rawQuestions.length === 0) {
      return NextResponse.json(
        { error: 'Faltan title o questions en el cuerpo de la petición' },
        { status: 400 }
      )
    }

    const admin = adminClient()

    // Proyecto opcional — debe pertenecer al cliente (mismo patrón que toolkit/generate)
    let projectId: string | null = null
    if (typeof body.projectId === 'string' && body.projectId) {
      const { data: project } = await admin
        .from('mira_projects')
        .select('id, client_id')
        .eq('id', body.projectId)
        .maybeSingle()
      if (!project || project.client_id !== access.clientId) {
        return NextResponse.json({ error: 'El proyecto no pertenece a este cliente' }, { status: 403 })
      }
      projectId = project.id
    }

    const { data: created, error: insertError } = await admin
      .from('client_questionnaires')
      .insert({
        client_id: access.clientId,
        project_id: projectId,
        title,
        intro: typeof body.intro === 'string' && body.intro.trim() ? body.intro.trim() : null,
        status: 'draft',
        source: 'manual',
        created_by: user.id,
      })
      .select('*')
      .single()

    if (insertError || !created) {
      if (isMissingTableError(insertError)) {
        return NextResponse.json({ error: QUESTIONNAIRES_UNAVAILABLE }, { status: 503 })
      }
      return NextResponse.json(
        { error: insertError?.message || 'No se pudo crear el cuestionario' },
        { status: 500 }
      )
    }

    const questionnaire = created as QuestionnaireRow
    const rows = rawQuestions
      .filter((q): q is Record<string, unknown> => !!q && typeof q === 'object')
      .filter((q) => typeof q.prompt === 'string' && (q.prompt as string).trim())
      .map((q, i) => ({
        questionnaire_id: questionnaire.id,
        position: i + 1,
        section: typeof q.section === 'string' && q.section.trim() ? q.section.trim() : null,
        prompt: (q.prompt as string).trim(),
        help: typeof q.help === 'string' && q.help.trim() ? q.help.trim() : null,
        kind: normalizeKind(q.kind),
        options: Array.isArray(q.options)
          ? (q.options as unknown[]).map((o) => String(o)).filter(Boolean)
          : null,
        required: q.required === true,
        maps_to: typeof q.maps_to === 'string' && q.maps_to.trim() ? q.maps_to.trim() : null,
      }))

    if (rows.length === 0) {
      await admin.from('client_questionnaires').delete().eq('id', questionnaire.id)
      return NextResponse.json({ error: 'Ninguna pregunta válida en questions' }, { status: 400 })
    }

    const { error: qError } = await admin.from('questionnaire_questions').insert(rows)
    if (qError) {
      await admin.from('client_questionnaires').delete().eq('id', questionnaire.id)
      return NextResponse.json({ error: qError.message }, { status: 500 })
    }

    return NextResponse.json({ questionnaire, question_count: rows.length })
  } catch (error) {
    console.error('questionnaires POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error creando el cuestionario' },
      { status: 500 }
    )
  }
}
