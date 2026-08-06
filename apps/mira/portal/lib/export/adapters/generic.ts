// Generic adapter + shared defensive helpers for all toolkit adapters.
// Converts ANY JSON object into readable editorial sections without ever throwing.

import type { Section, CardItem, TableData } from '../editorial-template'
import type { ToolAdapter } from './types'

// ---------------------------------------------------------------------------
// Primitive helpers
// ---------------------------------------------------------------------------

/** HTML-escape any value coming from data. */
export function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function isPlainObject(v: any): v is Record<string, any> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

/** Safe string coercion — primitives only, objects/arrays become ''. */
export function asStr(v: any): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return ''
}

/** Safe array coercion. A lone value becomes []; use asArrOrWrap to wrap. */
export function asArr(v: any): any[] {
  return Array.isArray(v) ? v : []
}

/** Array coercion that tolerates a single string/object where an array was expected. */
export function asArrOrWrap(v: any): any[] {
  if (Array.isArray(v)) return v
  if (v === null || v === undefined || v === '') return []
  return [v]
}

/** Safe object coercion. */
export function asObj(v: any): Record<string, any> {
  return isPlainObject(v) ? v : {}
}

/** Extract the first number found in a value ("72/100" → 72, "+8 pts" → 8). */
export function asNum(v: any): number | null {
  if (typeof v === 'number' && isFinite(v)) return v
  if (typeof v === 'string') {
    const m = v.match(/-?\d+(?:[.,]\d+)?/)
    if (m && m[0]) {
      const n = parseFloat(m[0].replace(',', '.'))
      if (isFinite(n)) return n
    }
  }
  return null
}

/** Format a ratio (0.05) or number as a percentage string when it looks like one. */
export function asPct(v: any): string {
  const n = asNum(v)
  if (n === null) return asStr(v)
  if (n > 0 && n <= 1) return `${Math.round(n * 1000) / 10}%`
  return String(n)
}

/** snake_case / camelCase / kebab-case → Title Case ("week_1" → "Week 1"). */
export function humanize(key: string): string {
  const spaced = String(key ?? '')
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
  if (!spaced) return ''
  return spaced
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')
}

// ---------------------------------------------------------------------------
// Value → HTML rendering
// ---------------------------------------------------------------------------

/** Render any value as safe HTML (recursive, depth-limited, never throws). */
export function valueToHtml(v: any, depth: number = 0): string {
  try {
    if (v === null || v === undefined || depth > 4) return ''
    if (typeof v === 'string') return esc(v)
    if (typeof v === 'number' || typeof v === 'boolean') return esc(String(v))
    if (Array.isArray(v)) {
      const items = v
        .map((item) => valueToHtml(item, depth + 1))
        .filter(Boolean)
        .map((html) => `<li>${html}</li>`)
        .join('')
      return items ? `<ul>${items}</ul>` : ''
    }
    if (isPlainObject(v)) {
      const items = Object.entries(v)
        .filter(([, val]) => val !== null && val !== undefined && val !== '')
        .map(([k, val]) => {
          const html = valueToHtml(val, depth + 1)
          return html ? `<li><strong>${esc(humanize(k))}:</strong> ${html}</li>` : ''
        })
        .filter(Boolean)
        .join('')
      return items ? `<ul>${items}</ul>` : ''
    }
    return ''
  } catch {
    return ''
  }
}

/** Render a status string as a colored badge (green / amber / red-ish). */
export function statusBadge(v: any): string {
  const s = asStr(v)
  if (!s) return ''
  const low = s.toLowerCase()
  const good = ['ok', 'perfect', 'good', 'strong', 'active', 'aligned', 'present', 'verified', 'live', 'done']
  const bad = ['critical', 'critico', 'crítico', 'falta', 'missing', 'fail', 'error', 'weak', 'misaligned']
  if (bad.some((k) => low.includes(k))) {
    return `<span class="badge" style="background:rgba(239,68,68,0.2);color:#F87171;">${esc(s)}</span>`
  }
  if (good.some((k) => low.includes(k))) {
    return `<span class="badge badge-live">${esc(s)}</span>`
  }
  return `<span class="badge badge-progress">${esc(s)}</span>`
}

