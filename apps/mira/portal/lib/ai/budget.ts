import { createServiceClient } from '@/lib/supabase-admin'
import { estimateCostUsdWithCache } from '@/lib/anthropic-client'

// Freno de gasto de la clave de plataforma (Carlos, 6/7-oct-2026).
//
// El 5-oct la API de Anthropic se quedó sin saldo a media tarde y todo lo que
// usa IA en MIRA se paró sin aviso. Dos frenos, los dos sumando mira_usage_log
// (solo used_client_key=false: las claves propias de un cliente son su dinero):
//
//   1. MENSUAL POR CLIENTE (lo que Carlos quiere: «30 $ al mes por usuario»;
//      el usuario que paga es la marca/espacio de trabajo, que es la unidad del
//      registro de uso). Tope por defecto MIRA_CLIENT_MONTHLY_BUDGET_USD (30 $),
//      ajustable por marca en clients.ai_budget_usd (GLS tiene 60: Email Ops
//      lee ~50 correos al día). Al 80 % avisa (huella en mira_activity, aviso
//      en el panel y en el sidebar); al 100 % corta TODO, Email Ops incluido,
//      que vuelve a la cola hasta el mes siguiente. Se enseña en el dashboard.
//   2. DIARIO GLOBAL, red de seguridad (MIRA_DAILY_BUDGET_USD, 100 $): un bucle
//      tonto no puede vaciar la cuenta en una tarde aunque cada cliente vaya
//      por debajo de su mes. Las rutas normales paran al 80 %; Email Ops al 100 %.
//
// Ambos se comprueban ANTES de llamar al modelo, en getClaudeForClient(route).
// Un fallo al leer la telemetría NO bloquea: nunca parar el producto por un bug nuestro.

export const CLIENT_MONTHLY_BUDGET_USD = Number(process.env.MIRA_CLIENT_MONTHLY_BUDGET_USD || 30)
export const DAILY_BUDGET_USD = Number(process.env.MIRA_DAILY_BUDGET_USD || 100)
/** Parte del presupuesto diario que solo Email Ops puede gastar (los correos no esperan). */
export const EMAIL_OPS_RESERVE = 0.2
export const AVISO_PCT = 0.8
export const RUTAS_PRIORITARIAS = ['email-ops-extract']

export class DailyBudgetExceededError extends Error {
  constructor(public spent: number, public limit: number, public route: string) {
    super(`Daily AI budget reached (${spent.toFixed(2)} $ of ${limit} $ today, route ${route}). MIRA ha alcanzado el presupuesto diario de IA; se reanuda mañana. Avisa a Startup Factory si es urgente.`)
    this.name = 'DailyBudgetExceededError'
  }
}

export class MonthlyBudgetExceededError extends Error {
  constructor(public spent: number, public limit: number, public clientId: string) {
    super(`Monthly AI budget reached (${spent.toFixed(2)} $ of ${limit} $ this month for this workspace). Este espacio ha agotado su presupuesto mensual de IA; se reanuda el día 1. Para ampliarlo, habla con Startup Factory.`)
    this.name = 'MonthlyBudgetExceededError'
  }
}

/** Para enseñar un mensaje claro cuando el error viene de un freno, en cualquier ruta. */
export const esErrorDePresupuesto = (msg: string | null | undefined) => !!msg && /AI budget reached/i.test(msg)
export const esErrorDePresupuestoMensual = (msg: string | null | undefined) => !!msg && /Monthly AI budget reached/i.test(msg)

// ─── Fechas en Madrid ─────────────────────────────────────────────────────────

/** Desfase de Madrid respecto a UTC en un instante (CET +1 o CEST +2), en minutos. */
function desfaseMadridMin(ahora: Date): number {
  const partes = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', hour12: false, hour: '2-digit', minute: '2-digit', timeZoneName: 'shortOffset' }).formatToParts(ahora)
  const tz = partes.find((p) => p.type === 'timeZoneName')?.value || 'GMT+1'
  const m = /GMT([+-]\d{1,2})(?::(\d{2}))?/.exec(tz)
  const horas = m ? Number(m[1]) : 1
  const minutos = m && m[2] ? Number(m[2]) * Math.sign(horas || 1) : 0
  return horas * 60 + minutos
}

