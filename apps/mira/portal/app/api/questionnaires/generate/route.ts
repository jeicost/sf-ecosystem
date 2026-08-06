import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, resolveRequestClient } from '@/lib/resolve-client'
import { fetchBrandBrain, formatBrandBrainForPrompt, type BrandBrainContext } from '@/lib/brand-brain'
import { createMessageForClient } from '@/lib/anthropic-client'
import { extractJson, ExtractJsonError } from '@/lib/generation/extract-json'
import { formatIntakeTemplateForPrompt } from '@/lib/intake/intake-template'
import {
  isAgencyPlan,
  isMissingTableError,
  normalizeKind,
  QUESTIONNAIRES_UNAVAILABLE,
  type QuestionnaireRow,
} from '@/lib/questionnaires'

// Generación con opus puede tardar — mismo patrón que las rutas de toolkit
export const maxDuration = 300

// Huecos del brain: campos vacíos del BrandBrainContext con el maps_to al que
// debería ir la respuesta que los rellene. voice_vocabulary y otras estructuras
// de arrays complejos apuntan a notas escalares seguras (el ingest escribe
// strings; los executors deep-mergean sin romper shapes existentes).
function computeBrainGaps(brain: BrandBrainContext | null): string[] {
  const gaps: string[] = []
  const add = (label: string, mapsTo: string) => gaps.push(`- ${label} (maps_to sugerido: ${mapsTo})`)

  if (!brain) {
    gaps.push('- There is no Brand Brain yet: EVERYTHING is still to capture (name, mission, tone, proposition, audiences, pillars...)')
  }
  if (!brain?.brandName) add('Nombre de la marca', 'brand_profile.name')
  if (!brain?.mission) add('Mission', 'brand_profile.mission')
  if (!brain?.toneOfVoice) add('Tono de voz', 'brand_profile.tone_of_voice')
  if (!brain?.brandPersonality?.length) add('Valores / personalidad de marca', 'brand_profile.values')
  if (!brain?.pillars?.length) add('Pilares de contenido (3-5 temas)', 'content_pillar')
  if (!brain?.tagline) add('Tagline', 'brand_profile.brand_data.identity.tagline')
  if (!brain?.audiences?.length) add('Audiencias / cliente ideal', 'brand_profile.brand_data.audiences')
  if (!brain?.visualIdentitySummary) add('Visual identity (colours, typography, style)', 'brand_profile.brand_data.visual_identity.notes')
  if (!brain?.goldenRule) add('Regla de oro de la voz', 'brand_profile.brand_data.tone_and_voice.golden_rule')
  if (!brain?.voiceVocabulary?.do?.length && !brain?.voiceVocabulary?.dont?.length) {
    add('Voice vocabulary (what we say / what we never say)', 'brand_profile.brand_data.tone_and_voice.vocabulary_notes')
  }
  if (!brain?.bannedPhrases?.length) add('Frases prohibidas', 'brand_profile.brand_data.banned_phrases')
  if (!brain?.signatureRitual) add('Ritual o experiencia firma', 'brand_profile.brand_data.identity.signature_ritual')
  if (!brain?.offer) add('Offer (hero products, prices, where to buy)', 'brand_profile.brand_data.offer.full_list_note')
  if (!brain?.languages) add('Communication languages', 'brand_profile.brand_data.languages.manual')
  if (!brain?.channels?.length) add('Canales activos y su trabajo', 'brand_profile.brand_data.audience_channels')
  if (!brain?.constraints) add('Constraints (legal, category, self-imposed)', 'brand_profile.brand_data.constraints.notes')
  if (!brain?.whatFlopped?.length) add('What was tried and did not work', 'brand_profile.brand_data.strategy.what_worked_what_didnt')
  return gaps
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

    const admin = adminClient()

    let projectId: string | null = null
    if (typeof body.projectId === 'string' && body.projectId) {
      const { data: project } = await admin
        .from('mira_projects')
        .select('id, client_id')
        .eq('id', body.projectId)
        .maybeSingle()
      if (!project || project.client_id !== clientId) {
        return NextResponse.json({ error: 'El proyecto no pertenece a este cliente' }, { status: 403 })
      }
      projectId = project.id
    }

    const focus = typeof body.focus === 'string' ? body.focus.trim().slice(0, 500) : ''

    const brain = await fetchBrandBrain(clientId)
    const gaps = computeBrainGaps(brain)
    const openQuestions = brain?.openQuestions ?? []

    const { data: clientRow } = await admin
      .from('clients')
      .select('name')
      .eq('id', clientId)
      .maybeSingle()
    const clientName = brain?.brandName || clientRow?.name || 'el cliente'

    const prompt = `Eres MIRA, la plataforma de agencia de Startup Factory. Vas a redactar un CUESTIONARIO para que ${clientName} lo responda con calma desde su portal. El objetivo es rellenar los huecos reales de su Brand Brain y resolver preguntas abiertas — nunca preguntar lo que ya sabemos.

## LO QUE YA SABEMOS (Brand Brain actual)
${brain ? formatBrandBrainForPrompt(brain) : '(This client has no Brand Brain yet: everything is still to capture.)'}

## DETECTED GAPS (empty Brand Brain fields)
${gaps.length ? gaps.join('\n') : '- Nothing significant: the brain is fairly complete. Focus on the open questions and the agency\'s priorities.'}

## PREGUNTAS ABIERTAS / CONTRADICCIONES REGISTRADAS
${openQuestions.length ? openQuestions.map((q) => `- ${q}`).join('\n') : '- Ninguna registrada.'}
${focus ? `\n## FOCO PEDIDO POR LA AGENCIA\n${focus}\n` : ''}
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

    const message = await createMessageForClient(clientId, 'questionnaires/generate', {
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
      return NextResponse.json(
        { error: `No se pudo extraer el cuestionario de la respuesta del modelo: ${msg}` },
        { status: 500 }
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
      return NextResponse.json(
        { error: 'The model did not return any valid question — please try again' },
        { status: 500 }
      )
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
        project_id: projectId,
        title,
        intro,
        status: 'draft',
        source: 'brain_gaps',
        created_by: user.id,
      })
      .select('*')
      .single()

    if (insertError || !created) {
      if (isMissingTableError(insertError)) {
        return NextResponse.json({ error: QUESTIONNAIRES_UNAVAILABLE }, { status: 503 })
      }
      return NextResponse.json(
        { error: insertError?.message || 'No se pudo guardar el cuestionario' },
        { status: 500 }
      )
    }

    const questionnaire = created as QuestionnaireRow
    const { error: qError } = await admin
      .from('questionnaire_questions')
      .insert(questionRows.map((q) => ({ ...q, questionnaire_id: questionnaire.id })))
    if (qError) {
      await admin.from('client_questionnaires').delete().eq('id', questionnaire.id)
      return NextResponse.json({ error: qError.message }, { status: 500 })
    }

    return NextResponse.json({
      questionnaire,
      question_count: questionRows.length,
      gaps_detected: gaps.length,
    })
  } catch (error) {
    console.error('questionnaires/generate error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error generando el cuestionario' },
      { status: 500 }
    )
  }
}
