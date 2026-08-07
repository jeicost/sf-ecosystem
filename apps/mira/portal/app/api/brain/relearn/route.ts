import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, resolveRequestClient } from '@/lib/resolve-client'
import { relearnBrainFromKnowledge } from '@/lib/brain-tools/relearn'

// Relee todo el conocimiento ya guardado del cliente y propone qué debería
// aprender el Brand Brain. Ver la nota de lib/brain-tools/relearn.ts sobre por
// qué el sync normal no basta.
//
// Solo agencia: cuesta una llamada a Sonnet sobre decenas de miles de
// caracteres, y quien la dispara debería ser quien luego aprueba el resultado.

export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const access = await resolveRequestClient(body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const plan = (await getSessionUser())?.user_metadata?.plan as string | undefined
    if (plan !== 'super_admin' && plan !== 'admin') {
      return NextResponse.json(
        { error: 'Only the agency can trigger a full re-read.' },
        { status: 403 }
      )
    }

    const result = await relearnBrainFromKnowledge(access.clientId)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('brain/relearn failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Re-read failed' },
      { status: 500 }
    )
  }
}
