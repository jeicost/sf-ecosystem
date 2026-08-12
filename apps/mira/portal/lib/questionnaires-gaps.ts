// Generador de cuestionarios de HUECOS, compartido por los dos caminos que lo usan.
//
// El ANÁLISIS de huecos vive en lib/brain-gaps.ts (lista canónica de campos +
// su maps_to). Lo que vive aquí es el paso siguiente: convertir esos huecos en
// un cuestionario redactado por Opus y persistido con sus preguntas.
//
// Estaba entero dentro de app/api/questionnaires/generate/route.ts, que está
// cerrado a la agencia (isAgencyPlan). El alta autoservicio necesita exactamente
// el mismo trabajo pero para un cliente que no tiene detrás a nadie de la
// agencia. Se extrae en vez de duplicarse: dos generadores que se
// desincronizaran acabarían preguntándole al cliente por campos que ya tiene,
// que es la forma más rápida de que abandone el alta.
//
// Lo único que cambia entre los dos caminos es el ENVOLTORIO —quién lo crea, en
// qué status nace y a quién se dirige el texto—, nunca el análisis.

import { adminClient } from '@/lib/supabase'
import { fetchBrandBrain, formatBrandBrainForPrompt } from '@/lib/brand-brain'
import { createMessageForClient } from '@/lib/anthropic-client'
import { extractJson, ExtractJsonError } from '@/lib/generation/extract-json'
import { formatIntakeTemplateForPrompt } from '@/lib/intake/intake-template'
import { computeBrainGaps, formatBrainGapsForPrompt } from '@/lib/brain-gaps'
import {
  isMissingTableError,
  normalizeKind,
  QUESTIONNAIRES_UNAVAILABLE,
  type QuestionnaireRow,
} from '@/lib/questionnaires'

/** Error que ya sabe con qué status HTTP debe responder la ruta que lo reciba. */
export class GapQuestionnaireError extends Error {
  status: number
  constructor(message: string, status = 500) {
    super(message)
    this.name = 'GapQuestionnaireError'
    this.status = status
  }
}

interface GeneratedQuestion {
  section?: unknown
  prompt?: unknown
  help?: unknown
  kind?: unknown
  options?: unknown
  required?: unknown
  maps_to?: unknown
}

export interface GenerateGapQuestionnaireOptions {
  clientId: string
  /** auth.users.id de quien lo dispara (la agencia o el propio dueño de la marca). */
  createdBy: string | null
  /**
   * 'draft' = workspace de la agencia: lo revisa y lo envía ella.
   * 'sent'  = respondible ya. El autoservicio nace en 'sent' porque no hay
   *           ninguna agencia detrás que vaya a pulsar "enviar" (y un 'draft'
   *           el cliente ni siquiera lo puede leer: questionnaires/[id] 403).
   */
  status: 'draft' | 'sent'
  source: 'brain_gaps' | 'onboarding'
  /**
   * 'agency' = lo encarga la agencia para un cliente suyo.
   * 'client' = lo responde el dueño de la marca, recién salido del alta guiada.
   */
  audience: 'agency' | 'client'
  focus?: string
  projectId?: string | null
}

export interface GenerateGapQuestionnaireResult {
  questionnaire: QuestionnaireRow
  questionCount: number
  gapsDetected: number
}

/**
 * Redacta y persiste un cuestionario a partir de los huecos reales del Cerebro.
 *
 * NO autoriza nada: quien llama ya ha resuelto el cliente con
 * resolveRequestClient y decidido si esa persona puede pedirlo.
 */
