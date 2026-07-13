import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    }

    const db = createServiceClient()

    // Get all users with access to this client
    const { data: accessRecords } = await db
      .from('mira_project_access')
      .select('user_id, role')
      .eq('project_id', clientId)

    if (!accessRecords || accessRecords.length === 0) {
      return NextResponse.json([])
    }

    // Get user details for each access record
    const userIds = accessRecords.map(r => r.user_id)
    const { data: users } = await db
      .from('auth.users')
      .select('id, email, user_metadata')
      .in('id', userIds)

    const team = (users || []).map(user => {
      const access = accessRecords.find(r => r.user_id === user.id)
      return {
        id: user.id,
        email: user.email,
        role: access?.role || 'member',
        status: 'active',
      }
    })

    return NextResponse.json(team)
  } catch (error) {
    console.error('Error in client-portal team:', error)
    return NextResponse.json([], { status: 200 })
  }
}
