import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, resolveRequestClient } from '@/lib/resolve-client'
import { fetchBrandBrain } from '@/lib/brand-brain'
import { BRAIN_TRACKED_FIELD_COUNT, computeBrainGaps, type BrainGap } from '@/lib/brain-gaps'
import { isAgencyPlan, isMissingTableError, type QuestionnaireStatus } from '@/lib/questionnaires'

// Estados en los que un cuestionario todavía puede rellenar huecos: sigue vivo
// (borrador por enviar, enviado, respondiéndose o completado sin ingestar).
// Los borradores son workspace de la agencia y el cliente NO los ve — mismo
// criterio que GET /api/questionnaires y /api/questionnaires/[id], que devuelve
// 403 a un cliente que abra un borrador.
const LIVE_STATUSES: QuestionnaireStatus[] = ['draft', 'sent', 'in_progress', 'completed']
const CLIENT_VISIBLE_STATUSES: QuestionnaireStatus[] = ['sent', 'in_progress', 'completed']

interface LiveQuestionnaire {
  id: string
  title: string
  status: QuestionnaireStatus
  created_at: string
}

/**
 * Cuestionarios vivos del cliente y qué huecos cubren sus preguntas. Resiliente
 * si la migración 0054 aún no está aplicada: devuelve vacío, nunca revienta la
 * página del Brand Brain.
 */
async function fetchLiveCoverage(
  clientId: string,
  gaps: BrainGap[],
  agency: boolean
): Promise<{ live: LiveQuestionnaire[]; coveredGapIds: string[] }> {
  try {
    const admin = adminClient()
    const { data, error } = await admin
      .from('client_questionnaires')
      .select('id, title, status, created_at, questionnaire_questions(maps_to)')
      .eq('client_id', clientId)
      .in('status', agency ? LIVE_STATUSES : CLIENT_VISIBLE_STATUSES)
      .order('created_at', { ascending: false })

    if (error || !data) {
      if (error && !isMissingTableError(error)) {
        console.error('brand-brain/gaps coverage error:', error.message)
      }
      return { live: [], coveredGapIds: [] }
    }

    const mapsToInFlight = new Set<string>()
    const live: LiveQuestionnaire[] = []
    for (const row of data as Array<Record<string, unknown>>) {
      live.push({
        id: String(row.id),
        title: String(row.title ?? ''),
        status: row.status as QuestionnaireStatus,
        created_at: String(row.created_at ?? ''),
      })
      const questions = (row.questionnaire_questions ?? []) as Array<{ maps_to: string | null }>
      for (const q of questions) {
        if (q?.maps_to) mapsToInFlight.add(q.maps_to.trim())
      }
    }

    const coveredGapIds = gaps.filter((g) => mapsToInFlight.has(g.mapsTo)).map((g) => g.id)
    return { live, coveredGapIds }
  } catch {
    return { live: [], coveredGapIds: [] }
  }
}

// GET /api/brand-brain/gaps?clientId= — qué le falta al Cerebro ahora mismo y
// si ya hay un cuestionario en marcha que lo cubre. Lo consume el panel de la
// página del Brand Brain; el cliente al que pertenece SIEMPRE lo decide
// resolveRequestClient, nunca el clientId del navegador.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const access = await resolveRequestClient(searchParams.get('clientId'))
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const user = await getSessionUser()
    const agency = isAgencyPlan(user?.user_metadata?.plan)

    const brain = await fetchBrandBrain(access.clientId)
    const gaps = computeBrainGaps(brain)
    const { live, coveredGapIds } = await fetchLiveCoverage(access.clientId, gaps, agency)

    return NextResponse.json({
      clientId: access.clientId,
      hasBrain: brain !== null,
      trackedFields: BRAIN_TRACKED_FIELD_COUNT,
      filled: BRAIN_TRACKED_FIELD_COUNT - gaps.length,
      gaps,
      coveredGapIds,
      openQuestions: brain?.openQuestions?.length ?? 0,
      // El más reciente que sigue vivo: es el que la UI ofrece continuar en
      // lugar de generar otro encima.
      pending: live[0] ?? null,
      liveCount: live.length,
    })
  } catch (error) {
    console.error('brand-brain/gaps GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to compute Brand Brain gaps' },
      { status: 500 }
    )
  }
}
