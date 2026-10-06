import { createServiceClient } from '@/lib/supabase-admin'
import { estimateCostUsdWithCache } from '@/lib/anthropic-client'

// Freno de gasto diario de la clave de plataforma (Carlos, 6-oct-2026).
//
// El 5-oct la API de Anthropic se quedó sin saldo a media tarde y todo lo que
// usa IA en MIRA se paró sin aviso: el chat de licitaciones, Email Ops, las
// generaciones. Aquí se suma lo gastado HOY (hora de Madrid) con la clave de
// plataforma a partir de mira_usage_log y se corta ANTES de llamar al modelo:
//   · las rutas normales se bloquean al llegar al presupuesto menos la reserva
//     de Email Ops (los correos de operaciones no pueden esperar a mañana);
//   · Email Ops se bloquea solo al 100 %.
// Al 80 % se deja una huella en mira_activity (una por día) que el panel de la
// agencia enseña. Las claves propias de un cliente (BYO) no se frenan: es su
// dinero.
//
// La suma se calcula con los precios de lib/anthropic-client.ts, que ya
// distinguen entrada, salida y caché. Un fallo al leer la telemetría NO
// bloquea: nunca parar el producto por un bug nuestro.

export const DAILY_BUDGET_USD = Number(process.env.MIRA_DAILY_BUDGET_USD || 30)
/** Parte del presupuesto que solo Email Ops puede gastar (los correos no esperan). */
export const EMAIL_OPS_RESERVE = 0.2
export const AVISO_PCT = 0.8
export const RUTAS_PRIORITARIAS = ['email-ops-extract']

export class DailyBudgetExceededError extends Error {
  constructor(public spent: number, public limit: number, public route: string) {
    super(`Daily AI budget reached (${spent.toFixed(2)} $ of ${limit} $ today, route ${route}). MIRA ha alcanzado el presupuesto diario de IA; se reanuda mañana. Avisa a Startup Factory si es urgente.`)
    this.name = 'DailyBudgetExceededError'
  }
}

/** Medianoche de HOY en Madrid, en UTC. El cron de Vercel y Supabase trabajan en UTC; las personas, en Madrid. */
export function inicioDeHoyMadrid(ahora = new Date()): Date {
  const fecha = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora)
  // Desfase real de Madrid hoy (CET o CEST), sin tabla de cambios de hora.
  const partes = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', hour12: false, hour: '2-digit', minute: '2-digit', timeZoneName: 'shortOffset' }).formatToParts(ahora)
  const tz = partes.find((p) => p.type === 'timeZoneName')?.value || 'GMT+1'
  const m = /GMT([+-]\d{1,2})(?::(\d{2}))?/.exec(tz)
  const horas = m ? Number(m[1]) : 1
  const minutos = m && m[2] ? Number(m[2]) * Math.sign(horas || 1) : 0
  return new Date(new Date(`${fecha}T00:00:00Z`).getTime() - (horas * 60 + minutos) * 60_000)
}

/** Límite que aplica a una ruta: las prioritarias llegan al 100 %, el resto deja la reserva. */
export function limiteParaRuta(route: string, presupuesto = DAILY_BUDGET_USD): number {
  return RUTAS_PRIORITARIAS.includes(route) ? presupuesto : presupuesto * (1 - EMAIL_OPS_RESERVE)
}

export interface GastoHoy { total: number; porRuta: Record<string, number>; llamadas: number; desde: string }

interface FilaUso { route: string; model: string; input_tokens: number; output_tokens: number; cache_creation_tokens: number | null; cache_read_tokens: number | null }

/** Coste de un conjunto de filas de mira_usage_log, por ruta. Puro: lo prueban los evals. */
export function sumarGasto(filas: FilaUso[], desde: string): GastoHoy {
  const porRuta: Record<string, number> = {}
  let total = 0
  for (const u of filas) {
    const c = estimateCostUsdWithCache(u.model, u.input_tokens, u.output_tokens, u.cache_creation_tokens ?? 0, u.cache_read_tokens ?? 0)
    porRuta[u.route] = (porRuta[u.route] || 0) + c
    total += c
  }
  return { total, porRuta, llamadas: filas.length, desde }
}

export async function gastoDeHoy(): Promise<GastoHoy | null> {
  try {
    const desde = inicioDeHoyMadrid().toISOString()
    const db = createServiceClient()
    const { data, error } = await db.from('mira_usage_log')
      .select('route,model,input_tokens,output_tokens,cache_creation_tokens,cache_read_tokens')
      .eq('used_client_key', false).gte('created_at', desde).limit(5000)
    if (error || !data) return null
    return sumarGasto(data as FilaUso[], desde)
  } catch {
    return null
  }
}

export type EstadoPresupuesto = { gastado: number; limite: number; pct: number; estado: 'ok' | 'aviso' | 'bloqueado'; porRuta: Record<string, number>; llamadas: number }

export async function estadoPresupuesto(): Promise<EstadoPresupuesto | null> {
  const g = await gastoDeHoy()
  if (!g) return null
  const pct = DAILY_BUDGET_USD > 0 ? g.total / DAILY_BUDGET_USD : 0
  return {
    gastado: Math.round(g.total * 100) / 100, limite: DAILY_BUDGET_USD, pct: Math.round(pct * 100) / 100,
    estado: pct >= 1 ? 'bloqueado' : pct >= AVISO_PCT ? 'aviso' : 'ok',
    porRuta: Object.fromEntries(Object.entries(g.porRuta).map(([k, v]) => [k, Math.round(v * 100) / 100])),
    llamadas: g.llamadas,
  }
}

/** Una huella por día al pasar del 80 %: la lee el panel de la agencia. Nunca lanza. */
async function dejarAviso(gastado: number): Promise<void> {
  try {
    const db = createServiceClient()
    const desde = inicioDeHoyMadrid().toISOString()
    const { count } = await db.from('mira_activity').select('id', { count: 'exact', head: true }).eq('route', 'ai-budget').gte('created_at', desde)
    if ((count ?? 0) > 0) return
    await db.from('mira_activity').insert({ kind: 'action', route: 'ai-budget', meta: { gastado: Math.round(gastado * 100) / 100, limite: DAILY_BUDGET_USD, pct: AVISO_PCT } })
    console.warn(`[ai-budget] ${Math.round((gastado / DAILY_BUDGET_USD) * 100)} % del presupuesto diario de IA (${gastado.toFixed(2)} $ de ${DAILY_BUDGET_USD} $)`)
  } catch { /* telemetría */ }
}

/**
 * Lanza DailyBudgetExceededError si la ruta no puede gastar más hoy. Con la
 * clave del cliente no aplica. Sin presupuesto configurado (0 o no numérico)
 * no hace nada.
 */
export async function comprobarPresupuesto(route: string, usedClientKey: boolean): Promise<void> {
  if (usedClientKey) return
  if (!Number.isFinite(DAILY_BUDGET_USD) || DAILY_BUDGET_USD <= 0) return
  const g = await gastoDeHoy()
  if (!g) return
  if (g.total >= DAILY_BUDGET_USD * AVISO_PCT) await dejarAviso(g.total)
  if (g.total >= limiteParaRuta(route)) throw new DailyBudgetExceededError(g.total, DAILY_BUDGET_USD, route)
}

/** Para enseñar un mensaje claro cuando el error viene del freno (o del saldo), en cualquier ruta. */
export const esErrorDePresupuesto = (msg: string | null | undefined) => !!msg && /Daily AI budget/i.test(msg)
