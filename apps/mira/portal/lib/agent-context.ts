import { createClient } from '@/lib/supabase'

export interface RetrievedDocument {
  id: string
  title: string
  doc_type: string
  excerpt: string
  relevance_score: number
  tags?: string[]
  is_indexed: boolean
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

    const db = createClient()

    let q = db
      .from('client_documentation')
      .select('id, title, doc_type, description, extracted_text, tags, topics, is_indexed, uploaded_at')
      .eq('client_id', client_id)
      .eq('is_archived', false)

    if (context_type !== 'all') {
      const typeMap: Record<string, string[]> = {
        brand: ['brand_book', 'guidelines'],
        product: ['product_docs', 'handbook'],
        community: ['case_studies', 'handbook'],
        company: ['handbook', 'guidelines'],
      }

      const docTypes = typeMap[context_type] || []
      if (docTypes.length > 0) {
        q = q.in('doc_type', docTypes)
      }
    }

    const { data, error } = await q.order('uploaded_at', { ascending: false })

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

    const relevantDocs = data.slice(0, limit).map(doc => ({
      id: doc.id,
      title: doc.title,
      doc_type: doc.doc_type,
      excerpt: doc.extracted_text
        ? doc.extracted_text.substring(0, 500) + '...'
        : doc.description || '',
      relevance_score: computeRelevanceScore(doc.extracted_text, query),
      tags: doc.tags,
      is_indexed: doc.is_indexed,
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
