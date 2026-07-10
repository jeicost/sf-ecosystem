import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

interface RetrieveContextRequest {
  client_id: string
  context_type?: 'brand' | 'product' | 'community' | 'company' | 'all'
  query?: string
  limit?: number
}

/**
 * Agent Context Retrieval API
 *
 * Used by:
 * - Toolkit tools (Marketing Campaign Generator, Community Blueprint, etc.)
 * - Sales Engine enrichment
 * - Any agent needing client-specific documentation
 *
 * Returns relevant documents based on context_type and optional semantic search
 */
export async function POST(req: NextRequest) {
  try {
    const body: RetrieveContextRequest = await req.json()
    const {
      client_id,
      context_type = 'all',
      query,
      limit = 5,
    } = body

    if (!client_id) {
      return NextResponse.json(
        { error: 'client_id required' },
        { status: 400 }
      )
    }

    const db = createClient()

    // Build query
    let q = db
      .from('client_documentation')
      .select('id, title, doc_type, description, extracted_text, tags, topics, is_indexed, uploaded_at')
      .eq('client_id', client_id)
      .eq('is_archived', false)

    // Filter by context type (mapping doc_type to context)
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
      return NextResponse.json(
        { error: 'Failed to retrieve context' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        {
          documents: [],
          total_tokens_used: 0,
          warning: 'No documents found for this context type. Upload documentation first.',
        }
      )
    }

    // For now, return top N documents
    // TODO: Implement semantic search with embeddings (OpenAI text-embedding-3-small)
    // TODO: Rank by relevance_score if query provided
    const relevantDocs = data.slice(0, limit).map(doc => ({
      id: doc.id,
      title: doc.title,
      doc_type: doc.doc_type,
      excerpt: doc.extracted_text
        ? doc.extracted_text.substring(0, 500) + '...'
        : doc.description || '',
      relevance_score: 0.85, // TODO: compute from embeddings
      tags: doc.tags,
      is_indexed: doc.is_indexed,
    }))

    // Estimate tokens (rough: 4 chars = 1 token)
    const totalText = relevantDocs.map(d => d.excerpt).join('\n').length
    const estimatedTokens = Math.ceil(totalText / 4)

    return NextResponse.json({
      documents: relevantDocs,
      total_tokens_used: estimatedTokens,
      count: relevantDocs.length,
    })
  } catch (error) {
    console.error('Retrieve error:', error)
    return NextResponse.json(
      { error: 'Retrieval failed' },
      { status: 500 }
    )
  }
}
