// El planificador: de la frase del cliente al árbol de tareas con fechas.
//
// «Esta semana 3 posts y 2 newsletters con sus dos playbooks» → una spec
// estructurada + N tareas, cada una con su día de generación y, si es hija,
// su madre. Es lo único de todo el sistema que decide QUÉ hacer; el ejecutor
// solo obedece.
//
// Decisiones del CEO que este fichero encarna:
//  · El planificador es de Claude con el Cerebro delante: si el cliente no
//    tiene pilares, no se los inventa — lo dice y para.
//  · Las piezas se generan el DÍA ANTERIOR a las 06:00 (hora del cliente).
//  · Las hijas (playbook de una newsletter) se emparejan con una madre y no se
//    generan hasta que la madre esté aprobada. Aquí solo se declara la
//    relación; el ejecutor la respeta.
//  · El techo: si la spec pide más generaciones de las que caben en el cap del
//    mes, se rechaza el plan con el número, no se recorta en silencio.

import { createMessageForClient } from '@/lib/anthropic-client'
import { fetchBrandBrain, formatBrandBrainForPrompt } from '@/lib/brand-brain'
import { extractJson } from '@/lib/generation/extract-json'
import { GOAL_KINDS, type GoalKind, type GoalPlan, type GoalSpec, type GoalSpecItem, type PlannedTask } from './types'

export class GoalPlanningError extends Error {
  constructor(message: string, public readonly code: 'no_brain' | 'no_pillars' | 'bad_spec' | 'over_cap' | 'model') {
    super(message)
    this.name = 'GoalPlanningError'
  }
}

const GEN_HOUR_LOCAL = 6 // 06:00 hora del cliente, el día anterior

/** Cuenta cuántas generaciones pide una spec (para el techo). */
export function specGenerationCount(spec: GoalSpec): number {
  return spec.items.reduce((n, it) => n + Math.max(0, it.count | 0), 0)
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Reparte N piezas de un kind entre los días laborables del periodo, en orden. */
function spreadDays(periodStart: string, periodEnd: string, n: number): string[] {
  const days: string[] = []
  const d = new Date(`${periodStart}T00:00:00Z`)
  const end = new Date(`${periodEnd}T00:00:00Z`)
  while (d <= end) {
    const wd = d.getUTCDay()
    if (wd !== 0 && wd !== 6) days.push(isoDate(d))
    d.setUTCDate(d.getUTCDate() + 1)
  }
  if (!days.length) days.push(periodStart)
  const out: string[] = []
  for (let i = 0; i < n; i++) out.push(days[Math.floor((i * days.length) / Math.max(n, 1))] ?? days[days.length - 1])
  return out
}

/** «El día anterior a las 06:00» en la zona del cliente → ISO UTC. */
function generationInstant(publishDay: string, tz: string): string {
  // Se calcula en la zona del cliente y se pasa a UTC. Sin librerías: se
  // toma el offset que tiene esa zona ese día usando Intl.
  const dayBefore = new Date(`${publishDay}T00:00:00Z`)
  dayBefore.setUTCDate(dayBefore.getUTCDate() - 1)
  const y = dayBefore.getUTCFullYear(), m = dayBefore.getUTCMonth(), day = dayBefore.getUTCDate()
  const probe = new Date(Date.UTC(y, m, day, GEN_HOUR_LOCAL, 0, 0))
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false, timeZoneName: 'shortOffset' }).formatToParts(probe)
    const off = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+0'
    const mm = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(off)
    const sign = mm?.[1] === '-' ? -1 : 1
    const oh = Number(mm?.[2] ?? 0), om = Number(mm?.[3] ?? 0)
    const offsetMin = sign * (oh * 60 + om)
    return new Date(probe.getTime() - offsetMin * 60_000).toISOString()
  } catch {
    return probe.toISOString()
  }
}

/** Convierte una spec confirmada en tareas con fechas y parentesco. Puro y determinista. */
export function specToTasks(spec: GoalSpec, periodStart: string, periodEnd: string, tz = 'Europe/Madrid'): PlannedTask[] {
  const tasks: PlannedTask[] = []
  let position = 0
  // Primero las raíces, para poder emparejar hijas después.
  const roots = spec.items.filter((it) => !it.for)
  const children = spec.items.filter((it) => it.for)
  const rootPositionsByKind: Record<string, number[]> = {}

  for (const it of roots) {
    const days = spreadDays(periodStart, periodEnd, it.count)
    for (let i = 0; i < it.count; i++) {
      tasks.push({
        kind: it.kind,
        action_id: GOAL_KINDS[it.kind].action,
        position,
        scheduled_for: generationInstant(days[i], tz),
        parent_position: null,
        params: { pillar: it.pillar ?? null, platform: it.platform ?? null, topic: it.topic ?? null },
      })
      ;(rootPositionsByKind[it.kind] ??= []).push(position)
      position++
    }
  }
  for (const it of children) {
    const parents = rootPositionsByKind[it.for as string] ?? []
    if (!parents.length) {
      throw new GoalPlanningError(`«${GOAL_KINDS[it.kind].label}» depends on «${it.for}» but the plan has none.`, 'bad_spec')
    }
    for (let i = 0; i < it.count; i++) {
      const parentPos = parents[i % parents.length]
      const parent = tasks[parentPos]
      tasks.push({
        kind: it.kind,
        action_id: GOAL_KINDS[it.kind].action,
        position,
        // La hija se programa para el mismo instante que la madre: no se
        // generará hasta que la madre esté aprobada de todos modos.
        scheduled_for: parent.scheduled_for,
        parent_position: parentPos,
        params: { pillar: it.pillar ?? parent.params.pillar ?? null, platform: it.platform ?? null, topic: it.topic ?? null, from_parent: 'copy' },
      })
      position++
    }
  }
  return tasks
}

