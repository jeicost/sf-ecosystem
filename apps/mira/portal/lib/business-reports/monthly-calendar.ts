// Calendario del mes computado en TS (F4): el GRID real del mes nunca lo
// escribe el modelo — se construye determinista desde las captions
// (suggested_day) sobre el mes concreto, con fallback de reparto Lu/Mi/Vi.

export interface CalendarItem {
  platform: string
  pillar: string
  title: string
  is_hero?: boolean
}

export interface CalendarEntry {
  date: string // 'YYYY-MM-DD'
  day: number
  weekday: number // 0=domingo … 6=sábado (getUTCDay)
  weekday_label: string
  items: CalendarItem[]
}

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
// Reparto por defecto cuando una caption no trae suggested_day válido
const FALLBACK_WEEKDAYS = [1, 3, 5] // Lu / Mi / Vi

export function daysInMonth(month: string): number {
  const m = /^(\d{4})-(\d{2})$/.exec(month)
  if (!m) return 30
  return new Date(Date.UTC(Number(m[1]), Number(m[2]), 0)).getUTCDate()
}

export function computeCalendarEntries(
  month: string,
  captions: Array<Record<string, any>>,
  heroTitles: string[] = []
): CalendarEntry[] {
  const m = /^(\d{4})-(\d{2})$/.exec(month)
  if (!m) return []
  const year = Number(m[1])
  const mon = Number(m[2])
  const total = daysInMonth(month)

  const byDay = new Map<number, CalendarItem[]>()
  const add = (day: number, item: CalendarItem) => {
    const d = Math.min(Math.max(1, Math.round(day)), total)
    if (!byDay.has(d)) byDay.set(d, [])
    byDay.get(d)!.push(item)
  }

  // 1. Captions con día sugerido válido
  const unplaced: CalendarItem[] = []
  for (const c of captions || []) {
    if (!c || typeof c !== 'object') continue
    const title = String(c.hook || c.caption || c.copy || '').replace(/\s+/g, ' ').slice(0, 60)
    const item: CalendarItem = {
      platform: String(c.platform || ''),
      pillar: String(c.pillar_name || ''),
      title,
      is_hero: heroTitles.some((h) => h && title && h.slice(0, 30) === title.slice(0, 30)),
    }
    const day = Number(c.suggested_day)
    if (Number.isFinite(day) && day >= 1 && day <= 31) add(day, item)
    else unplaced.push(item)
  }

  // 2. Fallback determinista: repartir lo no ubicado en Lu/Mi/Vi libres
  if (unplaced.length) {
    const slots: number[] = []
    for (let d = 1; d <= total; d++) {
      const wd = new Date(Date.UTC(year, mon - 1, d)).getUTCDay()
      if (FALLBACK_WEEKDAYS.includes(wd)) slots.push(d)
    }
    let i = 0
    for (const item of unplaced) {
      const day = slots.length ? slots[i % slots.length] : 1 + (i % total)
      add(day, item)
      i++
    }
  }

  const entries: CalendarEntry[] = []
  for (let d = 1; d <= total; d++) {
    const date = new Date(Date.UTC(year, mon - 1, d))
    const wd = date.getUTCDay()
    entries.push({
      date: `${month}-${String(d).padStart(2, '0')}`,
      day: d,
      weekday: wd,
      weekday_label: WEEKDAY_LABELS[wd],
      items: byDay.get(d) || [],
    })
  }
  return entries
}
