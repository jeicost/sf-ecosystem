// Server-side only: this module runs inside API routes / generation libs.
// Use the service-role client — the browser/anon client has no session here
// and its key is rejected, which silently dropped document context.
import { adminClient } from '@/lib/supabase'

export interface RetrievedDocument {
  id: string
  title: string
  doc_type: string
  excerpt: string
  relevance_score: number
  tags?: string[]
}

export interface RetrieveContextResponse {
  documents: RetrievedDocument[]
  total_tokens_used: number
  count: number
}

export async function retrieveAgentContext(params: {
  client_id: string
  context_type?: 'brand' | 'product' | 'community' | 'company' | 'all'
  query?: string
  limit?: number
}): Promise<RetrieveContextResponse | null> {
  try {
    const {
      client_id,
      context_type = 'all',
      query,
      limit = 5,
    } = params

    if (!client_id) {
      return null
    }

    const db = adminClient()

    // Columnas del esquema REAL de client_documentation (verificado en BD
    // 2026-07-27): filename/storage_url/file_size_bytes/created_at. El select
    // anterior pedía columnas de la migración 0015 que nunca se aplicó
    // (extracted_text/topics/is_indexed/uploaded_at) — fallaba en silencio y
    // el grounding por documentos no funcionó NUNCA. extracted_text existe
    // desde la migración 0048.
    let q = db
      .from('client_documentation')
      .select('id, title, doc_type, description, extracted_text, tags, created_at')
      .eq('client_id', client_id)
      .eq('is_archived', false)

    if (context_type !== 'all') {
      const typeMap: Record<string, string[]> = {
        brand: ['brand-book', 'marketing'],
        product: ['product-doc', 'handbook'],
        community: ['handbook'],
        company: ['handbook', 'brand-book'],
      }

      const docTypes = typeMap[context_type] || []
      if (docTypes.length > 0) {
        q = q.in('doc_type', docTypes)
      }
    }

    let { data, error } = await q.order('created_at', { ascending: false })

    // Fallback pre-0048: sin la columna extracted_text, repetir el select sin ella
    if (error?.message.includes('extracted_text')) {
      ;({ data, error } = (await db
        .from('client_documentation')
        .select('id, title, doc_type, description, tags, created_at')
        .eq('client_id', client_id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })) as { data: any[] | null; error: any })
    }

    if (error) {
      console.error('Database error:', error)
      return null
    }

    if (!data || data.length === 0) {
      return {
        documents: [],
        total_tokens_used: 0,
        count: 0,
      }
    }

    const relevantDocs = data.slice(0, limit).map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      doc_type: doc.doc_type,
      excerpt: doc.extracted_text
        ? doc.extracted_text.substring(0, 500) + '...'
        : doc.description || '',
      relevance_score: computeRelevanceScore(doc.extracted_text ?? null, query),
      tags: doc.tags,
    }))

    const totalText = relevantDocs.map(d => d.excerpt).join('\n').length
    const estimatedTokens = Math.ceil(totalText / 4)

    return {
      documents: relevantDocs,
      total_tokens_used: estimatedTokens,
      count: relevantDocs.length,
    }
  } catch (error) {
    console.error('Retrieve error:', error)
    return null
  }
}

function computeRelevanceScore(text: string | null | undefined, query: string | undefined): number {
  if (!text || !query) return 0.85

  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()
  const words = queryLower.split(/\s+/).filter(w => w.length > 0)

  if (words.length === 0) return 0.85

  const matches = words.filter(word => textLower.includes(word)).length
  return Math.min(1, (matches / words.length) * 0.9 + 0.1)
}