// ---------------------------------------------------------------------------
// Structured builders
// ---------------------------------------------------------------------------

/** Object → CardItem[] (one card per key, HTML body). */
export function toCards(obj: any): CardItem[] {
  if (!isPlainObject(obj)) return []
  try {
    return Object.entries(obj)
      .map(([k, v]): CardItem => ({ title: humanize(k), body: valueToHtml(v) }))
      .filter((c) => c.body)
  } catch {
    return []
  }
}

/** Array of objects → TableData (headers = union of keys). */
export function toTable(arr: any): TableData | undefined {
  try {
    const objs = asArr(arr).filter(isPlainObject)
    if (objs.length === 0) return undefined
    const keys: string[] = []
    for (const o of objs.slice(0, 30)) {
      for (const k of Object.keys(o)) {
        if (!keys.includes(k)) keys.push(k)
      }
    }
    if (keys.length === 0) return undefined
    return {
      headers: keys.map(humanize),
      rows: objs.map((o) => keys.map((k) => valueToHtml(o[k]))),
    }
  } catch {
    return undefined
  }
}

/** Flat object of primitives → key/value TableData. */
export function toKeyValueTable(obj: any): TableData | undefined {
  if (!isPlainObject(obj)) return undefined
  try {
    const rows = Object.entries(obj)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => [`<strong>${esc(humanize(k))}</strong>`, valueToHtml(v)])
    if (rows.length === 0) return undefined
    return { headers: ['Concept', 'Detail'], rows }
  } catch {
    return undefined
  }
}

/** Build a Section for an arbitrary key/value following the generic rules. */
export function sectionForValue(key: string, value: any): Section | null {
  try {
    const title = humanize(key) || 'Data'
    if (value === null || value === undefined) return null

    if (typeof value === 'string') {
      if (!value.trim()) return null
      return { title, content: `<p>${esc(value)}</p>` }
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return { title, content: `<p>${esc(String(value))}</p>` }
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return null
      if (value.every((v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) {
        return { title, listItems: value.map((v) => esc(String(v))) }
      }
      const table = toTable(value)
      if (table) return { title, table }
      const listItems = value.map((v) => valueToHtml(v)).filter(Boolean)
      return listItems.length ? { title, listItems } : null
    }
    if (isPlainObject(value)) {
      const entries = Object.entries(value).filter(([, v]) => v !== null && v !== undefined && v !== '')
      if (entries.length === 0) return null
      const allPrimitive = entries.every(
        ([, v]) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
      )
      if (allPrimitive) {
        const table = toKeyValueTable(value)
        return table ? { title, table } : null
      }
      const cards = toCards(value)
      if (cards.length) return { title, cards }
      const table = toKeyValueTable(value)
      return table ? { title, table } : null
    }
    return null
  } catch {
    return null
  }
}

/**
 * Generic pass over top-level keys of a result (skipping brandColor and any
 * already-covered keys). Used by specific adapters to avoid losing data.
 */
export function genericSections(result: any, exclude: Iterable<string> = []): Section[] {
  const sections: Section[] = []
  if (!isPlainObject(result)) return sections
  const skip = new Set<string>(['brandColor'])
  for (const k of exclude) skip.add(k)
  for (const [key, value] of Object.entries(result)) {
    if (skip.has(key)) continue
    try {
      const s = sectionForValue(key, value)
      if (s) sections.push(s)
    } catch {
      // never throw — skip the key
    }
  }
  return sections
}

/** Fallback adapter: converts ANY result object into readable sections. */
export const genericAdapter: ToolAdapter = (result) => {
  try {
    return genericSections(result)
  } catch {
    return []
  }
}
