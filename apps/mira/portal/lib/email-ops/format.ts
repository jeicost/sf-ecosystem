// Formateadores puros compartidos por la UI de Email Ops (browser-safe).
import { t, type Locale } from '@/lib/i18n'

export function timeAgo(iso: string | null | undefined, locale: Locale): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return t('emailops.time.now', locale)
  if (m < 60) return `${m} ${t('emailops.time.min', locale)}`
  const h = Math.floor(m / 60)
  if (h < 48) return `${h} ${t('emailops.time.h', locale)}`
  return `${Math.floor(h / 24)} ${t('emailops.time.d', locale)}`
}

export function fmtDate(iso: string | null | undefined, locale: Locale): string {
  if (!iso) return '—'
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-GB', { day: '2-digit', month: 'short' })
}

export function fmtWindow(from: unknown, to: unknown): string {
  const a = typeof from === 'string' ? from : null
  const b = typeof to === 'string' ? to : null
  if (a && b) return `${a}–${b}`
  if (a) return `${a}`
  if (b) return `→ ${b}`
  return '—'
}

export function priorityColor(p: number): string {
  if (p >= 70) return '#EF4444'
  if (p >= 45) return '#F59E0B'
  if (p >= 25) return '#6366F1'
  return '#94A3B8'
}

export const STATUS_COLOR: Record<string, string> = { open: '#F59E0B', closed: '#10B981', discarded: '#94A3B8' }
export const DELIVERY_COLOR: Record<string, string> = { local: '#10B981', nacional: '#6366F1', internacional: '#EC4899' }

export function confidenceColor(c: number | undefined, manual: boolean): string {
  if (manual) return '#10B981'
  if (c === undefined) return '#94A3B8'
  if (c >= 0.8) return '#10B981'
  if (c >= 0.5) return '#F59E0B'
  return '#EF4444'
}
