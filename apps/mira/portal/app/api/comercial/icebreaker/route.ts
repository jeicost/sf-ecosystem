import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { createMessageForClient } from '@/lib/anthropic-client'
import { requireLeadAccess } from '@/lib/comercial/lead-access'
import { fetchBrandBrain, formatBrandBrainForPrompt } from '@/lib/brand-brain'
import { getClientMemoryContext } from '@/lib/client-memory'
import { GROUNDING_CONTRACT } from '@/lib/grounding/grounding-contract'

// NOTA (corregida 2026-07-23, ver docs/DEBT.md): esta ruta NO es la que usa la UI real —
// app/(dashboard)/comercial/icebreaker/page.tsx llama a /api/agent (role: 'icebreaker-writer')
// para tener Brand Brain + memoria del cliente. Esta ruta funciona correctamente end-to-end
// (verificado en vivo) y tiene la ventaja de auto-guardar en leads.icebreaker_used sin paso
// manual — pero hoy solo se llama directamente (no desde ningún botón de la UI). El
// /icebreaker/generate del motor Python queda para el camino automático (webhook hot-lead).
export async function POST(req: NextRequest) {
  const { leadId } = await req.json()

  const access = await requireLeadAccess(leadId)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  const { lead } = access

  const supabaseAdmin = adminClient()

  // Brand Brain + memoria del cliente: el icebreaker habla EN NOMBRE del
  // cliente — sin su tono de voz el mensaje sonaba a plantilla de agencia,
  // no a la persona que firma (mismo patrón que comercial/proposal).
  const [{ data: context }, { data: icp }, brain, memoryContext] = await Promise.all([
    supabaseAdmin.from('prospect_context').select('*').eq('lead_id', leadId).maybeSingle(),
    supabaseAdmin.from('icp_profiles').select('*').eq('client_id', lead.client_id).limit(1).maybeSingle(),
    fetchBrandBrain(lead.client_id),
    getClientMemoryContext(lead.client_id),
  ])

  const systemPrompt = `Eres Finn, un experto en cold outreach B2B. Tu objetivo es escribir el primer mensaje de contacto perfecto en nombre de tu cliente.

${brain ? `SOBRE LA EMPRESA QUE ESCRIBE (tu cliente — usa SU tono de voz, no uno genérico):\n${formatBrandBrainForPrompt(brain)}\n` : ''}
${memoryContext ? `${memoryContext}\n` : ''}
${GROUNDING_CONTRACT}`

  const prompt = `Escribe el primer mensaje de contacto para este prospect.

PROSPECT:
- Nombre: ${[lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'No disponible'}
- Cargo: ${lead.title ?? 'No disponible'}
- Empresa: ${lead.company_name ?? 'No disponible'}
- Industria: ${lead.industry ?? 'No disponible'}
- Geografía: ${lead.geography ?? 'No disponible'}
- Trigger event: ${lead.trigger_event ?? 'No detectado'}
- LinkedIn summary: ${lead.linkedin_summary ?? 'No disponible'}
- Noticias recientes empresa: ${lead.company_news ?? 'No disponible'}
${context?.recent_news?.length ? `- Señales recientes: ${context.recent_news.slice(0, 2).join('; ')}` : ''}

${icp ? `ICP DE NUESTRO CLIENTE:
- Industrias objetivo: ${icp.industries?.join(', ') ?? '—'}
- Pain points que resolvemos: ${icp.pain_points?.join(', ') ?? '—'}` : ''}

INSTRUCCIONES:
- Escribe 2-3 frases máximo
- El primer mensaje debe mencionar algo MUY específico del prospect (trigger event, cargo reciente, noticia)
- NO menciones productos ni hagas pitch en el icebreaker
- Tono: directo, sin jerga corporativa, como de persona a persona
- Si no hay trigger event, usa el cargo/industria para crear una conexión genuina
- Escribe en el idioma más apropiado según la geografía del prospect (español si es LATAM/España)

Devuelve SOLO el mensaje de icebreaker, sin explicaciones.`

  const message = await createMessageForClient(lead.client_id, 'comercial/icebreaker', {
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  })

  const icebreaker = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

  if (icebreaker) {
    await supabaseAdmin
      .from('leads')
      .update({ icebreaker_used: icebreaker })
      .eq('id', leadId)
  }

  return NextResponse.json({ icebreaker })
}
