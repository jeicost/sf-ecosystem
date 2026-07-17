import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getOutreachEmails } from '@/lib/db'
import { handleApiError } from '@/lib/api-errors'

export async function GET() {
  try {
    const session = await requireAuth()
    const data = await getOutreachEmails(session.workspace.id)
    return NextResponse.json({ data })
  } catch (error) {
    return handleApiError(error, 'Failed to fetch outreach emails')
  }
}
