import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'
import { getClaudeForClient, logUsage } from '@/lib/anthropic-client'
import { fetchBrandBrain, formatBrandBrainForPrompt } from '@/lib/brand-brain'
import { getClientMemoryContext } from '@/lib/client-memory'
import { GROUNDING_CONTRACT } from '@/lib/grounding/grounding-contract'

// Propuesta CANÓNICA del ecosistema (decisión 2026-07-19, docs/crm-architecture.md):
// esta ruta (streaming + brand_profiles) es la que usa MIRA. La del motor Python
// (/outreach/generate-proposal) queda solo para secuencias Instantly.
export async function POST(req: NextRequest) {
  const { callBrief, clientId: requestedClientId } = await req.json()
  if (!callBrief || !requestedClientId) {
    return NextResponse.json({ error: 'callBrief and clientId required' }, { status: 400 })
  }

  // Fase A: validar pertenencia del clientId del body y usar SIEMPRE el validado
  const resolved = await resolveRequestClient(requestedClientId)
  if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: resolved.status })
  const clientId = resolved.clientId

  const supabase = adminClient()

  const { company, contact_title, problem, services, budget, timeline, notes } = callBrief

  // Load Commercial Brain
  // Brand desde el lector canónico (antes se leían columnas paralelas
  // brand_name/unique_value_props — dos fuentes de verdad del brand) +
  // memoria del cliente + ICP.
  const [{ data: icp }, brain, memoryContext] = await Promise.all([
    supabase.from('icp_profiles').select('pain_points,industries').eq('client_id', clientId).limit(1).maybeSingle(),
    fetchBrandBrain(clientId),
    getClientMemoryContext(clientId),
  ])

  const systemPrompt = `Eres Nova, Proposal Writer de MIRA. Generas propuestas comerciales que cierran tratos.

${brain ? `SOBRE LA EMPRESA QUE PROPONE (tu cliente):\n${formatBrandBrainForPrompt(brain)}` : ''}

${memoryContext ? `${memoryContext}\n` : ''}
${icp ? `PAIN POINTS QUE RESOLVEMOS: ${(icp.pain_points as string[])?.join(', ') ?? '—'}` : ''}

ESTRUCTURA DE PROPUESTA (usa este formato exacto en markdown):
# Propuesta para [Empresa]

## Resumen Ejecutivo
[El problema central que resolvemos en 2-3 frases. Por qué ahora.]

## Diagnóstico
[Lo que identificamos en la llamada: síntomas, causas raíz, oportunidad perdida por no actuar]

## Solución Propuesta
[Exactamente qué vamos a hacer, en qué orden, con qué resultado esperado]

## Plan de Trabajo
| Fase | Semanas | Entregables |
|---|---|---|
[3-4 fases con timeline realista]

## Inversión
[Opciones de pricing adaptadas al presupuesto mencionado. Mínimo 2 opciones]

## Próximos Pasos
1. [Acción concreta #1]
2. [Acción concreta #2]
3. [CTA claro para cerrar]

---
Tono: profesional pero directo, español de España. El valor debe ser obvio ANTES del precio.

${GROUNDING_CONTRACT}`

  const userMessage = `BRIEF DE LLAMADA:
- Empresa prospect: ${company ?? 'sin especificar'}
- Cargo contacto: ${contact_title ?? 'sin especificar'}
- Problema principal detectado: ${problem ?? 'sin especificar'}
- Servicios de interés: ${services ?? 'sin especificar'}
- Presupuesto estimado: ${budget ?? 'sin especificar'}
- Timeline del prospect: ${timeline ?? 'sin especificar'}
- Notas adicionales: ${notes ?? '—'}

Genera la propuesta completa.`

  // BYO-Claude: key del cliente validado (fallback plataforma) + usage log
  const { client: anthropic, usedClientKey } = await getClaudeForClient(clientId)

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const anthropicStream = anthropic.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      })

      let fullOutput = ''
      for await (const chunk of anthropicStream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          fullOutput += chunk.delta.text
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }

      try {
        const finalMessage = await anthropicStream.finalMessage()
        await logUsage({
          clientId,
          route: 'comercial/proposal',
          model: 'claude-sonnet-4-6',
          usage: finalMessage.usage,
          usedClientKey,
        })
      } catch { /* usage logging must never break the stream */ }

      // Save to proposal_library
      if (fullOutput) {
        await supabase.from('proposal_library').insert({
          client_id: clientId,
          prospect_industry: (callBrief as Record<string, string>).industry ?? null,
          problem_solved: problem ?? null,
          services_proposed: services ? [services] : [],
          raw_content: fullOutput,
          outcome: 'pending',
        }).select()
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
  })
}
