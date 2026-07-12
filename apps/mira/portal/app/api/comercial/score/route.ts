import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const { leadId, clientId } = await req.json()
  if (!leadId || !clientId) return NextResponse.json({ error: 'leadId and clientId required' }, { status: 400 })

  const [{ data: lead }, { data: icp }] = await Promise.all([
    supabase.from('leads').select('*').eq('id', leadId).single(),
    supabase.from('icp_profiles').select('*').eq('client_id', clientId).limit(1).maybeSingle(),
  ])

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const prompt = `Score this B2B lead 0-100 against the ICP.

LEAD:
- Company: ${lead.company_name ?? 'unknown'}
- Contact: ${[lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'unknown'}, ${lead.title ?? 'unknown title'}
- Industry: ${lead.industry ?? 'unknown'}
- Geography: ${lead.geography ?? 'unknown'}
- Company size: ${lead.company_size ?? 'unknown'}
- Trigger event: ${lead.trigger_event ?? 'none detected'}
- LinkedIn summary: ${lead.linkedin_summary ?? 'not available'}

${icp ? `ICP:
- Target industries: ${icp.industries?.join(', ') ?? '—'}
- Target sizes: ${icp.company_sizes?.join(', ') ?? '—'}
- Target geographies: ${icp.geographies?.join(', ') ?? '—'}
- Decision maker titles: ${icp.job_titles?.join(', ') ?? '—'}
- Pain points we solve: ${icp.pain_points?.join(', ') ?? '—'}
- Trigger events: ${icp.trigger_events?.join(', ') ?? '—'}
- Disqualifiers: ${icp.disqualifiers?.join(', ') ?? '—'}
- Min budget USD: ${icp.min_budget_usd ?? 0}` : 'No ICP defined — score based on general B2B fit.'}

Return JSON only (no markdown):
{"score":75,"classification":"hot","reason":"Fits target industry and geography; CEO contact with buying signals","confidence":0.85}

hot>=75, warm=50-74, cold=20-49, disqualify<20`

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '{}'
  let result: { score: number; classification: string; reason: string; confidence: number }
  try {
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
    result = JSON.parse(cleaned)
  } catch {
    result = { score: 30, classification: 'cold', reason: 'Scoring error', confidence: 0 }
  }

  await supabase
    .from('leads')
    .update({ hot_score: result.score })
    .eq('id', leadId)

  return NextResponse.json(result)
}
