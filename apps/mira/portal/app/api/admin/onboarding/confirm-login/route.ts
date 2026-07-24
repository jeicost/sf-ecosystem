import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/resolve-client'
import { createClientLoginAccess } from '@/lib/onboarding/account'
import { adminClient } from '@/lib/supabase'

// Tier 2 of the onboarding chat -- the only step that requires an explicit
// button click rather than being auto-executed from the model's tool calls.
// Creates the real Supabase Auth user + mira_project_access grant.
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user || user.user_metadata?.plan !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { clientId, email, plan, role, sessionId } = await request.json()
    if (!clientId || !email) {
      return NextResponse.json({ error: 'Missing clientId or email' }, { status: 400 })
    }

    const result = await createClientLoginAccess(clientId, email, plan || 'starter', role || 'owner')

    if (sessionId) {
      const db = adminClient()
      await db.from('onboarding_sessions').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', sessionId)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('admin/onboarding/confirm-login error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create login access' },
      { status: 500 }
    )
  }
}
