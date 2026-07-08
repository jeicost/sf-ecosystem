import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  const { leadId } = await req.json()
  if (!leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 })

  const [{ data: lead }, { data: context }] = await Promise.all([
    supabaseAdmin.from('leads').select('*').eq('id', leadId).single(),
    supabaseAdmin.from('prospect_context').select('*').eq('lead_id', leadId).maybeSingle(),
  ])

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const { data: icp } = await supabaseAdmin
    .from('icp_profiles')
    .select('*')
    .eq('client_id', lead.client_id)
    .limit(1)
    .maybeSingle()

  const prompt = `Eres Finn, un experto en cold outreach B2B. Tu objetivo es escribir el primer mensaje de contacto perfecto para este prospect.

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

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
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
