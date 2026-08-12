import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, resolveRequestClient } from '@/lib/resolve-client'
import {
  isAgencyPlan,
  isMissingTableError,
  normalizeKind,
  normalizeNarrative,
  normalizeOptions,
  QUESTIONNAIRES_UNAVAILABLE,
  type QuestionnaireRow,
} from '@/lib/questionnaires'
import { describeQuestionnaireTargets } from '@/lib/brain-gaps'

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
    // Se traen los maps_to de las preguntas (no solo el count): con ellos la
    // lista puede decir QUÉ parte del Cerebro rellena cada cuestionario, que es
    // lo único que lo distingue de una lista de títulos sueltos.
    let query = admin
      .from('client_questionnaires')
      .select('*, questionnaire_questions(maps_to)')
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
      const questions = (row.questionnaire_questions ?? []) as Array<{ maps_to: string | null }>
      const { questionnaire_questions: _qq, ...rest } = row
      return {
        ...rest,
        question_count: questions.length,
        // Etiquetas legibles de las zonas del Cerebro que toca al ingestarse.
        brain_targets: describeQuestionnaireTargets(questions.map((q) => q?.maps_to)),
        // Preguntas puramente informativas (sin maps_to): no escriben nada.
        informational_count: questions.filter((q) => !q?.maps_to).length,
      }
    })

    return NextResponse.json({ questionnaires })
  } catch (error) {
    console.error('questionnaires GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load questionnaires' },
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
        { error: 'Only the agency can create questionnaires' },
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
        { error: 'The request body is missing title or questions' },
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
        return NextResponse.json({ error: 'That project does not belong to this client' }, { status: 403 })
      }
      projectId = project.id
    }

    // 'narrative' (migración 0061) es opcional y puede que la columna aún no
    // exista en producción — solo se incluye en el insert cuando hay contenido
    // real, para que crear un cuestionario normal (sin narrativa) siga
    // funcionando aunque 0061 no se haya aplicado todavía.
    const narrative = normalizeNarrative(body.narrative)

    const { data: created, error: insertError } = await admin
      .from('client_questionnaires')
      .insert({
        client_id: access.clientId,
        project_id: projectId,
        title,
        intro: typeof body.intro === 'string' && body.intro.trim() ? body.intro.trim() : null,
        ...(narrative ? { narrative } : {}),
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
      if (narrative && insertError?.message?.includes('narrative')) {
        return NextResponse.json(
          { error: 'Migration 0061 (narrative column) has not been applied yet — required to create reports with narrative sections.' },
          { status: 503 }
        )
      }
      return NextResponse.json(
        { error: insertError?.message || 'The questionnaire could not be created' },
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
        options: normalizeOptions(q.options),
        required: q.required === true,
        maps_to: typeof q.maps_to === 'string' && q.maps_to.trim() ? q.maps_to.trim() : null,
      }))

    if (rows.length === 0) {
      await admin.from('client_questionnaires').delete().eq('id', questionnaire.id)
      return NextResponse.json({ error: 'No valid question found in questions' }, { status: 400 })
    }

    // select/multi_select sin >= 2 opciones (o con labels duplicados) dejan al
    // cliente sin ninguna tarjeta que pulsar, o dos indistinguibles — el
    // builder ya valida esto, pero cualquier llamada directa a la API debe
    // rechazarse igual, no solo confiar en el cliente.
    for (const row of rows) {
      if (row.kind !== 'select' && row.kind !== 'multi_select') continue
      const labels = (row.options ?? []).map((o) => (typeof o === 'string' ? o : o.label))
      const unique = new Set(labels)
      if (labels.length < 2 || unique.size !== labels.length) {
        await admin.from('client_questionnaires').delete().eq('id', questionnaire.id)
        return NextResponse.json(
          { error: `The question "${row.prompt}" needs at least 2 options, each with text and no duplicates.` },
          { status: 400 }
        )
      }
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
      { error: error instanceof Error ? error.message : 'Failed to create the questionnaire' },
      { status: 500 }
    )
  }
}
