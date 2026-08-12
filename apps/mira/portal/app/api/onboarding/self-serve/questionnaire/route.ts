import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'
import { fetchBrandBrain } from '@/lib/brand-brain'
import { computeBrainGaps } from '@/lib/brain-gaps'
import { generateGapQuestionnaire, GapQuestionnaireError } from '@/lib/questionnaires-gaps'
import {
  answerValueToText,
  fetchAnswers,
  fetchQuestions,
  isMissingTableError,
  QUESTIONNAIRES_UNAVAILABLE,
  type QuestionnaireRow,
} from '@/lib/questionnaires'

// Opus tarda: mismo maxDuration que el generador de la agencia.
export const maxDuration = 300

// El último tramo del alta autoservicio: el cuestionario de huecos.
//
// El motor entero ya existía (lib/questionnaires-gaps.ts, el runner con
// autosave, el ingest con los executors compartidos) y nunca se había usado —
// client_questionnaires tenía 0 filas en producción. Lo único que le faltaba
// era una puerta por la que pudiera entrar el cliente: POST /generate exige
// isAgencyPlan y además crea el cuestionario en 'draft', un estado que el
// propio cliente no puede ni leer (questionnaires/[id] devuelve 403 en draft).
//
// Aquí el cuestionario nace en 'sent' y con source 'onboarding', que es la
// marca por la que el ingest deja que lo aplique su dueño sin la agencia.
//
// Sin gate de agencia a propósito: resolveRequestClient ya exige un grant en
// mira_project_access sobre el cliente pedido — la comprobación correcta para
// una ruta que el DUEÑO de la marca usa sobre su propia marca.

/**
 * Estados en los que el cuestionario de alta todavía tiene trabajo pendiente.
 *
 * 'completed' cuenta como pendiente: significa que se respondió pero la ingesta
 * al Cerebro no llegó a aplicarse. Generar otro encima dejaría esas respuestas
 * huérfanas para siempre; lo que hay que hacer es devolver ese mismo y dejar
 * que el runner ofrezca reintentar la ingesta.
 */
const PENDING_STATUSES = ['sent', 'in_progress', 'completed'] as const

interface QuestionnaireSummary {
  id: string
  title: string
  status: string
  /** Preguntas con alguna respuesta escrita, sobre el total. Progreso honesto. */
  answered: number
  total: number
}

async function summarize(row: QuestionnaireRow): Promise<QuestionnaireSummary> {
  const questions = await fetchQuestions(row.id)
  const answers = await fetchAnswers(questions.map((q) => q.id))
  const answeredIds = new Set(
    answers.filter((a) => answerValueToText(a.value).length > 0).map((a) => a.question_id)
  )
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    answered: questions.filter((q) => answeredIds.has(q.id)).length,
    total: questions.length,
  }
}

/**
 * El cuestionario de alta vivo de este cliente, si lo hay.
 *
 * Se busca el más reciente con source 'onboarding' en cualquier estado: uno
 * abierto es el que hay que retomar; uno ya ingerido es la señal de que esa
 * ronda se cerró y una nueva puede empezar. Resiliente a la 0054 sin aplicar.
 */
async function findOnboardingQuestionnaire(clientId: string): Promise<{
  row: QuestionnaireRow | null
  unavailable: boolean
}> {
  const { data, error } = await adminClient()
    .from('client_questionnaires')
    .select('*')
    .eq('client_id', clientId)
    .eq('source', 'onboarding')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    if (isMissingTableError(error)) return { row: null, unavailable: true }
    throw new Error(error.message)
  }
  return { row: (data?.[0] as QuestionnaireRow | undefined) ?? null, unavailable: false }
}

// GET /api/onboarding/self-serve/questionnaire?clientId=
// Qué queda por preguntar y si hay un cuestionario a medias que retomar.
export async function GET(req: NextRequest) {
  try {
    const access = await resolveRequestClient(new URL(req.url).searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const brain = await fetchBrandBrain(access.clientId)
    const gaps = computeBrainGaps(brain)

    const { row, unavailable } = await findOnboardingQuestionnaire(access.clientId)
    if (unavailable) {
      return NextResponse.json({ gaps, questionnaire: null, unavailable: QUESTIONNAIRES_UNAVAILABLE })
    }

    return NextResponse.json({
      gaps,
      questionnaire: row ? await summarize(row) : null,
    })
  } catch (error) {
    console.error('onboarding/self-serve/questionnaire GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not check what is still missing' },
      { status: 500 }
    )
  }
}

// POST /api/onboarding/self-serve/questionnaire — {clientId?}
// Genera el cuestionario que cubre los huecos que quedan, o devuelve el que ya
// estaba a medias.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    const access = await resolveRequestClient(typeof body.clientId === 'string' ? body.clientId : null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const clientId = access.clientId

    // Retomar antes que generar: dos llamadas a Opus por el mismo hueco cuestan
    // dinero, y —peor— dos cuestionarios abiertos con la misma pregunta de
    // pilares acabarían creando pilares duplicados al ingerirse los dos (el
    // deep-merge de brand es idempotente, los pilares NO).
    const { row: existing, unavailable } = await findOnboardingQuestionnaire(clientId)
    if (unavailable) {
      return NextResponse.json({ error: QUESTIONNAIRES_UNAVAILABLE }, { status: 503 })
    }
    if (existing && (PENDING_STATUSES as readonly string[]).includes(existing.status)) {
      return NextResponse.json({ questionnaire: await summarize(existing), resumed: true })
    }

    const brain = await fetchBrandBrain(clientId)
    const gaps = computeBrainGaps(brain)
    if (gaps.length === 0) {
      // Nada que preguntar. Se dice, en vez de gastar un Opus en fabricar
      // preguntas sobre campos que ya están puestos.
      return NextResponse.json({ questionnaire: null, gaps, complete: true })
    }

    const result = await generateGapQuestionnaire({
      clientId,
      createdBy: access.userId,
      // 'sent' y no 'draft': en autoservicio no hay agencia que lo revise y lo
      // envíe, y en 'draft' el propio dueño recibiría un 403 al abrirlo.
      status: 'sent',
      source: 'onboarding',
      audience: 'client',
    })

    return NextResponse.json({
      questionnaire: await summarize(result.questionnaire),
      gaps,
      generated: true,
    })
  } catch (error) {
    if (error instanceof GapQuestionnaireError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('onboarding/self-serve/questionnaire POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not build your questionnaire' },
      { status: 500 }
    )
  }
}
