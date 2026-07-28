import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getClaudeForClient, logUsage } from '@/lib/anthropic-client'
import { requireLeadAccess } from '@/lib/comercial/lead-access'
import { fetchBrandBrain, formatBrandBrainForPrompt } from '@/lib/brand-brain'
import { getClientMemoryContext } from '@/lib/client-memory'
import { GROUNDING_CONTRACT } from '@/lib/grounding/grounding-contract'

const STAGE_MAP: Record<string, string> = {
  interested: 'qualified',
  not_now: 'replied',
  not_interested: 'lost',
  referral: 'replied',
}

export async function POST(req: NextRequest) {
  const { leadId, replyText } = await req.json()
  if (!leadId || !replyText) {
    return NextResponse.json({ error: 'leadId and replyText required' }, { status: 400 })
  }

  const access = await requireLeadAccess(leadId)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  const { lead } = access

  const supabase = adminClient()

  // Brand Brain + memoria del cliente: sin saber qué vende el cliente ni qué
  // pasó antes con sus prospects, Quinn clasificaba bien pero next_move y
  // suggested_reply salían genéricos (mismo patrón que comercial/proposal).
  const [brain, memoryContext] = await Promise.all([
    fetchBrandBrain(lead.client_id),
    getClientMemoryContext(lead.client_id),
  ])

  const systemPrompt = `Eres Quinn, Reply Qualifier de MIRA. Analizas respuestas de cold outreach para clasificar intención y proponer el siguiente paso.

${brain ? `SOBRE LA EMPRESA QUE HACE EL OUTREACH (tu cliente):\n${formatBrandBrainForPrompt(brain)}\n` : ''}
${memoryContext ? `${memoryContext}\n` : ''}
${GROUNDING_CONTRACT}`

  const prompt = `Analiza esta respuesta de cold outreach.

PROSPECT: ${[lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Desconocido'} — ${lead.title ?? ''} en ${lead.company_name ?? 'empresa desconocida'}

RESPUESTA RECIBIDA:
"""
${replyText}
"""

Analiza y devuelve JSON exacto (sin markdown):
{
  "classification": "interested|not_now|not_interested|referral",
  "bant_budget": "yes|no|unknown",
  "bant_authority": "yes|no|unknown",
  "bant_need": "yes|no|unknown",
  "bant_timeline": "yes|no|unknown",
  "bant_score": 0,
  "next_move": "Texto exacto de qué hacer ahora mismo (1-2 frases)",
  "suggested_reply": "Mensaje listo para enviar (máximo 3 frases, tono conversacional)",
  "buying_signals": ["señal1", "señal2"]
}

bant_score = suma de los 4 "yes" (0-4).
Classification: interested=muestra interés real, not_now=sin interés ahora pero puede volver, not_interested=rechazo claro, referral=deriva a otra persona.`

  // BYO-Claude: key del cliente dueño del lead (fallback plataforma) + usage log
  const { client: anthropic, usedClientKey } = await getClaudeForClient(lead.client_id)

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const anthropicStream = anthropic.messages.stream({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      })

      let fullText = ''
      for await (const chunk of anthropicStream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          fullText += chunk.delta.text
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }

      try {
        const finalMessage = await anthropicStream.finalMessage()
        await logUsage({
          clientId: lead.client_id,
          route: 'comercial/qualify',
          model: 'claude-haiku-4-5-20251001',
          usage: finalMessage.usage,
          usedClientKey,
        })
      } catch { /* usage logging must never break the stream */ }

      // Parse and update lead stage
      try {
        const cleaned = fullText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
        const parsed = JSON.parse(cleaned)
        const newStage = STAGE_MAP[parsed.classification] ?? 'replied'

        await Promise.all([
          supabase.from('leads').update({ stage: newStage, bant_score: parsed.bant_score ?? null }).eq('id', leadId),
          supabase.from('lead_activities').insert({
            lead_id: leadId,
            type: 'email_replied',
            content: replyText,
            metadata: { classification: parsed.classification, bant_score: parsed.bant_score },
          }),
        ])
      } catch {}

      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
  })
}
