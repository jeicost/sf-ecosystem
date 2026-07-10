import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const id = params.id

    const db = createClient()
    const { data: user } = await db.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Soft delete: mark as archived
    const { error } = await db
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
