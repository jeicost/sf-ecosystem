// Adapter: marketing-audit → editorial Section[]
// Input contract: overall_score, overall_trend, scoreLabel, statCards[] (6 category
// scores "X/100"), sections[] (cards | eeat_matrix dimensions), quickWins[],
// coherence_check, generatedAt.

import type { Section, StatItem } from '../editorial-template'
import type { ToolAdapter } from './types'
import {
  asArr,
  asNum,
  asObj,
  asStr,
  esc,
  genericSections,
  isPlainObject,
  statusBadge,
  toCards,
  valueToHtml,
} from './generic'

function overviewSection(r: Record<string, any>): Section {
  const stats: StatItem[] = []
  const score = asNum(r.overall_score)
  if (score !== null) {
    stats.push({ value: `${score}/100`, label: asStr(r.scoreLabel) || 'Marketing Health Score' })
  }
  if (asStr(r.overall_trend)) {
    stats.push({ value: asStr(r.overall_trend), label: 'Tendencia 90 días' })
  }

  const section: Section = {
    title: 'Resumen Ejecutivo',
    navLabel: 'Resumen',
    subtitle: 'Puntuación global y desglose por categorías de marketing',
    stats: stats.length ? stats : undefined,
  }

  // Bar chart with the 6 category scores
  const statCards = asArr(r.statCards).filter(isPlainObject)
  const labels: string[] = []
  const data: number[] = []
  for (const c of statCards) {
    const n = asNum(c.value)
    if (n !== null && asStr(c.label)) {
      labels.push(asStr(c.label))
      data.push(n)
    }
  }
  if (labels.length >= 2) {
    section.chart = { type: 'bar', labels, data, label: 'Score por categoría' }
  }

  const cards = statCards
    .filter((c) => asStr(c.description))
    .map((c) => ({
      title: asStr(c.label) || 'Categoría',
      body:
        `<p><strong>${esc(asStr(c.value))}</strong></p>` +
        (asStr(c.status) ? statusBadge(c.status) : '') +
        `<p style="margin-top:8px;">${esc(asStr(c.description))}</p>`,
    }))
  if (cards.length) section.cards = cards

  return section
}

function auditSubSection(sec: Record<string, any>): Section | null {
  const title = asStr(sec.title) || 'Sección'
  const subtitle = asStr(sec.description) || undefined

  const cards = asArr(sec.cards).filter(isPlainObject)
  if (cards.length) {
    return {
      title,
      subtitle,
      cards: cards.map((c) => ({
        title: asStr(c.title) || 'Hallazgo',
        body:
          statusBadge(c.status) +
          `<p style="margin-top:8px;">${esc(asStr(c.content) || asStr(c.description))}</p>`,
      })),
    }
  }

  const dimensions = asArr(sec.dimensions).filter(isPlainObject)
  if (dimensions.length) {
    return {
      title,
      subtitle,
      cards: dimensions.map((d) => ({
        title: asStr(d.name) || 'Dimensión',
        body:
          statusBadge(d.status) +
          `<p style="margin-top:8px;">${esc(asStr(d.content) || asStr(d.description))}</p>`,
      })),
    }
  }

  const rest: Record<string, any> = {}
  for (const [k, v] of Object.entries(sec)) {
    if (k !== 'title' && k !== 'description' && k !== 'type' && k !== 'icon') rest[k] = v
  }
  const fallbackCards = toCards(rest)
  if (fallbackCards.length) return { title, subtitle, cards: fallbackCards }
  return null
}

function quickWinsSection(wins: any[]): Section | null {
  const items = wins.filter(isPlainObject)
  if (!items.length) return null
  return {
    title: 'Quick Wins',
    subtitle: 'Acciones de alto retorno y bajo esfuerzo',
    phases: items.map((w, i) => {
      const num = asStr(w.number) || asStr(w.id) || String(i + 1)
      const parts: string[] = []
      if (asStr(w.description)) parts.push(`<p>${esc(asStr(w.description))}</p>`)
      const meta: string[] = []
      if (asStr(w.effort_tag)) meta.push(`<strong>Esfuerzo:</strong> ${esc(asStr(w.effort_tag))}`)
      if (asStr(w.effort_hours)) meta.push(`<strong>Horas:</strong> ${esc(asStr(w.effort_hours))}`)
      if (asStr(w.impact)) meta.push(`<strong>Impacto:</strong> ${esc(asStr(w.impact))}`)
      if (asStr(w.roi_score)) meta.push(`<strong>ROI:</strong> ${esc(asStr(w.roi_score))}`)
      if (meta.length) parts.push(`<p>${meta.join(' · ')}</p>`)
      return {
        title: `${num}. ${asStr(w.title) || 'Quick Win'}`,
        body: parts.join('') || valueToHtml(w),
      }
    }),
  }
}

function coherenceSection(check: Record<string, any>): Section | null {
  const entries = Object.entries(check)
  if (!entries.length) return null
  const alignLabel = (v: any) => (v === true ? 'Alineado' : v === false ? 'Desalineado' : asStr(v) || '—')
  const cards = [
    { title: 'Pilares', body: statusBadge(alignLabel(check.pillars_aligned)) },
    { title: 'Voz de Marca', body: statusBadge(alignLabel(check.voice_aligned)) },
    { title: 'Posicionamiento', body: statusBadge(alignLabel(check.positioning_aligned)) },
  ].filter((c) => c.body)

  const conflicts = asArr(check.conflicts)
  const section: Section = {
    title: 'Coherencia con Brand Briefing',
    navLabel: 'Coherencia',
    subtitle: 'Validación del marketing actual contra la identidad de marca definida',
  }
  if (cards.length) section.cards = cards
  if (conflicts.length) {
    section.listItems = conflicts.map((c) => `<strong>Conflicto:</strong> ${valueToHtml(c)}`)
  } else {
    section.content = '<p>No se han detectado conflictos entre el marketing actual y el Brand Briefing.</p>'
  }
  return section
}

export const adapter: ToolAdapter = (result) => {
  try {
    const r = asObj(result)
    const sections: Section[] = []
    const used = new Set<string>(['overall_score', 'overall_trend', 'scoreLabel', 'statCards', 'generatedAt'])

    sections.push(overviewSection(r))

    if (Array.isArray(r.sections)) {
      used.add('sections')
      for (const sec of r.sections) {
        if (!isPlainObject(sec)) continue
        try {
          const s = auditSubSection(sec)
          if (s) sections.push(s)
        } catch {
          // skip malformed section
        }
      }
    }

    if (Array.isArray(r.quickWins)) {
      used.add('quickWins')
      const s = quickWinsSection(r.quickWins)
      if (s) sections.push(s)
    }

    if (isPlainObject(r.coherence_check)) {
      used.add('coherence_check')
      const s = coherenceSection(r.coherence_check)
      if (s) sections.push(s)
    }

    sections.push(...genericSections(r, used))
    return sections
  } catch {
    return genericSections(result)
  }
}