/** Medianoche de HOY en Madrid, en UTC. El cron de Vercel y Supabase trabajan en UTC; las personas, en Madrid. */
export function inicioDeHoyMadrid(ahora = new Date()): Date {
  const fecha = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora)
  return new Date(new Date(`${fecha}T00:00:00Z`).getTime() - desfaseMadridMin(ahora) * 60_000)
}

/** Día 1 del mes en curso a medianoche de Madrid, en UTC. */
export function inicioDeMesMadrid(ahora = new Date()): Date {
  const [y, m] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit' }).format(ahora).split('-')
  const primero = new Date(`${y}-${m}-01T12:00:00Z`)
  return new Date(new Date(`${y}-${m}-01T00:00:00Z`).getTime() - desfaseMadridMin(primero) * 60_000)
}

/** «2026-10», en Madrid. */
export function mesDe(ahora = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit' }).format(ahora)
}

// ─── Suma de gasto ────────────────────────────────────────────────────────────

interface FilaUso { route: string; model: string; input_tokens: number; output_tokens: number; cache_creation_tokens: number | null; cache_read_tokens: number | null }
export interface Gasto { total: number; porRuta: Record<string, number>; llamadas: number; desde: string }

/** Coste de un conjunto de filas de mira_usage_log, por ruta. Puro: lo prueban los evals. */
export function sumarGasto(filas: FilaUso[], desde: string): Gasto {
  const porRuta: Record<string, number> = {}
  let total = 0
  for (const u of filas) {
    // Las filas de un LOTE (Message Batches API, ruta «…:batch») se facturan a
    // mitad de precio: lo usan las fichas comerciales (lib/comercial/fichas.ts).
    const factor = u.route.endsWith(':batch') ? 0.5 : 1
    const c = factor * estimateCostUsdWithCache(u.model, u.input_tokens, u.output_tokens, u.cache_creation_tokens ?? 0, u.cache_read_tokens ?? 0)
    porRuta[u.route] = (porRuta[u.route] || 0) + c
    total += c
  }
  return { total, porRuta, llamadas: filas.length, desde }
}

async function gastoDesde(desde: Date, clientId?: string): Promise<Gasto | null> {
  try {
    const db = createServiceClient()
    let q = db.from('mira_usage_log')
      .select('route,model,input_tokens,output_tokens,cache_creation_tokens,cache_read_tokens')
      .eq('used_client_key', false).gte('created_at', desde.toISOString()).limit(10000)
    if (clientId) q = q.eq('client_id', clientId)
    const { data, error } = await q
    if (error || !data) return null
    return sumarGasto(data as FilaUso[], desde.toISOString())
  } catch {
    return null
  }
}

/** Lo gastado HOY con la clave de plataforma, todos los clientes. */
export const gastoDeHoy = () => gastoDesde(inicioDeHoyMadrid())
/** Lo gastado ESTE MES por un cliente con la clave de plataforma. */
export const gastoDelMes = (clientId: string) => gastoDesde(inicioDeMesMadrid(), clientId)

// ─── Freno diario global ─────────────────────────────────────────────────────

/** Límite que aplica a una ruta: las prioritarias llegan al 100 %, el resto deja la reserva. */
export function limiteParaRuta(route: string, presupuesto = DAILY_BUDGET_USD): number {
  return RUTAS_PRIORITARIAS.includes(route) ? presupuesto : presupuesto * (1 - EMAIL_OPS_RESERVE)
}

export type EstadoPresupuesto = { gastado: number; limite: number; pct: number; estado: 'ok' | 'aviso' | 'bloqueado'; porRuta: Record<string, number>; llamadas: number }

const redondear = (n: number) => Math.round(n * 100) / 100
function estadoDe(g: Gasto, limite: number): EstadoPresupuesto {
  const pct = limite > 0 ? g.total / limite : 0
  return {
    gastado: redondear(g.total), limite, pct: redondear(pct),
    estado: pct >= 1 ? 'bloqueado' : pct >= AVISO_PCT ? 'aviso' : 'ok',
    porRuta: Object.fromEntries(Object.entries(g.porRuta).map(([k, v]) => [k, redondear(v)])),
    llamadas: g.llamadas,
  }
}

