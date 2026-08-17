'use client'
import Link from 'next/link'
import { clsx } from 'clsx'
import { AlertCircle, Paperclip } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n'
import type { TicketRow } from '@/lib/email-ops/types'
import { fmtDate, fmtWindow, timeAgo } from '@/lib/email-ops/format'
import { PriorityBadge, DeliveryPill, StatusPill, KindPill } from './Badges'

// Tabla de tickets. Filas enlazadas al detalle; columnas = lo que un operador
// mira primero (prioridad, fecha, ventana de recogida, tipo, bultos, encargo).

export default function TicketTable({
  tickets, locale, showStatus, brand,
}: { tickets: TicketRow[]; locale: Locale; showStatus?: boolean; brand: string }) {
  const th = 'px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary whitespace-nowrap'
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-card">
      <table className="w-full min-w-[880px] text-sm">
        <thead className="bg-surface">
          <tr>
            <th className={th}>{t('emailops.col.priority', locale)}</th>
            <th className={th}>{t('emailops.col.date', locale)}</th>
            <th className={th}>{t('emailops.col.pickup', locale)}</th>
            <th className={th}>{t('emailops.col.type', locale)}</th>
            <th className={th}>{t('emailops.col.packages', locale)}</th>
            <th className={clsx(th, 'w-full')}>{t('emailops.col.summary', locale)}</th>
            <th className={th}>{t('emailops.col.from', locale)}</th>
            <th className={th}>{t('emailops.col.missing', locale)}</th>
            {showStatus && <th className={th} />}
            <th className={th}>{t('emailops.col.age', locale)}</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((tk) => {
            const missing = tk.missing_fields?.length || 0
            const isOther = tk.kind === 'other'
            return (
              <tr key={tk.id} className="group border-t border-line-subtle transition-colors hover:bg-surface">
                <td className="px-3 py-2.5 align-top">
                  {isOther ? <KindPill kind="other" locale={locale} /> : <PriorityBadge value={Number(tk.priority) || 0} />}
                </td>
                <td className="px-3 py-2.5 align-top whitespace-nowrap text-ink">{fmtDate(tk.service_date, locale)}</td>
                <td className="px-3 py-2.5 align-top whitespace-nowrap tabular-nums text-ink-secondary">
                  {fmtWindow(tk.fields?.recogida_hora_inicio, tk.fields?.recogida_hora_fin)}
                </td>
                <td className="px-3 py-2.5 align-top"><DeliveryPill type={tk.delivery_type} locale={locale} /></td>
                <td className="px-3 py-2.5 align-top tabular-nums text-ink-secondary">{tk.fields?.bultos ?? '—'}</td>
                <td className="px-3 py-2.5 align-top">
                  <Link href={`/email-ops/${tk.id}`} className="block">
                    <p className="line-clamp-2 text-[13px] font-medium text-ink group-hover:underline" style={{ textDecorationColor: brand }}>
                      {tk.summary || tk.subject || '—'}
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-muted">
                      <span className="truncate">{tk.subject}</span>
                      {tk.message_count > 1 && <span className="shrink-0">· {tk.message_count} {t('emailops.count.messages', locale)}</span>}
                      {tk.department && <span className="shrink-0 rounded bg-surface px-1.5 py-px text-[10px] text-ink-tertiary">{tk.department}</span>}
                    </p>
                  </Link>
                </td>
                <td className="max-w-[160px] truncate px-3 py-2.5 align-top text-[12px] text-ink-secondary" title={tk.original_sender || tk.from_address || ''}>
                  {tk.original_sender || tk.from_address || '—'}
                </td>
                <td className="px-3 py-2.5 align-top">
                  {missing > 0 && !isOther ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-medium text-amber-400" title={tk.missing_fields.join(', ')}>
                      <AlertCircle size={11} /> {missing}
                    </span>
                  ) : <span className="text-ink-muted">—</span>}
                </td>
                {showStatus && <td className="px-3 py-2.5 align-top"><StatusPill status={tk.status} locale={locale} /></td>}
                <td className="px-3 py-2.5 align-top whitespace-nowrap text-[11px] text-ink-muted">
                  <span className="inline-flex items-center gap-1">{timeAgo(tk.last_message_at || tk.created_at, locale)}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function AttachmentIcon() {
  return <Paperclip size={11} />
}
