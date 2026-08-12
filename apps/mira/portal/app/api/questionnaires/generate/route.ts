import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, resolveRequestClient } from '@/lib/resolve-client'
import { generateGapQuestionnaire, GapQuestionnaireError } from '@/lib/questionnaires-gaps'
import { isAgencyPlan } from '@/lib/questionnaires'

// Generación con opus puede tardar — mismo patrón que las rutas de toolkit
export const maxDuration = 300

// El cálculo de huecos vive en lib/brain-gaps.ts: lo comparten este generador
// y la página del Brand Brain (que enseña cuántos huecos quedan y enlaza aquí).
// La redacción y el guardado viven en lib/questionnaires-gaps.ts, compartidos
// con el alta autoservicio (app/api/onboarding/self-serve/questionnaire), que
// pide exactamente el mismo cuestionario pero para el dueño de la marca.

// POST /api/questionnaires/generate — {clientId, projectId?, focus?}
// SOLO agencia (super_admin/admin). Opus redacta el cuestionario a partir de
// los huecos reales del brain + open_questions + la plantilla de intake como
// banco de preguntas. Se guarda como borrador (source 'brain_gaps') — la
// agencia lo revisa y lo envía; nunca llega solo al cliente.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAgencyPlan(user.user_metadata?.plan)) {
      return NextResponse.json(
        { error: 'Solo la agencia puede generar cuestionarios' },
        { status: 403 }
      )
    }

    const access = await resolveRequestClient(body.clientId ?? null)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }
    const clientId = access.clientId

    let projectId: string | null = null
    if (typeof body.projectId === 'string' && body.projectId) {
      const { data: project } = await adminClient()
        .from('mira_projects')
        .select('id, client_id')
        .eq('id', body.projectId)
        .maybeSingle()
      if (!project || project.client_id !== clientId) {
        return NextResponse.json({ error: 'El proyecto no pertenece a este cliente' }, { status: 403 })
      }
      projectId = project.id
    }

    const result = await generateGapQuestionnaire({
      clientId,
      createdBy: user.id,
      status: 'draft',
      source: 'brain_gaps',
      audience: 'agency',
      focus: typeof body.focus === 'string' ? body.focus : '',
      projectId,
    })

    return NextResponse.json({
      questionnaire: result.questionnaire,
      question_count: result.questionCount,
      gaps_detected: result.gapsDetected,
    })
  } catch (error) {
    if (error instanceof GapQuestionnaireError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('questionnaires/generate error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error generando el cuestionario' },
      { status: 500 }
    )
  }
}
