import { NextRequest, NextResponse } from 'next/server'
import { getSession, requireAuth } from '@/lib/auth'
import { updateLead, updateCrmContact, getLead, getCrmContact } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    const contactId = params.id

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
    console.error('Update contact error:', error)
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    )
  }
}
