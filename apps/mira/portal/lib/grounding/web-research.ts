// lib/grounding/web-research.ts
// Thin Tavily search wrapper for grounding generated documents in real sources.
// Uses the same HTTP call shape as app/api/comercial/discovery/route.ts.
// Returns [] when TAVILY_API_KEY is missing or the request fails — never throws.

export interface WebSearchResult {
  title: string
  url: string
  snippet: string
}

interface TavilyResult {
  title: string
  url: string
  content: string
}

export async function searchWeb(query: string, maxResults = 5): Promise<WebSearchResult[]> {
  const tavilyKey = process.env.TAVILY_API_KEY
  if (!tavilyKey) return []

  try {
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
    const results = (json.results ?? []) as TavilyResult[]
    return results.map((r) => ({
      title: r.title ?? '',
      url: r.url ?? '',
      snippet: r.content ?? '',
    }))
  } catch {
    return []
  }
}

/** Formats search results as a labeled SOURCES block for prompt grounding. */
export function formatSourcesForPrompt(results: WebSearchResult[], label: string): string {
  if (results.length === 0) return 'NO SOURCES AVAILABLE'
  const lines = [`SOURCES (${label})`]
  results.forEach((r, i) => {
    lines.push(`[${i + 1}] ${r.title}`)
    lines.push(`    URL: ${r.url}`)
    lines.push(`    ${r.snippet}`)
  })
  return lines.join('\n')
}
