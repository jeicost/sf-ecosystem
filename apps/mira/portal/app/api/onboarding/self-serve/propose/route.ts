import { NextRequest, NextResponse } from 'next/server'
import { resolveRequestClient } from '@/lib/resolve-client'
import { createMessageForClient } from '@/lib/anthropic-client'
import { extractJson, ExtractJsonError } from '@/lib/generation/extract-json'
import { fetchSiteSnapshot, formatSnapshotForPrompt } from '@/lib/grounding/site-snapshot'
import {
  buildProposalPrompt,
  missingRequiredAnswers,
  sanitizeDraft,
  EMPTY_ANSWERS,
  type SelfServeAnswers,
} from '@/lib/onboarding/self-serve'
import { generationCapErrorResponse } from '@/lib/generation-cap-server'

// Opus tarda: mismo maxDuration que las rutas de toolkit y de cuestionarios.
export const maxDuration = 300

// POST /api/onboarding/self-serve/propose — {clientId?, answers}
//
// Lee la web del cliente y redacta el borrador de su Cerebro. NO ESCRIBE NADA:
// devuelve el borrador para que lo revise en pantalla. Es el mismo contrato que
// el AssistantPanel del alta de agencia (extraer sin tocar BD), pero proponiendo
// el Cerebro ENTERO con pilares, no los 9 campos del formulario de agencia, que
// son exactamente el perfil de un cliente que no produce.
//
// El extractor genérico (/api/onboarding/extract, antes bajo /admin y cerrado
// con requireSuperAdmin) ya está abierto al cliente sobre su propio cliente.
// Aun así esta ruta sigue existiendo aparte: aquel devuelve los campos de UN
// paso del formulario de agencia, y aquí hace falta el borrador completo con
// pilares, que es lo único que evita otro cliente con 0 pilares.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    const access = await resolveRequestClient(typeof body.clientId === 'string' ? body.clientId : null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const answers: SelfServeAnswers = { ...EMPTY_ANSWERS }
    const raw = (body.answers ?? {}) as Record<string, unknown>
    for (const key of Object.keys(EMPTY_ANSWERS) as Array<keyof SelfServeAnswers>) {
      // 12.000 caracteres: la caja de "pega lo que ya tengas" es donde llega el
      // material de verdad (una página About entera, un brief viejo) y truncarla
      // a 2 líneas convierte este paso en un formulario más.
      if (typeof raw[key] === 'string') answers[key] = (raw[key] as string).slice(0, 12000)
    }

    const missing = missingRequiredAnswers(answers)
    if (missing.length) {
      return NextResponse.json(
        { error: `Still missing: ${missing.map((m) => m.label).join(', ')}` },
        { status: 400 }
      )
    }

    // Arranque en frío desde la URL: hoy nada convierte una web en Cerebro sin
    // pasar por el toolkit. fetchSiteSnapshot nunca lanza — si la web no
    // responde, se sigue con las respuestas y se avisa en la UI en vez de
    // dejar al cliente mirando un error por una web caída.
    let siteFacts: string | null = null
    let siteError: string | null = null
    if (answers.website_url.trim()) {
      const snapshot = await fetchSiteSnapshot(answers.website_url.trim())
      if (snapshot.fetchError) siteError = snapshot.fetchError
      else siteFacts = formatSnapshotForPrompt(snapshot)
    }

    const message = await createMessageForClient(access.clientId, 'onboarding/self-serve/propose', {
      model: 'claude-opus-4-8',
      max_tokens: 6000,
      messages: [{ role: 'user', content: buildProposalPrompt({ answers, siteFacts }) }],
    })

    const text = message.content
      .map((b) => ('text' in b ? b.text : ''))
      .filter(Boolean)
      .join('\n')

    let parsed: unknown
    try {
      parsed = extractJson(text)
    } catch (err) {
      const msg = err instanceof ExtractJsonError ? err.message : String(err)
      console.error('self-serve/propose: unparseable model output:', msg)
      return NextResponse.json(
        { error: 'MIRA could not put together a draft this time. Try again — your answers are saved.' },
        { status: 502 }
      )
    }

    const draft = sanitizeDraft(parsed)
    if (!draft.pillars.length && !draft.tone_summary && !draft.one_liner) {
      return NextResponse.json(
        { error: 'The draft came back empty. Add a bit more detail about what you do and try again.' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      client_id: access.clientId,
      draft,
      site: {
        read: Boolean(siteFacts),
        error: siteError,
      },
    })
  } catch (error) {
    const capped = generationCapErrorResponse(error)
    if (capped) return capped
    console.error('onboarding/self-serve/propose error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not draft your Brand Brain' },
      { status: 500 }
    )
  }
}
