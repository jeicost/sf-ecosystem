import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getLeads, getCrmContacts } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || undefined
    const stage = searchParams.get('stage') || undefined
    const limit = Number(searchParams.get('limit')) || 500

    const result =
      session.workspace.type === 'sf'
        ? await getLeads(session.workspace.clientId || '', { search, stage, limit })
        : await getCrmContacts(session.workspace.id, { search, stage, limit })

    return NextResponse.json({ data: result.data, total: result.total })
  } catch (error) {
    console.error('List contacts error:', error)
    return NextResponse.json(
      { error: 'Failed to load contacts' },
      { status: 500 }
    )
  }
}
