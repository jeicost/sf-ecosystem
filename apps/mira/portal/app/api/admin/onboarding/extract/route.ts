import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireSuperAdmin } from '@/lib/require-super-admin'

export const maxDuration = 60

// P7 — asistente del wizard de alta: el admin pega un brief/notas/web y la IA
// EXTRAE los campos del paso actual para rellenar el formulario. No escribe
// NADA en BD — los datos viven en el wizard hasta el "Crear" final.

const STEP_SCHEMAS: Record<string, string> = {
  basics: `{"company_name": "", "sector": "", "website_url": "", "slug_sugerido": "kebab-case"}`,
  brand: `{"mission": "", "proposition": "propuesta de valor en 1-2 frases", "tone_of_voice": "", "values": ["valor1"], "tagline": "", "one_liner": "", "primary_color": "#RRGGBB solo si aparece", "secondary_color": "#RRGGBB solo si aparece", "logo_url": "solo si aparece una URL de logo"}`,
  project: `{"project_name": "", "project_description": ""}`,
  login: `{"email": "solo si aparece un email de contacto del cliente"}`,
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSuperAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { text, step } = await req.json()
    if (typeof text !== 'string' || !text.trim() || !STEP_SCHEMAS[step]) {
      return NextResponse.json({ error: 'Faltan text o step válido' }, { status: 400 })
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [
        {
          role: 'user',
          content: `Eres el analista de alta de clientes de una agencia. Extrae del texto SOLO los campos de este paso. Regla dura: si un dato no está en el texto, deja el campo como cadena vacía — NUNCA lo inventes.

TEXTO DEL ADMIN:
"""
${text.slice(0, 8000)}
"""

Devuelve SOLO este JSON (sin prosa):
${STEP_SCHEMAS[step]}`,
        },
      ],
    })

    const raw = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'No se pudo extraer' }, { status: 500 })

    let fields: Record<string, unknown>
    try {
      fields = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json({ error: 'JSON inválido del extractor' }, { status: 500 })
    }
    // limpiar vacíos para no pisar lo que el admin ya escribió
    for (const k of Object.keys(fields)) {
      const v = fields[k]
      if (v === '' || v === null || (Array.isArray(v) && v.length === 0)) delete fields[k]
    }
    return NextResponse.json({ fields })
  } catch (error) {
    console.error('onboarding/extract error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error extrayendo' },
      { status: 500 }
    )
  }
}
