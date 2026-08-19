import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient, getSessionUser } from '@/lib/resolve-client'
import { MIRA_TOOLS, STANDARD_TOOLS } from '@/lib/tools/catalog'
import { getEnabledTools } from '@/lib/tools/access'
import { getImageQuotaStatus } from '@/lib/image-quota-server'
import { errorMessage } from '@/lib/email-ops/auth'

// Estado del catálogo de Tools para la marca activa: qué tiene abierto, qué
// está en el marketplace, qué ha pedido ya y cómo va de imágenes.
//
// Una sola llamada para toda la sección: la página y el aviso del Estudio leen
// de aquí, así el candado del menú y el de la tarjeta no pueden discrepar.

export async function GET(req: NextRequest) {
  try {
    const access = await resolveRequestClient(req.nextUrl.searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const user = await getSessionUser()
    const isAgency = user?.user_metadata?.plan === 'super_admin'
    const db = adminClient()

    const [enabled, openRequests, quota] = await Promise.all([
      getEnabledTools(access.clientId),
      db.from('tool_requests')
        .select('tool_id,status,created_at')
        .eq('client_id', access.clientId)
        .eq('status', 'new'),
      getImageQuotaStatus(access.clientId).catch(() => null),
    ])

    const requested = new Set((openRequests.data ?? []).map((r: { tool_id: string }) => r.tool_id))
    const standardIds = new Set(STANDARD_TOOLS.map((t) => t.id))

    const tools = MIRA_TOOLS.map((tool) => ({
      id: tool.id,
      // La agencia ve todo abierto: es como demuestra y gestiona los módulos.
      enabled: isAgency || standardIds.has(tool.id) || enabled.has(tool.id),
      requested: requested.has(tool.id),
    }))

    return NextResponse.json({
      tools,
      quota,
      isAgency,
      customRequested: requested.has('custom'),
    })
  } catch (error) {
    console.error('tools GET error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
