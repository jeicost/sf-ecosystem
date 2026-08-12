// Extractor de campos de alta: se pega texto libre (la web, un brief, notas de
// una llamada) y la IA devuelve los campos de ese paso ya rellenos. NO ESCRIBE
// NADA en BD — devuelve JSON para que el formulario lo vuelque en su estado y
// la persona lo corrija antes de guardar.
//
// Vivía en app/api/admin/onboarding/extract/route.ts detrás de
// requireSuperAdmin(), es decir: la única pieza del alta que de verdad ahorra
// trabajo ("pega tu web y te la relleno") estaba reservada a la agencia,
// justo al revés de lo que necesita un cliente Starter que se da de alta solo.
//
// Ahora el permiso lo decide resolveRequestClient: cada quien extrae SOBRE SU
// PROPIO cliente y nunca sobre otro. La excepción es el super_admin, que puede
// estar dando de alta un cliente que TODAVÍA NO EXISTE (el wizard de agencia
// llama a esto antes de crear la fila) y por tanto no tiene clientId que
// resolver — se le deja pasar con clientId nulo.
//
// La ruta canónica es /api/onboarding/extract. /api/admin/onboarding/extract se
// mantiene como alias delegando aquí, porque el AssistantPanel del wizard de
// agencia ya publicado apunta a la vieja.

import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, resolveRequestClient } from '@/lib/resolve-client'
import { createMessageForClient } from '@/lib/anthropic-client'

const STEP_SCHEMAS: Record<string, string> = {
  basics: `{"company_name": "", "sector": "", "website_url": "", "slug_sugerido": "kebab-case"}`,
  brand: `{"mission": "", "proposition": "propuesta de valor en 1-2 frases", "tone_of_voice": "", "values": ["valor1"], "tagline": "", "one_liner": "", "primary_color": "#RRGGBB solo si aparece", "secondary_color": "#RRGGBB solo si aparece", "logo_url": "solo si aparece una URL de logo"}`,
  project: `{"project_name": "", "project_description": ""}`,
  login: `{"email": "solo si aparece un email de contacto del cliente"}`,
}

/**
 * Handler compartido por la ruta canónica y por el alias /admin.
 * Body: {text, step, clientId?}
 */
export async function handleExtractRequest(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { text, step } = body as { text?: unknown; step?: unknown }
    if (typeof text !== 'string' || !text.trim() || typeof step !== 'string' || !STEP_SCHEMAS[step]) {
      return NextResponse.json({ error: 'Missing text or invalid step' }, { status: 400 })
    }

    // El super_admin puede estar extrayendo para un cliente aún inexistente:
    // se le permite sin cliente resuelto. Cualquier otra persona tiene que
    // tener un grant sobre el cliente que dice ser.
    const isSuperAdmin = user.user_metadata?.plan === 'super_admin'
    let clientId: string | null = null
    if (isSuperAdmin) {
      const requested = typeof (body as { clientId?: unknown }).clientId === 'string'
        ? ((body as { clientId: string }).clientId)
        : null
      clientId = requested
    } else {
      const access = await resolveRequestClient(
        typeof (body as { clientId?: unknown }).clientId === 'string'
          ? ((body as { clientId: string }).clientId)
          : null
      )
      if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
      clientId = access.clientId
    }

    // createMessageForClient y no un Anthropic crudo: así la extracción del
    // cliente se registra en su propio consumo, igual que el resto de rutas.
    const message = await createMessageForClient(clientId, 'onboarding/extract', {
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [
        {
          role: 'user',
          content: `Eres el analista de alta de clientes de una agencia. Extrae del texto SOLO los campos de este paso. Regla dura: si un dato no está en el texto, deja el campo como cadena vacía — NUNCA lo inventes.

TEXTO:
"""
${text.slice(0, 8000)}
"""

Devuelve SOLO este JSON (sin prosa):
${STEP_SCHEMAS[step]}`,
        },
      ],
    })

    const raw = message.content
      .map((b) => ('text' in b ? b.text : ''))
      .filter(Boolean)
      .join('')
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Nothing could be extracted from that text' }, { status: 500 })
    }

    let fields: Record<string, unknown>
    try {
      fields = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json({ error: 'The extractor returned invalid JSON' }, { status: 500 })
    }
    // limpiar vacíos para no pisar lo que ya se había escrito a mano
    for (const k of Object.keys(fields)) {
      const v = fields[k]
      if (v === '' || v === null || (Array.isArray(v) && v.length === 0)) delete fields[k]
    }
    return NextResponse.json({ fields })
  } catch (error) {
    console.error('onboarding/extract error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Extraction failed' },
      { status: 500 }
    )
  }
}
