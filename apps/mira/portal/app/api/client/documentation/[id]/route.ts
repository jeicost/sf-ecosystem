import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const id = params.id

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const admin = adminClient()

    // Ownership: cargar el documento y verificar el grant sobre su client_id
    const { data: doc, error: docError } = await admin
      .from('client_documentation')
      .select('id, client_id')
      .eq('id', id)
      .maybeSingle()

    if (docError || !doc) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      )
    }

    if (!(await userCanAccessClient(user, doc.client_id))) {
      return NextResponse.json(
        { error: 'No access to this client' },
        { status: 403 }
      )
    }

    // Soft delete: mark as archived
    const { error } = await admin
      .from('client_documentation')
      .update({ is_archived: true })
      .eq('id', id)

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Delete failed' },
      { status: 500 }
    )
  }
}
