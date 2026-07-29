import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser } from '@/lib/resolve-client'
import { executeOnboardingTool } from '@/lib/onboarding/tools'
import {
  answerValueToText,
  fetchAnswers,
  fetchQuestions,
  getQuestionnaireForUser,
  isAgencyPlan,
  type QuestionRow,
} from '@/lib/questionnaires'

// Columnas reales de brand_profiles que save_brand_profile_fields acepta a nivel raíz.
const TOP_LEVEL_COLUMNS = new Set(['name', 'mission', 'description', 'proposition', 'values', 'tone_of_voice'])

// Claves de brand_data cuyo shape esperado es un array — una respuesta string
// se envuelve para no romper a los consumidores (formatBrandBrainForPrompt
// hace .map sobre audiences; banned_phrases se filtra como string[]).
const ARRAY_LEAF_KEYS = new Set(['audiences', 'banned_phrases', 'purchase_channels'])

/** Divide un texto en items (líneas / viñetas / '·' / ';'); si no hay lista clara, devuelve [text]. */
function splitList(text: string): string[] {
  const items = text
    .split(/\n|·|;|(?:^|\s)[-•]\s+/g)
    .map((s) => s.trim().replace(/^\d+[.)]\s*/, ''))
    .filter(Boolean)
  return items.length > 1 ? items : [text]
}

/** Escribe value en obj siguiendo el path (creando objetos intermedios). */
function setPath(obj: Record<string, any>, segments: string[], value: unknown): void {
  let cursor = obj
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i]
    if (typeof cursor[seg] !== 'object' || cursor[seg] === null || Array.isArray(cursor[seg])) {
      cursor[seg] = {}
    }
    cursor = cursor[seg]
  }
  cursor[segments[segments.length - 1]] = value
}

interface AnsweredQuestion {
  question: QuestionRow
  value: unknown
  text: string
}

