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

    // Sin asientos libres no es un error del sistema, es un tope de plan: 409
    // para que la UI pueda ofrecer ampliar en vez de enseñar un fallo genérico.
    if ('error' in result) {
      return NextResponse.json(result, { status: result.reason === 'seats_full' ? 409 : 500 })
    }

    // El alta solo se da por terminada si el acceso se creó de verdad. Antes se
    // marcaba 'completed' pasara lo que pasara, y la sesión quedaba cerrada
    // sobre un cliente sin nadie que pudiera entrar.
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
