import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'
import { createMessageForClient } from '@/lib/anthropic-client'

interface TavilyResult { title: string; url: string; content: string }

async function tavilySearch(query: string, tavilyKey: string, maxResults = 8): Promise<TavilyResult[]> {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: tavilyKey,
      query,
      search_depth: 'advanced',
      max_results: maxResults,
      include_answer: false,
    }),
  })
  if (!res.ok) return []
  const json = await res.json()
  return (json.results ?? []) as TavilyResult[]
}

interface ExtractedCompany {
  company_name: string
  company_website: string | null
  linkedin_url: string | null
  industry: string
  geography: string
  key_person_name: string | null
  key_person_title: string | null
  description: string
  trigger_signals: string[]
}

async function extractCompanies(results: TavilyResult[], icp: Record<string, unknown>, clientId: string): Promise<ExtractedCompany[]> {
  const content = results.map(r => `TITLE: ${r.title}\nURL: ${r.url}\nCONTENT: ${r.content}`).join('\n\n---\n\n')

  const msg = await createMessageForClient(clientId, 'comercial/discovery', {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Extract companies from these search results that could match this ICP:
Industries: ${(icp.industries as string[])?.join(', ') ?? 'any'}
Geographies: ${(icp.geographies as string[])?.join(', ') ?? 'any'}
Job titles: ${(icp.job_titles as string[])?.join(', ') ?? 'any'}

SEARCH RESULTS:
${content}

Return a JSON array (no markdown) of up to 10 companies with this exact structure:
[{"company_name":"...","company_website":"url or null","linkedin_url":"url or null","industry":"...","geography":"country or city","key_person_name":"name or null","key_person_title":"title or null","description":"1-2 sentences","trigger_signals":["signal1"]}]

Only include companies clearly identifiable from the results. Skip vague mentions.`
    }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '[]'
  try {
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
    return JSON.parse(cleaned) as ExtractedCompany[]
  } catch { return [] }
}

async function scoreCompany(company: ExtractedCompany, icp: Record<string, unknown>, clientId: string): Promise<{ score: number; classification: string; reason: string }> {
  const msg = await createMessageForClient(clientId, 'comercial/discovery', {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: `Score this company 0-100 against the ICP.

COMPANY: ${company.company_name} | ${company.industry} | ${company.geography}
Contact: ${company.key_person_title ?? 'unknown'}
Description: ${company.description}
Signals: ${company.trigger_signals.join(', ') || 'none'}

ICP:
Industries: ${(icp.industries as string[])?.join(', ')}
Sizes: ${(icp.company_sizes as string[])?.join(', ')}
Geographies: ${(icp.geographies as string[])?.join(', ')}
Titles: ${(icp.job_titles as string[])?.join(', ')}
Disqualifiers: ${(icp.disqualifiers as string[])?.join(', ')}

Return JSON only: {"score":75,"classification":"hot","reason":"fits industry and geography, CEO contact detected"}
hot>=75, warm=50-74, cold=20-49, disqualify<20`
    }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '{}'
  try {
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
    return JSON.parse(cleaned)
  } catch { return { score: 30, classification: 'cold', reason: 'Could not parse scoring' } }
}

export async function POST(req: NextRequest) {
  const { keywords, industry, geography, limit = 20, clientId: requestedClientId } = await req.json()

  if (!keywords || !requestedClientId) {
    return NextResponse.json({ error: 'keywords and clientId required' }, { status: 400 })
  }

  // Fase A: validar pertenencia del clientId del body y usar SIEMPRE el validado
  const resolved = await resolveRequestClient(requestedClientId)
  if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: resolved.status })
  const clientId = resolved.clientId

  const supabase = adminClient()
  const TAVILY_KEY = process.env.TAVILY_API_KEY!

  const { data: icp } = await supabase
    .from('icp_profiles')
    .select('*')
    .eq('client_id', clientId)
    .limit(1)
    .maybeSingle()

  const icpData = icp ?? {}

  // Build Tavily queries
  const geos = geography
    ? [geography]
    : ((icpData as Record<string, unknown>).geographies as string[] | null)?.slice(0, 3) ?? ['']

  const queries = geos.map(geo =>
    [keywords, industry, geo].filter(Boolean).join(' ') + ' empresa contacto CEO fundador 2025'
  )

  // Stream response
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'))

      try {
        send({ type: 'status', message: `Buscando "${keywords}" en ${geos.join(', ')}...` })

        const allResults: TavilyResult[] = []
        for (const q of queries.slice(0, 3)) {
          const results = await tavilySearch(q, TAVILY_KEY, 8)
          allResults.push(...results)
        }

        send({ type: 'status', message: `Analizando ${allResults.length} fuentes con IA...` })

        const companies = await extractCompanies(allResults, icpData as Record<string, unknown>, clientId)
        const unique = companies.filter((c, i, arr) =>
          arr.findIndex(x => x.company_name.toLowerCase() === c.company_name.toLowerCase()) === i
        ).slice(0, limit)

        send({ type: 'status', message: `Puntuando ${unique.length} empresas contra el ICP...` })

        const scored = []
        for (const company of unique) {
          const scoring = await scoreCompany(company, icpData as Record<string, unknown>, clientId)
          scored.push({ ...company, ...scoring })
        }

        scored.sort((a, b) => b.score - a.score)

        // Upsert hot leads to Supabase
        const hotLeads = scored.filter(c => c.score >= 50)
        if (hotLeads.length > 0) {
          const rows = hotLeads.map(c => ({
            client_id: clientId,
            icp_id: (icpData as Record<string, unknown>).id ?? null,
            first_name: c.key_person_name?.split(' ')[0] ?? null,
            last_name: c.key_person_name?.split(' ').slice(1).join(' ') || null,
            title: c.key_person_title ?? null,
            company_name: c.company_name,
            company_website: c.company_website ?? null,
            linkedin_url: c.linkedin_url ?? null,
            industry: c.industry ?? industry ?? null,
            geography: c.geography ?? geography ?? null,
            stage: 'prospected' as const,
            hot_score: c.score,
            trigger_event: c.trigger_signals?.[0] ?? null,
            source: 'tavily_discovery',
          }))

          await supabase
            .from('leads')
            .upsert(rows, { onConflict: 'client_id,company_name', ignoreDuplicates: false })
        }

        send({ type: 'done', leads: scored, saved: hotLeads.length })
      } catch (err) {
        send({ type: 'error', message: String(err) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Transfer-Encoding': 'chunked' },
  })
}
