import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser } from '@/lib/resolve-client'
import {
  fetchAnswers,
  fetchQuestions,
  getQuestionnaireForUser,
  isAgencyPlan,
  type QuestionnaireStatus,
} from '@/lib/questionnaires'

// Transiciones válidas vía PATCH. 'ingested' NUNCA se alcanza por aquí (solo la
// ruta /ingest, que además aplica las respuestas al brain).
const VALID_TRANSITIONS: Record<QuestionnaireStatus, QuestionnaireStatus[]> = {
  draft: ['sent'],
  sent: ['in_progress', 'completed'],
  in_progress: ['completed'],
  completed: [],
  ingested: [],
  archived: [],
}

// GET /api/questionnaires/[id] — cuestionario + preguntas + respuestas.
// Autorizado por userCanAccessClient sobre el client_id del cuestionario.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await getQuestionnaireForUser(id, user)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const agency = isAgencyPlan(user.user_metadata?.plan)
    // Los borradores son workspace de la agencia — el cliente aún no los ve.
    if (result.questionnaire.status === 'draft' && !agency) {
      return NextResponse.json(
        { error: 'Este cuestionario aún no está disponible' },
        { status: 403 }
      )
    }

    const questions = await fetchQuestions(id)
    const answers = await fetchAnswers(questions.map((q) => q.id))

    return NextResponse.json({
      questionnaire: result.questionnaire,
      questions,
      answers,
      is_agency: agency,
    })
  } catch (error) {
    console.error('questionnaires/[id] GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error cargando el cuestionario' },
      { status: 500 }
    )
  }
}

// PATCH /api/questionnaires/[id] — {status}: draft→sent (solo agencia),
// sent→in_progress→completed. 'completed' setea completed_at.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const nextStatus = body?.status as QuestionnaireStatus | undefined

    if (!nextStatus || !(nextStatus in VALID_TRANSITIONS)) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })
    }

    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await getQuestionnaireForUser(id, user)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    const current = result.questionnaire.status

    if (!VALID_TRANSITIONS[current]?.includes(nextStatus)) {
      return NextResponse.json(
        { error: `Transición no permitida: ${current} → ${nextStatus}` },
        { status: 409 }
      )
    }
    // Enviar al cliente es un acto de la agencia; responder/completar es del cliente.
    if (nextStatus === 'sent' && !isAgencyPlan(user.user_metadata?.plan)) {
      return NextResponse.json(
        { error: 'Solo la agencia puede enviar cuestionarios' },
        { status: 403 }
      )
    }

    const update: Record<string, unknown> = { status: nextStatus }
    if (nextStatus === 'completed') update.completed_at = new Date().toISOString()

    const admin = adminClient()
    const { data, error } = await admin
      .from('client_questionnaires')
      .update(update)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'No se pudo actualizar el estado' },
        { status: 500 }
      )
    }

    return NextResponse.json({ questionnaire: data })
  } catch (error) {
    console.error('questionnaires/[id] PATCH error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error actualizando el cuestionario' },
      { status: 500 }
    )
  }
}