const PLANNER_PROMPT = (brief: string, brainBlock: string, pillars: string[], periodStart: string, periodEnd: string, kinds: string) => `You are the content operations planner for this brand. Turn the client's request into a structured weekly content goal.

CLIENT REQUEST (verbatim):
"""${brief}"""

PERIOD: ${periodStart} to ${periodEnd} (inclusive).

REGISTERED CONTENT PILLARS (use ONLY these names, exactly as written):
${pillars.map((p) => `- ${p}`).join('\n')}

PIECE KINDS YOU CAN PLAN (use ONLY these keys):
${kinds}

${brainBlock}

RULES
- Every item must map to one of the piece kinds above. If the request asks for something else, put it in "notes" and do not invent a kind.
- Child pieces (playbook, carousel, video_brief, onepager) can be tied to a parent kind with "for". "2 playbooks for the newsletters" → {"kind":"playbook","count":2,"for":"newsletter"}.
- Assign a pillar to each root item when the request implies one; otherwise leave pillar null and let the executor rotate pillars.
- Keep counts exactly as requested. Do not add pieces the client did not ask for.
- "title" is short ("Week 34", "Launch week"). "rationale" is 1-3 sentences telling the client how you read the request and anything they should double-check before confirming.

Return ONLY this JSON:
{
  "title": "…",
  "rationale": "…",
  "spec": {
    "items": [ {"kind":"post","count":3,"pillar":"…"|null,"platform":"instagram"|null,"for":null,"topic":null} ],
    "notes": null
  }
}`

/**
 * Frase → plan (spec + tareas + fechas). NO escribe en base de datos: el
 * humano tiene que ver el plan y confirmarlo. Lanza GoalPlanningError con
 * código para que la UI diga exactamente qué falta.
 */
export async function planGoal(opts: {
  clientId: string
  brief: string
  periodStart: string
  periodEnd: string
  timezone?: string
  monthlyCap?: number | null
  alreadyUsedThisMonth?: number
}): Promise<GoalPlan> {
  const brain = await fetchBrandBrain(opts.clientId)
  if (!brain) throw new GoalPlanningError('This client has no Brand Brain yet.', 'no_brain')
  const pillars = (brain.pillars ?? []).map((p) => p.name).filter((n): n is string => Boolean(n && n.trim()))
  if (!pillars.length) {
    // Decisión de diseño: sin pilares no se planifica. La UI ofrece «Propose
    // with AI» del Cerebro (M1) — no se inventan aquí.
    throw new GoalPlanningError('This client has no content pillars. Propose them in the Brand Brain first.', 'no_pillars')
  }

  const kinds = Object.entries(GOAL_KINDS).map(([k, v]) => `- ${k}: ${v.label}${v.canBeChild ? ' (can be a child of another piece)' : ''}`).join('\n')
  const prompt = PLANNER_PROMPT(opts.brief, formatBrandBrainForPrompt(brain), pillars, opts.periodStart, opts.periodEnd, kinds)

  let raw: unknown
  try {
    const msg = await createMessageForClient(opts.clientId, 'goals/plan', {
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })
    const block = msg.content[0]
    raw = extractJson(block && 'text' in block ? block.text : '')
  } catch (e) {
    throw new GoalPlanningError(`The planner could not read the request: ${e instanceof Error ? e.message : String(e)}`, 'model')
  }

  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>
  const items: GoalSpecItem[] = Array.isArray(r.spec?.items)
    ? r.spec.items
        .map((it: any): GoalSpecItem | null => {
          const kind = String(it?.kind ?? '') as GoalKind
          if (!(kind in GOAL_KINDS)) return null
          const count = Math.max(0, Math.min(40, Number(it?.count) | 0))
          if (!count) return null
          const forKind = it?.for && String(it.for) in GOAL_KINDS ? (String(it.for) as GoalKind) : null
          const pillar = typeof it?.pillar === 'string' && pillars.includes(it.pillar) ? it.pillar : null
          return { kind, count, pillar, platform: it?.platform ?? null, for: forKind, topic: it?.topic ?? null }
        })
        .filter(Boolean) as GoalSpecItem[]
    : []
  if (!items.length) throw new GoalPlanningError('The planner produced no valid pieces from the request.', 'bad_spec')

  const spec: GoalSpec = { items, notes: typeof r.spec?.notes === 'string' ? r.spec.notes : null }

  // El techo, ANTES de confirmar nada. Decisión CEO: no se recorta en
  // silencio, se rechaza con el número.
  if (opts.monthlyCap != null) {
    const wanted = specGenerationCount(spec)
    const room = Math.max(0, opts.monthlyCap - (opts.alreadyUsedThisMonth ?? 0))
    if (wanted > room) {
      throw new GoalPlanningError(`This goal needs ${wanted} generations but only ${room} remain in this month's cap (${opts.monthlyCap}).`, 'over_cap')
    }
  }

  const tasks = specToTasks(spec, opts.periodStart, opts.periodEnd, opts.timezone ?? 'Europe/Madrid')
  return {
    title: typeof r.title === 'string' && r.title.trim() ? r.title.trim().slice(0, 80) : `Goal ${opts.periodStart}`,
    rationale: typeof r.rationale === 'string' ? r.rationale.trim() : '',
    spec,
    period_start: opts.periodStart,
    period_end: opts.periodEnd,
    tasks,
  }
}
