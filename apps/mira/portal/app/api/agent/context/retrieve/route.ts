import { NextRequest, NextResponse } from 'next/server'
import { retrieveAgentContext } from '@/lib/agent-context'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'

interface RetrieveContextRequest {
  client_id: string
  context_type?: 'brand' | 'product' | 'community' | 'company' | 'all'
  query?: string
  limit?: number
}

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

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!(await userCanAccessClient(user, client_id))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }

    const result = await retrieveAgentContext({
      client_id,
      context_type,
      query,
      limit,
    })

    if (!result) {
      return NextResponse.json(
        { error: 'Retrieval failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      documents: result.documents,
      total_tokens_used: result.total_tokens_used,
      count: result.count,
    })
  } catch (error) {
    console.error('Retrieve error:', error)
    return NextResponse.json(
      { error: 'Retrieval failed' },
      { status: 500 }
    )
  }
}
