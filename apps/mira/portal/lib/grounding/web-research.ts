// lib/grounding/web-research.ts
// Thin Tavily search wrapper for grounding generated documents in real sources.
// Uses the same HTTP call shape as app/api/comercial/discovery/route.ts.
// Returns [] when TAVILY_API_KEY is missing or the request fails — never throws.

import type Anthropic from '@anthropic-ai/sdk'
import { createMessageForClient } from '@/lib/anthropic-client'

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

// Tool compartida (mismo shape que la ya usada en app/api/agent/route.ts) —
// Claude decide POR SU CUENTA si la necesita, mirando lo que ya tiene
// disponible (brand brain, memoria de proyecto, documentos, brief del
// usuario). No es una búsqueda forzada por regla fija: solo se dispara
// cuando el propio modelo no encuentra la información en su contexto.
export const WEB_SEARCH_TOOL: Anthropic.Tool = {
  name: 'web_search',
  description:
    'Search the web for current or verifiable information you do not already have — industry trends, competitor facts, prices, news, market data, recent events, real examples. Use it whenever you need a fact that is not in the Brand Brain, project memory, documents or the user\'s brief above — never invent it and never leave it as a placeholder if a search could find it.',
  input_schema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'The search query, in the language most likely to return good results' },
    },
    required: ['query'],
  },
}

const DEFAULT_MAX_TOOL_LOOPS = 3

export interface WebSearchGenerationResult {
  message: Anthropic.Message
  /** Todo el texto de los bloques de texto del turno final, concatenado. */
  text: string
  /** Las queries que el modelo decidió buscar, en orden (vacío si no buscó nada). */
  searchedQueries: string[]
}

/**
 * Genera un mensaje de un solo turno (no streaming) con la tool web_search
 * disponible — pensado para generación batch (Quick Actions, Monthly
 * Content System, Centro de Documentos) donde no hace falta stream, a
 * diferencia del chat de agentes (app/api/agent/route.ts), que sí. Mismo
 * loop de tool-use (ejecutar la búsqueda real, devolver el resultado,
 * continuar hasta que el modelo responda con el JSON/texto final).
 */
export async function generateWithWebSearch(params: {
  clientId: string | null | undefined
  route: string
  model: string
  maxTokens: number
  system?: string
  userContent: Anthropic.MessageCreateParamsNonStreaming['messages'][number]['content']
  maxToolLoops?: number
}): Promise<WebSearchGenerationResult> {
  const { clientId, route, model, maxTokens, system, userContent, maxToolLoops = DEFAULT_MAX_TOOL_LOOPS } = params
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userContent }]
  const searchedQueries: string[] = []
  let loops = 0
  let message: Anthropic.Message

  while (true) {
    message = await createMessageForClient(clientId, route, {
      model,
      max_tokens: maxTokens,
      ...(system ? { system } : {}),
      messages,
      tools: [WEB_SEARCH_TOOL],
    })

    const toolUseBlocks = message.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    )
    if (message.stop_reason !== 'tool_use' || toolUseBlocks.length === 0 || loops >= maxToolLoops) {
      break
    }
    loops++
    messages.push({ role: 'assistant', content: message.content })
    const toolResults = await Promise.all(
      toolUseBlocks.map(async (tb) => {
        const query = typeof (tb.input as { query?: string })?.query === 'string'
          ? (tb.input as { query: string }).query
          : ''
        if (query) searchedQueries.push(query)
        const results = query ? await searchWeb(query, 5) : []
        return {
          type: 'tool_result' as const,
          tool_use_id: tb.id,
          content: formatSourcesForPrompt(results, query || 'web search'),
        }
      })
    )
    messages.push({ role: 'user', content: toolResults })
  }

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')

  return { message, text, searchedQueries }
}
