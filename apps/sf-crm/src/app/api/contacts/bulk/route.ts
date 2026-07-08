import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { bulkUpdateLeads, bulkUpdateCrmContacts } from '@/lib/db'

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { ids, updates } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty ids array' },
        { status: 400 }
      )
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'Invalid updates object' },
        { status: 400 }
      )
    }

    // Bulk update based on workspace type
    if (session.workspace.type === 'sf') {
      await bulkUpdateLeads(ids, updates)
    } else {
      await bulkUpdateCrmContacts(ids, updates)
    }

    return NextResponse.json({
      success: true,
      updated: ids.length,
    })
  } catch (error) {
    console.error('Bulk update error:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk update' },
      { status: 500 }
    )
  }
}
