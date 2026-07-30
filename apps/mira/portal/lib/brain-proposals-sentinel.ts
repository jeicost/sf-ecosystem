// Vista agregada cross-cliente de propuestas pendientes del Brand Brain
// (Fase 2, 2026-07-30). Mismo patrón WorkspaceStatus<T> ya usado en
// lib/sentinel-data.ts -- aquí la unidad no es un cliente individual sino
// TODOS los clientes con propuestas pendientes, para que la agencia no
// dependa de entrar cliente por cliente a /brand-brain para descubrirlas
// (riesgo de acumulación silenciosa ya confirmado en el diseño de la Fase 1).

import { adminClient } from '@/lib/supabase'
import { WorkspaceStatus, workspaceError } from '@/lib/archetype-workspace'

export interface ClientProposalsSummary {
  clientId: string
  clientName: string
  pendingCount: number
  oldestPendingAt: string
}

export async function fetchProposalsSummary(
  admin: ReturnType<typeof adminClient>
): Promise<WorkspaceStatus<ClientProposalsSummary[]>> {
  const { data, error } = await admin
    .from('brain_change_proposals')
    .select('client_id, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) return workspaceError(error.message)
  if (!data?.length) return { status: 'empty' }

  const byClient = new Map<string, { count: number; oldest: string }>()
  for (const row of data) {
    const existing = byClient.get(row.client_id)
    if (existing) {
      existing.count++
    } else {
      byClient.set(row.client_id, { count: 1, oldest: row.created_at })
    }
  }

  const clientIds = [...byClient.keys()]
  const { data: clients } = await admin.from('clients').select('id, name').in('id', clientIds)
  const nameById = new Map((clients ?? []).map((c) => [c.id as string, c.name as string]))

  const summary: ClientProposalsSummary[] = clientIds
    .map((clientId) => {
      const entry = byClient.get(clientId)!
      return {
        clientId,
        clientName: nameById.get(clientId) ?? 'Cliente desconocido',
        pendingCount: entry.count,
        oldestPendingAt: entry.oldest,
      }
    })
    .sort((a, b) => b.pendingCount - a.pendingCount)

  return { status: 'ready', data: summary }
}
