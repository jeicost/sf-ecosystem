import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'

// Espeja el logo subido en el Brand Brain a clients.logo_url (lo consumen el
// sidebar white-label y las plantillas de documentos). Misma dualidad que
// mantiene el onboarding al capturar un logo.
export async function POST(req: NextRequest) {
  try {
    const { url, clientId } = await req.json()
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 })
    }

    const access = await resolveRequestClient(clientId ?? null)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const admin = adminClient()
    const { error } = await admin.from('clients').update({ logo_url: url }).eq('id', access.clientId)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('logo-mirror error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
