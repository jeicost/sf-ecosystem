import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { updateLead, updateCrmContact, getLead, getCrmContact } from '@/lib/db'
import { handleApiError } from '@/lib/api-errors'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id: contactId } = await params

    if (session.workspace.type === 'sf') {
      const lead = await getLead(contactId)
      if (!lead) {
        return NextResponse.json(
          { error: 'Lead not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ data: lead })
    }

    const contact = await getCrmContact(contactId)
    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ data: contact })
  } catch (error) {
    return handleApiError(error, 'Failed to fetch contact')
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    const { id: contactId } = await params

    // Try to update as lead first (SF workspace)
    if (session.workspace.type === 'sf') {
      const lead = await getLead(contactId)
      if (!lead) {
        return NextResponse.json(
          { error: 'Lead not found' },
          { status: 404 }
        )
      }

      const updated = await updateLead(contactId, body)
      return NextResponse.json({ data: updated })
    }

    // Update as CRM contact (other workspaces)
    const contact = await getCrmContact(contactId)
    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    const updated = await updateCrmContact(contactId, body)
    return NextResponse.json({ data: updated })
  } catch (error) {
    return handleApiError(error, 'Failed to update contact')
  }
}
