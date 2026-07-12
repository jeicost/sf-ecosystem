import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const STAGE_MAP: Record<string, string> = {
  interested: 'qualified',
  not_now: 'replied',
  not_interested: 'lost',
  referral: 'replied',
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const { leadId, replyText } = await req.json()
  if (!leadId || !replyText) {
    return NextResponse.json({ error: 'leadId and replyText required' }, { status: 400 })
  }

  const { data: lead } = await supabase
    .from('leads')
    .select('first_name,last_name,company_name,title,industry')
    .eq('id', leadId)
    .single()

  const prompt = `Eres Quinn, Reply Qualifier de MIRA. Analiza esta respuesta de cold outreach.

PROSPECT: ${[lead?.first_name, lead?.last_name].filter(Boolean).join(' ') || 'Desconocido'} — ${lead?.title ?? ''} en ${lead?.company_name ?? 'empresa desconocida'}

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

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const anthropicStream = anthropic.messages.stream({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      })

      let fullText = ''
      for await (const chunk of anthropicStream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          fullText += chunk.delta.text
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }

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
