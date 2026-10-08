import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'
import { isMicrosoftConfigured } from '@/lib/microsoft/graph'
import { listConnections, disconnectConnection } from '@/lib/microsoft/connections'

export const runtime = 'nodejs'

/**
 * GET /api/integrations/microsoft/connections?clientId=
 * Cuentas de Microsoft 365 conectadas a la marca (sin tokens).
 */
export async function GET(req: NextRequest) {
  try {
    const access = await resolveRequestClient(new URL(req.url).searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const connections = await listConnections(adminClient(), access.clientId)
    return NextResponse.json({ configured: isMicrosoftConfigured(), connections })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

/**
 * DELETE /api/integrations/microsoft/connections?clientId=&id=
 * Desconecta una cuenta: borra sus tokens, sus carpetas y su cola; desactiva
 * los buzones que dependían de ella. Los documentos ya ingeridos se conservan.
 */
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const access = await resolveRequestClient(url.searchParams.get('clientId'), { strict: true })
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const result = await disconnectConnection(adminClient(), access.clientId, id)
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
