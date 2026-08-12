import { adminClient } from '@/lib/supabase'

// Asientos: cuántas personas caben en la cuenta de una marca.
//
// Antes no existía el concepto. Diez personas de un departamento de marketing
// compartirían un único acceso: no se podía tarifar por tamaño de equipo, ni
// saber quién hizo qué, ni revocar a alguien que se va. Para vender a una
// empresa grande eso es descalificatorio, y para vender un plano es la vía de
// fuga más obvia (una cuenta, toda la oficina dentro).
//
// El límite se comprueba aquí y no con una constraint de base de datos porque
// el caso "te has quedado sin asientos" es una CONVERSACIÓN DE VENTA, no un
// error: hay que poder decir cuántos hay, cuántos se usan y qué cuesta el
// siguiente.

export interface SeatUsage {
  used: number
  max: number
  available: number
  full: boolean
  plan: string
  /** Marcas que comparten esta suscripción (Casa de Marcas). Vacío = marca suelta. */
  groupClientIds: string[]
}

/**
 * Uso de asientos de una marca. Si pertenece a un grupo de facturación, los
 * asientos son del GRUPO: en una Casa de Marcas, la misma persona que gestiona
 * tres marcas ocupa un asiento, no tres.
 */
export async function getSeatUsage(clientId: string): Promise<SeatUsage | null> {
  const db = adminClient()
  const { data: client } = await db
    .from('clients')
    .select('id, plan, max_seats, billing_group_id')
    .eq('id', clientId)
    .maybeSingle()
  if (!client) return null

  let clientIds = [client.id]
  if (client.billing_group_id) {
    const { data: siblings } = await db
      .from('clients')
      .select('id')
      .eq('billing_group_id', client.billing_group_id)
    if (siblings?.length) clientIds = siblings.map((s) => s.id)
  }

  const { data: grants } = await db
    .from('mira_project_access')
    .select('user_id')
    .in('project_id', clientIds)

  // Personas DISTINTAS, no filas: quien gestiona tres marcas del grupo ocupa
  // un asiento, no tres.
  const used = new Set((grants || []).map((g) => g.user_id)).size
  const max = client.max_seats ?? 2
  return {
    used,
    max,
    available: Math.max(0, max - used),
    full: used >= max,
    plan: client.plan ?? 'starter',
    groupClientIds: clientIds,
  }
}

export type SeatCheck =
  | { ok: true; usage: SeatUsage }
  | { ok: false; reason: 'no_client' | 'seats_full'; message: string; usage?: SeatUsage }

/**
 * ¿Cabe una persona más? Llamar ANTES de insertar en mira_project_access.
 * Si el usuario YA tiene acceso, no consume asiento nuevo y pasa.
 */
export async function canAddSeat(clientId: string, userId: string): Promise<SeatCheck> {
  const usage = await getSeatUsage(clientId)
  if (!usage) return { ok: false, reason: 'no_client', message: 'Client not found.' }

  const db = adminClient()
  const { data: existing } = await db
    .from('mira_project_access')
    .select('id')
    .in('project_id', usage.groupClientIds)
    .eq('user_id', userId)
    .limit(1)
  if (existing?.length) return { ok: true, usage } // ya dentro: no gasta asiento

  if (usage.full) {
    return {
      ok: false,
      reason: 'seats_full',
      message: `This account is using all ${usage.max} seats. Add a seat to invite one more person.`,
      usage,
    }
  }
  return { ok: true, usage }
}