export async function generateGapQuestionnaire(
  opts: GenerateGapQuestionnaireOptions
): Promise<GenerateGapQuestionnaireResult> {
  const { clientId, createdBy, status, source, audience } = opts
  const admin = adminClient()

  const brain = await fetchBrandBrain(clientId)
  const gaps = computeBrainGaps(brain)
  const openQuestions = brain?.openQuestions ?? []

  const { data: clientRow } = await admin
    .from('clients')
    .select('name')
    .eq('id', clientId)
    .maybeSingle()
  const clientName = brain?.brandName || clientRow?.name || 'el cliente'

  // El único trozo que depende de quién responde. Al dueño se le habla
  // directamente a él y se reconoce que acaba de pasar por el alta guiada:
  // repetirle preguntas que contestó hace cinco minutos es perderlo.
  const audienceBlock =
    audience === 'client'
      ? `\n## QUIÉN LO RESPONDE
Lo responde EL DUEÑO de la marca, él solo, sin nadie de la agencia al lado, y acaba de terminar el alta guiada en la que ya revisó y confirmó el Cerebro que aparece arriba. Háblale de tú, directamente a él. No repitas NADA que ya figure en el Brand Brain: pregunta solo por lo que sigue vacío. Nada de jerga interna (ni "maps_to", ni "brand_data", ni "Brand Brain" sin explicar) — cada pregunta tiene que entenderse sin saber cómo funciona MIRA por dentro.
`
      : ''

  const focus = typeof opts.focus === 'string' ? opts.focus.trim().slice(0, 500) : ''

  const prompt = `Eres MIRA, la plataforma de agencia de Startup Factory. Vas a redactar un CUESTIONARIO para que ${clientName} lo responda con calma desde su portal. El objetivo es rellenar los huecos reales de su Brand Brain y resolver preguntas abiertas — nunca preguntar lo que ya sabemos.

## LO QUE YA SABEMOS (Brand Brain actual)
${brain ? formatBrandBrainForPrompt(brain) : '(This client has no Brand Brain yet: everything is still to capture.)'}

## DETECTED GAPS (empty Brand Brain fields)
${formatBrainGapsForPrompt(gaps, brain)}

## PREGUNTAS ABIERTAS / CONTRADICCIONES REGISTRADAS
${openQuestions.length ? openQuestions.map((q) => `- ${q}`).join('\n') : '- Ninguna registrada.'}
${focus ? `\n## FOCO PEDIDO POR LA AGENCIA\n${focus}\n` : ''}${audienceBlock}
## QUESTION BANK (intake template — reuse or adapt the ones that cover the gaps; their maps_to are already correctly derived)
${formatIntakeTemplateForPrompt()}

## INSTRUCCIONES
- Between 6 and 14 questions maximum. Prioritise the gaps most valuable for producing good reports and content; do not try to cover everything.
- In English, in the second person, warm and professional. Give each question a short "help" line with a concrete example tailored to ${clientName} where it adds something.
- Agrupa en 2-4 secciones cortas con nombres claros.
- kind ∈ "text" | "long_text" | "select" | "multi_select" | "number" | "url". Usa "options" SOLO con select/multi_select (array de strings).
- "required": true solo en las 2-4 preguntas realmente imprescindibles.
- "maps_to" says where the answer will be applied on ingestion: "brand_profile.<path>" (a brand_profiles column or a path inside brand_data, e.g. "brand_profile.brand_data.identity.tagline"), "project_memory" (contexto/objetivos/prioridades) o "content_pillar" (temas de contenido). Usa los maps_to sugeridos en los huecos y en el banco; null si la respuesta es solo informativa.
- For open questions and contradictions: ask neutrally so the client decides (never treat a contradiction as already resolved).

Reply ONLY with a valid JSON object, with no text outside the JSON:
{"title": "...", "intro": "2-3 sentences telling the client why we are asking and how long it takes", "questions": [{"section": "...", "prompt": "...", "help": "... or null", "kind": "...", "options": [...] | null, "required": true|false, "maps_to": "... | null"}]}`

  // La etiqueta de consumo del camino de agencia se mantiene tal cual estaba
  // para no partir en dos el histórico del panel de gasto.
  const usageRoute =
    source === 'brain_gaps' ? 'questionnaires/generate' : 'onboarding/self-serve/questionnaire'

  const message = await createMessageForClient(clientId, usageRoute, {
    model: 'claude-opus-4-8',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content
    .map((b) => ('text' in b ? b.text : ''))
    .filter(Boolean)
    .join('\n')

  let parsed: Record<string, unknown>
  try {
    const candidate = extractJson(text)
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      throw new ExtractJsonError('Model output is not a JSON object', text)
    }
    parsed = candidate as Record<string, unknown>
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new GapQuestionnaireError(
      `No se pudo extraer el cuestionario de la respuesta del modelo: ${msg}`,
      500
    )
  }

  const rawQuestions = Array.isArray(parsed.questions) ? (parsed.questions as GeneratedQuestion[]) : []
  const questionRows = rawQuestions
    .filter((q) => q && typeof q === 'object' && typeof q.prompt === 'string' && q.prompt.trim())
    .slice(0, 20)
    .map((q, i) => {
      const kind = normalizeKind(q.kind)
      const options =
        (kind === 'select' || kind === 'multi_select') && Array.isArray(q.options)
          ? (q.options as unknown[]).map((o) => String(o)).filter(Boolean)
          : null
      return {
        position: i + 1,
        section: typeof q.section === 'string' && q.section.trim() ? q.section.trim() : null,
        prompt: (q.prompt as string).trim(),
        help: typeof q.help === 'string' && q.help.trim() ? q.help.trim() : null,
        kind,
        options: options && options.length ? options : null,
        required: q.required === true,
        maps_to: typeof q.maps_to === 'string' && q.maps_to.trim() ? q.maps_to.trim() : null,
      }
    })

  if (questionRows.length === 0) {
    throw new GapQuestionnaireError('The model did not return any valid question — please try again', 500)
  }

  const title =
    typeof parsed.title === 'string' && parsed.title.trim()
      ? parsed.title.trim().slice(0, 200)
      : `Cuestionario para ${clientName}`
  const intro = typeof parsed.intro === 'string' && parsed.intro.trim() ? parsed.intro.trim() : null

  const { data: created, error: insertError } = await admin
    .from('client_questionnaires')
    .insert({
      client_id: clientId,
      project_id: opts.projectId ?? null,
      title,
      intro,
      status,
      source,
      created_by: createdBy,
    })
    .select('*')
    .single()

  if (insertError || !created) {
    if (isMissingTableError(insertError)) {
      throw new GapQuestionnaireError(QUESTIONNAIRES_UNAVAILABLE, 503)
    }
    throw new GapQuestionnaireError(insertError?.message || 'No se pudo guardar el cuestionario', 500)
  }

  const questionnaire = created as QuestionnaireRow
  const { error: qError } = await admin
    .from('questionnaire_questions')
    .insert(questionRows.map((q) => ({ ...q, questionnaire_id: questionnaire.id })))
  if (qError) {
    // Una cabecera sin preguntas es peor que ningún cuestionario: se deshace.
    await admin.from('client_questionnaires').delete().eq('id', questionnaire.id)
    throw new GapQuestionnaireError(qError.message, 500)
  }

  return { questionnaire, questionCount: questionRows.length, gapsDetected: gaps.length }
}
