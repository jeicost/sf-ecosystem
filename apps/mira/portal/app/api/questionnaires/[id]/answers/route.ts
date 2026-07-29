import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser } from '@/lib/resolve-client'
import {
  fetchQuestions,
  getQuestionnaireForUser,
  isMissingTableError,
  QUESTIONNAIRES_UNAVAILABLE,
} from '@/lib/questionnaires'

// POST /api/questionnaires/[id]/answers — autosave del runner:
// { answers: [{question_id, value, status?}] }
// Upsert por question_id (UNIQUE en 0054). Marca el cuestionario in_progress
// si estaba en sent (primera respuesta = el cliente ha empezado).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const rawAnswers: unknown[] = Array.isArray(body?.answers) ? body.answers : []
    if (rawAnswers.length === 0) {
      return NextResponse.json({ error: 'answers vacío' }, { status: 400 })
    }

    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await getQuestionnaireForUser(id, user)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    const questionnaire = result.questionnaire

    if (!['sent', 'in_progress'].includes(questionnaire.status)) {
      return NextResponse.json(
        { error: `El cuestionario no admite respuestas en estado "${questionnaire.status}"` },
        { status: 409 }
      )
    }

    // Solo se aceptan respuestas a preguntas de ESTE cuestionario
    const questions = await fetchQuestions(id)
    const validIds = new Set(questions.map((q) => q.id))

    const now = new Date().toISOString()
    const rows = rawAnswers
      .filter((a): a is Record<string, unknown> => !!a && typeof a === 'object')
      .filter((a) => typeof a.question_id === 'string' && validIds.has(a.question_id as string))
      .filter((a) => a.value !== undefined)
      .map((a) => ({
        question_id: a.question_id as string,
        client_id: questionnaire.client_id,
        // jsonb NOT NULL: null SQL violaría el constraint — se guarda '' en su lugar
        value: (a.value === null ? '' : a.value) as unknown,
        status: a.status === 'final' ? 'final' : 'draft',
        answered_by: user.id,
        updated_at: now,
      }))

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Ninguna respuesta válida para este cuestionario' },
        { status: 400 }
      )
    }

    const admin = adminClient()
    const { error } = await admin
      .from('questionnaire_answers')
      .upsert(rows, { onConflict: 'question_id' })

    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json({ error: QUESTIONNAIRES_UNAVAILABLE }, { status: 503 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let status = questionnaire.status
    if (status === 'sent') {
      const { error: statusError } = await admin
        .from('client_questionnaires')
        .update({ status: 'in_progress' })
        .eq('id', id)
        .eq('status', 'sent') // guard: no pisar un estado que cambió en paralelo
      if (!statusError) status = 'in_progress'
    }

    return NextResponse.json({ saved: rows.length, status })
  } catch (error) {
    console.error('questionnaires/[id]/answers error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error guardando respuestas' },
      { status: 500 }
    )
  }
}
