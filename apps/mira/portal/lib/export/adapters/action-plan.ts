// Adapter: action-plan → editorial Section[]
// Input contract: executive_summary, quarterly_okrs[], 30_day_sprint, 60_day_push,
// 90_day_vision, success_definition, resource_requirements, team_capacity,
// budget_breakdown, kpis[], learning_loops, stakeholder_communication,
// risk_mitigation[], escalation_procedures, mission_alignment, dependencies (+ ids).

import type { Section, StatItem, PhaseItem } from '../editorial-template'
import type { ToolAdapter } from './types'
import {
  asArr,
  asNum,
  asObj,
  asStr,
  esc,
  genericSections,
  humanize,
  isPlainObject,
  sectionForValue,
  valueToHtml,
} from './generic'

const HORIZONS: Array<[string, string]> = [
  ['30_day_sprint', 'Sprint 30 Días'],
  ['60_day_push', 'Push 60 Días'],
  ['90_day_vision', 'Visión 90 Días'],
]

function overviewSection(r: Record<string, any>): Section {
  const stats: StatItem[] = []
  let totalActions = 0
  for (const [key] of HORIZONS) {
    totalActions += asArr(asObj(r[key]).actions).length
  }
  if (totalActions) stats.push({ value: String(totalActions), label: 'Acciones planificadas' })
  const okrs = asArr(r.quarterly_okrs)
  if (okrs.length) stats.push({ value: String(okrs.length), label: 'Trimestres con OKRs' })
  const kpis = asArr(r.kpis)
  if (kpis.length) stats.push({ value: String(kpis.length), label: 'KPIs de seguimiento' })
  const risks = asArr(r.risk_mitigation)
  if (risks.length) stats.push({ value: String(risks.length), label: 'Riesgos identificados' })

  const section: Section = {
    title: 'Resumen Ejecutivo',
    navLabel: 'Resumen',
    subtitle: 'Plan de ejecución 30/60/90 días alineado con la misión de marca',
    stats: stats.length ? stats : undefined,
  }
  if (asStr(r.executive_summary)) {
    section.content = asStr(r.executive_summary)
      .split(/\n{2,}/)
      .map((p) => `<p>${esc(p)}</p>`)
      .join('')
  }
  return section
}

function okrsSection(r: Record<string, any>): Section | null {
  const okrs = asArr(r.quarterly_okrs).filter(isPlainObject)
  if (!okrs.length) return null
  return {
    title: 'OKRs Trimestrales',
    navLabel: 'OKRs',
    phases: okrs.map((o, i) => ({
      title: `Q${asStr(o.q) || String(i + 1)}`,
      body: valueToHtml(o.objectives) || valueToHtml(o),
    })),
  }
}

function horizonPhase(key: string, title: string, r: Record<string, any>): PhaseItem | null {
  const h = asObj(r[key])
  if (!Object.keys(h).length) return null
  const parts: string[] = []
  if (asStr(h.focus)) parts.push(`<p><strong>Foco:</strong> ${esc(asStr(h.focus))}</p>`)
  const milestones = asArr(h.weekly_milestones)
  if (milestones.length) {
    parts.push(`<p style="margin-top:8px;"><strong>Hitos semanales:</strong></p>${valueToHtml(milestones)}`)
  }
  const actions = asArr(h.actions)
  if (actions.length) {
    const items = actions
      .map((a) => {
        if (!isPlainObject(a)) return valueToHtml(a)
        const meta = [
          asStr(a.owner) ? `Responsable: ${esc(asStr(a.owner))}` : '',
          asStr(a.effort) ? `Esfuerzo: ${esc(asStr(a.effort))}` : '',
          asStr(a.metric) ? `Métrica: ${esc(asStr(a.metric))}` : '',
        ]
          .filter(Boolean)
          .join(' · ')
        return `<strong>${esc(asStr(a.title) || 'Acción')}</strong>${meta ? ` — ${meta}` : ''}`
      })
      .filter(Boolean)
      .map((li) => `<li>${li}</li>`)
      .join('')
    if (items) parts.push(`<p style="margin-top:8px;"><strong>Acciones:</strong></p><ul>${items}</ul>`)
  }
  if (!parts.length) {
    const body = valueToHtml(h)
    if (!body) return null
    return { title, body }
  }
  return { title, body: parts.join('') }
}

function roadmapSection(r: Record<string, any>): Section | null {
  const phases = HORIZONS.map(([key, title]) => horizonPhase(key, title, r)).filter(
    (p): p is PhaseItem => p !== null
  )
  if (!phases.length) return null
  return {
    title: 'Plan 30 / 60 / 90 Días',
    navLabel: '30/60/90',
    subtitle: 'Roadmap de ejecución por horizonte temporal',
    phases,
  }
}