// POST /api/questionnaires/[id]/ingest — SOLO agencia. Lee las respuestas
// finales, las agrupa por maps_to y las aplica REUTILIZANDO los executors del
// onboarding (lib/onboarding/tools.ts): save_brand_profile_fields hace el
// deep-merge de brand_data; save_content_pillar y save_project_memory escriben
// igual que en el alta. Ingesta SIEMPRE manual (botón de la agencia), nunca
// automática al completar. Idempotente: si ya está ingested devuelve {already}.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAgencyPlan(user.user_metadata?.plan)) {
      return NextResponse.json(
        { error: 'Solo la agencia puede ingestar cuestionarios al brain' },
        { status: 403 }
      )
    }

    const result = await getQuestionnaireForUser(id, user)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    const questionnaire = result.questionnaire

    if (questionnaire.status === 'ingested') {
      return NextResponse.json({ already: true, questionnaire })
    }
    if (questionnaire.status !== 'completed') {
      return NextResponse.json(
        { error: 'Solo se pueden ingestar cuestionarios completados' },
        { status: 409 }
      )
    }

    const questions = await fetchQuestions(id)
    const answers = await fetchAnswers(questions.map((q) => q.id))
    const answerByQuestion = new Map(answers.map((a) => [a.question_id, a]))

    const answered: AnsweredQuestion[] = questions
      .map((question) => {
        const answer = answerByQuestion.get(question.id)
        const value = answer?.value
        const text = answerValueToText(value)
        return { question, value, text }
      })
      .filter((a) => a.text.length > 0)

    // ── Agrupar por maps_to ──
    const columns: Record<string, unknown> = {}
    const brandDataPatch: Record<string, any> = {}
    let brandFieldCount = 0
    const pillarQuestions: AnsweredQuestion[] = []
    const memoryQuestions: AnsweredQuestion[] = []

    for (const item of answered) {
      const mapsTo = item.question.maps_to?.trim()
      if (!mapsTo) continue

      if (mapsTo === 'project_memory') {
        memoryQuestions.push(item)
      } else if (mapsTo === 'content_pillar') {
        pillarQuestions.push(item)
      } else if (mapsTo.startsWith('brand_profile.')) {
        const ruta = mapsTo.slice('brand_profile.'.length)
        let segments = ruta.split('.').filter(Boolean)
        if (segments.length === 0) continue

        if (segments.length === 1 && TOP_LEVEL_COLUMNS.has(segments[0])) {
          // Columna real de brand_profiles. 'values' es text[] — se trocea.
          columns[segments[0]] =
            segments[0] === 'values'
              ? Array.isArray(item.value)
                ? item.value.map((v) => String(v)).filter(Boolean)
                : splitList(item.text)
              : item.text
          brandFieldCount++
          continue
        }

        // Path dentro del jsonb brand_data (con o sin prefijo 'brand_data.')
        if (segments[0] === 'brand_data') segments = segments.slice(1)
        if (segments.length === 0) continue
        const leaf = segments[segments.length - 1]
        const value = ARRAY_LEAF_KEYS.has(leaf)
          ? Array.isArray(item.value)
            ? item.value
            : splitList(item.text)
          : Array.isArray(item.value)
            ? item.value
            : item.text
        setPath(brandDataPatch, segments, value)
        brandFieldCount++
      }
      // maps_to desconocido → la respuesta queda solo en el cuestionario
    }

    const applied = { brand_fields: 0, pillars: 0, memory_entries: 0 }
    const chips: string[] = []
    const errors: string[] = []

    // 1) Brand Brain — un único save_brand_profile_fields con el deep-merge del executor
    if (brandFieldCount > 0) {
      try {
        const input: Record<string, any> = { ...columns }
        if (Object.keys(brandDataPatch).length > 0) input.brand_data = brandDataPatch
        const res = await executeOnboardingTool('save_brand_profile_fields', input, questionnaire.client_id)
        applied.brand_fields = brandFieldCount
        chips.push(res.chip)
      } catch (e) {
        errors.push(`Brand Brain: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    // 2) Pilares de contenido — un pilar por tema detectado en la respuesta
    for (const item of pillarQuestions) {
      const rawItems = Array.isArray(item.value)
        ? item.value.map((v) => String(v).trim()).filter(Boolean)
        : splitList(item.text)
      // Items cortos = lista de temas; un único bloque largo = un solo pilar
      const items =
        rawItems.length > 1 ? rawItems.filter((s) => s.length <= 120).slice(0, 6) : rawItems
      for (const pillar of items.length ? items : [item.text]) {
        try {
          const res = await executeOnboardingTool(
            'save_content_pillar',
            {
              pillar_name: pillar.slice(0, 120),
              description:
                pillar.length > 120 ? pillar : `Capturado del cuestionario "${questionnaire.title}"`,
            },
            questionnaire.client_id
          )
          applied.pillars++
          chips.push(res.chip)
        } catch (e) {
          errors.push(`Pilar "${pillar.slice(0, 40)}": ${e instanceof Error ? e.message : String(e)}`)
        }
      }
    }

    // 3) Memoria de proyecto — UNA entrada con el título del cuestionario
    if (memoryQuestions.length > 0) {
      const summary = memoryQuestions
        .map((m) => `• ${m.question.prompt}: ${m.text}`)
        .join('\n')
        .slice(0, 900)
      try {
        const res = await executeOnboardingTool(
          'save_project_memory',
          {
            title: `Cuestionario: ${questionnaire.title}`.slice(0, 200),
            category: 'insight',
            summary,
            full_content: {
              questionnaire_id: questionnaire.id,
              answers: memoryQuestions.map((m) => ({ prompt: m.question.prompt, value: m.value })),
            },
            tags: ['cuestionario', questionnaire.source],
          },
          questionnaire.client_id
        )
        applied.memory_entries = 1
        chips.push(res.chip)
      } catch (e) {
        errors.push(`Memoria: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    // Si algo falló, NO se marca ingested — la agencia puede reintentar (el
    // deep-merge de brand es re-aplicable; ojo: los pilares ya creados se
    // duplicarían, se avisa en el mensaje).
    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: `La ingesta falló parcialmente: ${errors.join(' · ')}. Revisa y reintenta (los pilares ya creados podrían duplicarse al reintentar).`,
          applied,
          chips,
        },
        { status: 500 }
      )
    }

    const admin = adminClient()
    const { data: updated, error: updateError } = await admin
      .from('client_questionnaires')
      .update({ status: 'ingested', ingested_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: `Respuestas aplicadas pero no se pudo marcar como ingested: ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      questionnaire: updated,
      applied,
      chips,
      answered_count: answered.length,
    })
  } catch (error) {
    console.error('questionnaires/[id]/ingest error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error ingestando el cuestionario' },
      { status: 500 }
    )
  }
}
