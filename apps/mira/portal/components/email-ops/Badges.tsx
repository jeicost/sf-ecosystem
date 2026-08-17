'use client'
import { priorityColor, STATUS_COLOR, DELIVERY_COLOR } from '@/lib/email-ops/format'
import { t, type Locale } from '@/lib/i18n'

export function PriorityBadge({ value }: { value: number }) {
  const c = priorityColor(value)
  return (
    <span className="inline-flex min-w-[2.2rem] items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
      style={{ background: `${c}22`, color: c }}>
      {Math.round(value)}
    </span>
  )
}

export function StatusPill({ status, locale }: { status: string; locale: Locale }) {
  const c = STATUS_COLOR[status] || '#94A3B8'
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: `${c}1f`, color: c }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      {t(`emailops.status.${status}`, locale)}
    </span>
  )
}

export function DeliveryPill({ type, locale }: { type: string | null; locale: Locale }) {
  if (!type) return <span className="text-ink-muted">—</span>
  const c = DELIVERY_COLOR[type] || '#94A3B8'
  return (
    <span className="rounded-md px-1.5 py-0.5 text-[10px] font-medium" style={{ background: `${c}1f`, color: c }}>
      {t(`emailops.delivery.${type}`, locale)}
    </span>
  )
}

export function KindPill({ kind, locale }: { kind: string; locale: Locale }) {
  const c = kind === 'shipment_request' ? '#6366F1' : '#94A3B8'
  return (
    <span className="rounded-md px-1.5 py-0.5 text-[10px] font-medium" style={{ background: `${c}1f`, color: c }}>
      {t(`emailops.kind.${kind}`, locale)}
    </span>
  )
}
