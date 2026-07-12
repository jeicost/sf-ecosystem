import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const { callBrief, clientId } = await req.json()
  if (!callBrief || !clientId) {
    return NextResponse.json({ error: 'callBrief and clientId required' }, { status: 400 })
  }

  const { company, contact_title, problem, services, budget, timeline, notes } = callBrief

  // Load Commercial Brain
  const [{ data: icp }, { data: brandProfile }] = await Promise.all([
    supabase.from('icp_profiles').select('pain_points,industries').eq('client_id', clientId).limit(1).maybeSingle(),
    supabase.from('brand_profiles').select('brand_name,mission,unique_value_props').eq('client_id', clientId).single(),
  ])

  const systemPrompt = `Eres Nova, Proposal Writer de MIRA. Generas propuestas comerciales que cierran tratos.

${brandProfile ? `AGENCIA:
- Nombre: ${brandProfile.brand_name}
- Misión: ${brandProfile.mission ?? '—'}
- Propuestas de valor: ${(brandProfile.unique_value_props as string[])?.join(', ') ?? '—'}` : ''}

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
Tono: profesional pero directo, español de España. El valor debe ser obvio ANTES del precio.`

  const userMessage = `BRIEF DE LLAMADA:
- Empresa prospect: ${company ?? 'sin especificar'}
- Cargo contacto: ${contact_title ?? 'sin especificar'}
- Problema principal detectado: ${problem ?? 'sin especificar'}
- Servicios de interés: ${services ?? 'sin especificar'}
- Presupuesto estimado: ${budget ?? 'sin especificar'}
- Timeline del prospect: ${timeline ?? 'sin especificar'}
- Notas adicionales: ${notes ?? '—'}

Genera la propuesta completa.`

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