function budgetSection(r: Record<string, any>): Section | null {
  const rr = asObj(r.resource_requirements)
  const bb = asObj(r.budget_breakdown)
  if (!Object.keys(rr).length && !Object.keys(bb).length) return null

  const section: Section = {
    title: 'Recursos y Presupuesto',
    navLabel: 'Recursos',
  }
  const cards = [
    { title: 'Equipo', body: valueToHtml(rr.team) },
    { title: 'Presupuesto', body: valueToHtml(rr.budget) },
    { title: 'Herramientas', body: valueToHtml(rr.tools) },
  ].filter((c) => c.body)
  if (Object.keys(bb).length) {
    // Doughnut chart if the budget breakdown values parse to numbers
    const labels: string[] = []
    const data: number[] = []
    for (const [k, v] of Object.entries(bb)) {
      const n = asNum(v)
      if (n !== null && n > 0) {
        labels.push(humanize(k))
        data.push(n)
      }
    }
    if (labels.length >= 2) {
      section.chart = { type: 'doughnut', labels, data, label: 'Desglose de presupuesto' }
    } else {
      const body = valueToHtml(bb)
      if (body) cards.push({ title: 'Desglose de Presupuesto', body })
    }
  }
  if (cards.length) section.cards = cards
  if (!section.cards && !section.chart) return null
  return section
}

function kpisSection(r: Record<string, any>): Section | null {
  const kpis = asArr(r.kpis).filter(isPlainObject)
  if (!kpis.length) return null
  return {
    title: 'KPIs y Seguimiento',
    navLabel: 'KPIs',
    table: {
      headers: ['Métrica', 'Objetivo', 'Tracking'],
      rows: kpis.map((k) => [
        `<strong>${esc(asStr(k.metric) || asStr(k.name) || 'KPI')}</strong>`,
        valueToHtml(k.target),
        valueToHtml(k.tracking),
      ]),
    },
  }
}

function risksSection(r: Record<string, any>): Section | null {
  const risks = asArr(r.risk_mitigation).filter(isPlainObject)
  if (!risks.length) return null
  return {
    title: 'Riesgos y Mitigación',
    navLabel: 'Riesgos',
    table: {
      headers: ['Riesgo', 'Probabilidad', 'Impacto', 'Mitigación'],
      rows: risks.map((k) => [
        `<strong>${esc(asStr(k.risk))}</strong>`,
        valueToHtml(k.probability),
        valueToHtml(k.impact),
        valueToHtml(k.mitigation),
      ]),
    },
  }
}

export const adapter: ToolAdapter = (result) => {
  try {
    const r = asObj(result)
    const sections: Section[] = []
    const used = new Set<string>([
      'brand_briefing_id',
      'marketing_audit_id',
      'content_pack_id',
      'dependencies',
      'mission_alignment',
      'executive_summary',
      'quarterly_okrs',
      '30_day_sprint',
      '60_day_push',
      '90_day_vision',
      'resource_requirements',
      'budget_breakdown',
      'kpis',
      'risk_mitigation',
    ])

    sections.push(overviewSection(r))
    const parts = [okrsSection(r), roadmapSection(r), budgetSection(r), kpisSection(r), risksSection(r)]
    for (const s of parts) if (s) sections.push(s)

    const mapped: Array<[string, string]> = [
      ['success_definition', 'Definición de Éxito'],
      ['team_capacity', 'Capacidad del Equipo'],
      ['learning_loops', 'Ciclos de Aprendizaje'],
      ['stakeholder_communication', 'Comunicación con Stakeholders'],
      ['escalation_procedures', 'Procedimientos de Escalado'],
    ]
    for (const [key, title] of mapped) {
      used.add(key)
      const s = sectionForValue(key, r[key])
      if (s) sections.push({ ...s, title })
    }

    // Mission alignment warnings, only if something is off
    const alignment = asObj(r.mission_alignment)
    const misaligned = Object.entries(alignment).filter(([, v]) => asStr(v) && asStr(v) !== 'aligned')
    if (misaligned.length) {
      sections.push({
        title: 'Alineación con la Misión',
        subtitle: 'OKRs que requieren revisión frente a la misión de marca',
        listItems: misaligned.map(
          ([k, v]) => `<strong>${esc(humanize(k))}:</strong> ${esc(asStr(v))}`
        ),
      })
    }

    sections.push(...genericSections(r, used))
    return sections
  } catch {
    return genericSections(result)
  }
}