export async function estadoPresupuesto(): Promise<EstadoPresupuesto | null> {
  const g = await gastoDeHoy()
  return g ? estadoDe(g, DAILY_BUDGET_USD) : null
}

/** Una huella por periodo al pasar del 80 %: la lee el panel de la agencia. Nunca lanza. */
async function dejarAviso(route: 'ai-budget' | 'ai-budget-cliente', desde: Date, meta: Record<string, unknown>, clientId?: string): Promise<void> {
  try {
    const db = createServiceClient()
    let q = db.from('mira_activity').select('id', { count: 'exact', head: true }).eq('route', route).gte('created_at', desde.toISOString())
    if (clientId) q = q.eq('client_id', clientId)
    const { count } = await q
    if ((count ?? 0) > 0) return
    await db.from('mira_activity').insert({ kind: 'action', route, client_id: clientId ?? null, meta })
    console.warn(`[${route}] ${JSON.stringify(meta)}`)
  } catch { /* telemetría */ }
}

async function comprobarPresupuestoDiario(route: string): Promise<void> {
  if (!Number.isFinite(DAILY_BUDGET_USD) || DAILY_BUDGET_USD <= 0) return
  const g = await gastoDeHoy()
  if (!g) return
  if (g.total >= DAILY_BUDGET_USD * AVISO_PCT) await dejarAviso('ai-budget', inicioDeHoyMadrid(), { gastado: redondear(g.total), limite: DAILY_BUDGET_USD, pct: AVISO_PCT })
  if (g.total >= limiteParaRuta(route)) throw new DailyBudgetExceededError(g.total, DAILY_BUDGET_USD, route)
}

// ─── Freno mensual por cliente ───────────────────────────────────────────────

export type EstadoPresupuestoCliente = EstadoPresupuesto & { mes: string; porDefecto: boolean }

/** Tope mensual de la marca: clients.ai_budget_usd si está, si no el general. 0 = sin tope (BYO o acuerdo). */
export async function limiteMensualCliente(clientId: string): Promise<{ limite: number; porDefecto: boolean }> {
  try {
    const db = createServiceClient()
    const { data } = await db.from('clients').select('ai_budget_usd').eq('id', clientId).maybeSingle()
    const v = data?.ai_budget_usd
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) return { limite: v, porDefecto: false }
  } catch { /* se usa el general */ }
  return { limite: CLIENT_MONTHLY_BUDGET_USD, porDefecto: true }
}

export async function estadoPresupuestoCliente(clientId: string): Promise<EstadoPresupuestoCliente | null> {
  const [g, lim] = await Promise.all([gastoDelMes(clientId), limiteMensualCliente(clientId)])
  if (!g) return null
  return { ...estadoDe(g, lim.limite), mes: mesDe(), porDefecto: lim.porDefecto }
}

async function comprobarPresupuestoMensual(clientId: string): Promise<void> {
  const lim = await limiteMensualCliente(clientId)
  if (!Number.isFinite(lim.limite) || lim.limite <= 0) return
  const g = await gastoDelMes(clientId)
  if (!g) return
  if (g.total >= lim.limite * AVISO_PCT) await dejarAviso('ai-budget-cliente', inicioDeMesMadrid(), { gastado: redondear(g.total), limite: lim.limite, pct: AVISO_PCT, mes: mesDe() }, clientId)
  if (g.total >= lim.limite) throw new MonthlyBudgetExceededError(g.total, lim.limite, clientId)
}

/**
 * Lanza Monthly/DailyBudgetExceededError si no se puede gastar más. Con la
 * clave del cliente no aplica ninguno. Sin clientId (llamadas de la agencia)
 * solo aplica el diario.
 */
export async function comprobarPresupuesto(route: string, usedClientKey: boolean, clientId?: string | null): Promise<void> {
  if (usedClientKey) return
  if (clientId) await comprobarPresupuestoMensual(clientId)
  await comprobarPresupuestoDiario(route)
}
