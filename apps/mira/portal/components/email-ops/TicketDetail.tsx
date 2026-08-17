'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { ArrowLeft, Check, Loader2, Paperclip, Pencil, RefreshCw, RotateCcw, Trash2, X, AlertCircle, ExternalLink } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n'
import type { FieldDef, FieldValue } from '@/lib/email-ops/schema'
import { fieldLabel } from '@/lib/email-ops/schema'
import type { TicketRow, MessageRow } from '@/lib/email-ops/types'
import { confidenceColor, timeAgo } from '@/lib/email-ops/format'
import { PriorityBadge, StatusPill, DeliveryPill, KindPill } from './Badges'

// Detalle de un ticket: datos del parte (editables inline, con confianza y
// evidencia por campo), acciones de estado y el hilo de correos con adjuntos.

type AttachmentWithUrl = MessageRow['attachments'][number] & { url: string | null }
type MessageWithUrls = Omit<MessageRow, 'attachments'> & { attachments: AttachmentWithUrl[] }

export default function TicketDetail({ ticketId, clientId, locale, brand }: { ticketId: string; clientId: string; locale: Locale; brand: string }) {
  const [ticket, setTicket] = useState<TicketRow | null>(null)
  const [messages, setMessages] = useState<MessageWithUrls[]>([])
  const [schema, setSchema] = useState<FieldDef[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [tRes, sRes] = await Promise.all([
      fetch(`/api/email-ops/tickets/${ticketId}?clientId=${clientId}`),
      fetch(`/api/email-ops/settings?clientId=${clientId}`),
    ])
    const tData = await tRes.json()
    const sData = await sRes.json()
    if (!tRes.ok) { setError(tData.error || 'Error'); setLoading(false); return }
    setTicket(tData.ticket)
    setMessages(tData.messages || [])
    if (sRes.ok) setSchema(sData.schema || [])
    setLoading(false)
  }, [ticketId, clientId])

  useEffect(() => { load() }, [load])

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000) }

  const patch = async (body: Record<string, unknown>, label: string) => {
    setBusy(label)
    const res = await fetch(`/api/email-ops/tickets/${ticketId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, ...body }),
    })
    const data = await res.json()
    if (!res.ok) flash(data.error || t('emailops.toast.error', locale))
    else { setTicket(data.ticket); flash(t('emailops.toast.saved', locale)) }
    setBusy(null)
    return res.ok
  }

  const startEdit = () => {
    if (!ticket) return
    const d: Record<string, string> = {}
    for (const f of schema) {
      const v = ticket.fields?.[f.key]
      d[f.key] = v === null || v === undefined ? '' : String(v)
    }
    setDraft(d)
    setEditing(true)
  }

  const saveEdit = async () => {
    if (!ticket) return
    const fields: Record<string, FieldValue> = {}
    for (const f of schema) {
      const before = ticket.fields?.[f.key]
      const beforeStr = before === null || before === undefined ? '' : String(before)
      if (draft[f.key] !== beforeStr) fields[f.key] = draft[f.key] === '' ? null : draft[f.key]
    }
    const ok = Object.keys(fields).length === 0 ? true : await patch({ fields }, 'save')
    if (ok) setEditing(false)
  }

  const reprocess = async () => {
    setBusy('reprocess'); flash(t('emailops.toast.reprocessing', locale))
    const res = await fetch('/api/email-ops/reprocess', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, ticketId }),
    })
    if (!res.ok) { const d = await res.json(); flash(d.error || t('emailops.toast.error', locale)) }
    await load()
    setBusy(null)
  }

  if (loading) return <div className="flex h-60 items-center justify-center"><Loader2 size={20} className="animate-spin text-ink-muted" /></div>
  if (error || !ticket) return <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error || 'Not found'}</p>

  const isOther = ticket.kind === 'other'
  const missing = new Set(ticket.missing_fields || [])

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <Link href="/email-ops" className="mb-4 inline-flex items-center gap-1.5 text-xs text-ink-tertiary transition-colors hover:text-ink"><ArrowLeft size={13} /> {t('emailops.action.back', locale)}</Link>

      {/* Cabecera */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            {!isOther && <PriorityBadge value={Number(ticket.priority) || 0} />}
            <StatusPill status={ticket.status} locale={locale} />
            <KindPill kind={ticket.kind} locale={locale} />
            <DeliveryPill type={ticket.delivery_type} locale={locale} />
            {ticket.department && <span className="rounded bg-surface px-1.5 py-px text-[10px] text-ink-tertiary">{ticket.department}</span>}
          </div>
          <h1 className="text-xl font-semibold text-ink">{ticket.summary || ticket.subject || '—'}</h1>
          <p className="mt-1 text-xs text-ink-tertiary">
            {ticket.subject}{ticket.original_sender ? ` · ${t('emailops.detail.original-sender', locale)}: ${ticket.original_sender}` : ticket.from_address ? ` · ${ticket.from_address}` : ''} · {ticket.message_count} {t('emailops.count.messages', locale)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ticket.status !== 'closed' && !isOther && (
            <button onClick={() => patch({ status: 'closed' }, 'close')} disabled={!!busy}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white disabled:opacity-50" style={{ background: '#10B981' }}>
              {busy === 'close' ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} {t('emailops.action.close', locale)}
            </button>
          )}
          {ticket.status !== 'open' && (
            <button onClick={() => patch({ status: 'open' }, 'reopen')} disabled={!!busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-2 text-xs text-ink-secondary hover:text-ink disabled:opacity-50">
              <RotateCcw size={12} /> {t('emailops.action.reopen', locale)}
            </button>
          )}
          {isOther ? (
            <button onClick={() => patch({ kind: 'shipment_request', status: 'open' }, 'kind')} disabled={!!busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-2 text-xs text-ink-secondary hover:text-ink disabled:opacity-50">
              <Check size={12} /> {t('emailops.action.mark-request', locale)}
            </button>
          ) : ticket.status !== 'discarded' && (
            <button onClick={() => patch({ status: 'discarded' }, 'discard')} disabled={!!busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-2 text-xs text-ink-tertiary hover:text-red-400 disabled:opacity-50">
              <Trash2 size={12} /> {t('emailops.action.discard', locale)}
            </button>
          )}
          <button onClick={reprocess} disabled={!!busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-2 text-xs text-ink-tertiary hover:text-ink disabled:opacity-50">
            {busy === 'reprocess' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} {t('emailops.action.reprocess', locale)}
          </button>
        </div>
      </div>

      {toast && <div className="mb-4 inline-block rounded-lg bg-surface px-3 py-1.5 text-xs text-ink-secondary">{toast}</div>}

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* Datos del parte */}
        <section className="rounded-2xl border border-line bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">{t('emailops.detail.fields', locale)}</h2>
            {!editing ? (
              <button onClick={startEdit} className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1.5 text-xs text-ink-secondary hover:text-ink"><Pencil size={12} /> {t('emailops.action.edit', locale)}</button>
            ) : (
              <div className="flex gap-1.5">
                <button onClick={saveEdit} disabled={busy === 'save'} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-50" style={{ background: brand }}>
                  {busy === 'save' ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} {t('emailops.action.save', locale)}
                </button>
                <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1.5 text-xs text-ink-secondary"><X size={12} /> {t('emailops.action.cancel', locale)}</button>
              </div>
            )}
          </div>
          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {schema.map((f) => {
              const value = ticket.fields?.[f.key]
              const manual = !!ticket.manual_overrides?.[f.key]
              const conf = ticket.confidence?.[f.key]
              const ev = ticket.evidence?.[f.key]
              const isMissing = missing.has(f.key)
              return (
                <div key={f.key} className={clsx('rounded-xl border px-3 py-2', isMissing && !editing ? 'border-amber-500/30 bg-amber-500/5' : 'border-line-subtle')}>
                  <div className="mb-0.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-muted">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: value == null ? '#94A3B8' : confidenceColor(conf, manual) }} title={manual ? t('emailops.detail.manual', locale) : `${t('emailops.detail.confidence', locale)}: ${conf !== undefined ? Math.round(conf * 100) + '%' : '—'}`} />
                    {fieldLabel(f, locale)}
                    {f.required && <span className="text-ink-muted">*</span>}
                    {manual && <span className="ml-auto text-[9px] normal-case text-emerald-400">{t('emailops.detail.manual', locale)}</span>}
                    {isMissing && !manual && <span className="ml-auto inline-flex items-center gap-1 text-[9px] normal-case text-amber-400"><AlertCircle size={10} /> {t('emailops.detail.missing', locale)}</span>}
                  </div>
                  {editing ? (
                    f.type === 'enum' ? (
                      <select value={draft[f.key] ?? ''} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} className="w-full rounded-md border border-line bg-page px-2 py-1 text-sm text-ink">
                        <option value="">—</option>
                        {(f.enum || []).map((o) => <option key={o} value={o}>{t(`emailops.delivery.${o}`, locale)}</option>)}
                      </select>
                    ) : (
                      <input value={draft[f.key] ?? ''} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                        type={f.type === 'date' ? 'date' : f.type === 'time' ? 'time' : 'text'}
                        placeholder={f.type === 'int' || f.type === 'number' ? '0' : ''}
                        className="w-full rounded-md border border-line bg-page px-2 py-1 text-sm text-ink outline-none" />
                    )
                  ) : (
                    <p className={clsx('text-sm', value == null ? 'text-ink-muted' : 'text-ink')} title={ev ? `${t('emailops.detail.evidence', locale)}: ${ev}` : undefined}>
                      {value == null ? '—' : f.type === 'enum' ? t(`emailops.delivery.${value}`, locale) : String(value)}
                    </p>
                  )}
                  {!editing && ev && <p className="mt-0.5 line-clamp-2 text-[10px] italic text-ink-muted">“{ev}”</p>}
                </div>
              )
            })}
          </div>
          {(ticket.urgency || messages.some((m) => m.extraction?.notes)) && (
            <div className="mt-4 flex flex-wrap gap-4 border-t border-line-subtle pt-3 text-xs text-ink-tertiary">
              {ticket.urgency && <span>{t('emailops.detail.urgency', locale)}: <b className="text-ink">{ticket.urgency}/5</b></span>}
              {messages.filter((m) => m.extraction?.notes).map((m) => (
                <span key={m.id}>{t('emailops.detail.notes', locale)}: <span className="text-ink-secondary">{m.extraction?.notes}</span></span>
              ))}
            </div>
          )}
        </section>

        {/* Hilo */}
        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink">{t('emailops.detail.messages', locale)}</h2>
          {messages.length === 0 && <p className="text-xs text-ink-muted">{t('emailops.detail.no-messages', locale)}</p>}
          <div className="space-y-3">
            {messages.map((m) => (
              <details key={m.id} className="rounded-xl border border-line-subtle" open={messages.length === 1}>
                <summary className="cursor-pointer px-3 py-2 text-xs">
                  <span className="font-medium text-ink">{m.from_name || m.from_address || '—'}</span>
                  <span className="text-ink-muted"> · {timeAgo(m.received_at, locale)}</span>
                  {m.status !== 'processed' && (
                    <span className={clsx('ml-2 rounded px-1.5 py-px text-[10px]', m.status === 'failed' ? 'bg-red-500/15 text-red-400' : 'bg-surface text-ink-tertiary')}>
                      {m.status === 'failed' ? t('emailops.detail.failed', locale) : t('emailops.detail.processing', locale)}
                    </span>
                  )}
                  {m.attachments?.length > 0 && <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-ink-muted"><Paperclip size={10} /> {m.attachments.length}</span>}
                  <p className="mt-0.5 truncate text-[11px] text-ink-tertiary">{m.subject}</p>
                </summary>
                <div className="border-t border-line-subtle px-3 py-2">
                  <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words font-sans text-[12px] leading-relaxed text-ink-secondary">{m.text_body || '—'}</pre>
                  {m.attachments?.length > 0 && (
                    <div className="mt-2 border-t border-line-subtle pt-2">
                      <p className="mb-1 text-[10px] uppercase tracking-wider text-ink-muted">{t('emailops.detail.attachments', locale)}</p>
                      <ul className="space-y-1">
                        {m.attachments.map((a) => (
                          <li key={a.resend_id} className="flex items-center gap-2 text-[12px]">
                            <Paperclip size={11} className="text-ink-muted" />
                            {a.url ? <a href={a.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink hover:underline">{a.filename} <ExternalLink size={10} /></a> : <span className="text-ink-secondary">{a.filename}</span>}
                            {a.size ? <span className="text-ink-muted">({Math.round(a.size / 1024)} KB)</span> : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {m.last_error && <p className="mt-2 text-[11px] text-red-400">{m.last_error}</p>}
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
