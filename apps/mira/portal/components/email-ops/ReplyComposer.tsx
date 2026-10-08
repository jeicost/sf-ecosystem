'use client'
import { useState } from 'react'
import { Loader2, Send, X, AlertTriangle, FlaskConical, ExternalLink, Copy } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n'

// Redactar y enviar la respuesta DESDE EL BUZÓN del parte, sin salir de MIRA
// (Carlos, 8-oct-2026). El borrador viene hecho (datos del parte, sin modelo);
// la persona lo revisa, lo cambia si quiere y pulsa «Enviar». Si la marca está
// en modo prueba, se avisa en grande: el correo irá a la dirección de prueba.

export interface ReplyInfo {
  inbox: { id: string; address: string; display_name: string | null; source: string } | null
  can: boolean
  reason: string | null
  test_to: string | null
  signature: string | null
}

export default function ReplyComposer({ ticketId, clientId, locale, brand, reply, initial, alternatives, onClose, onSent }: {
  ticketId: string
  clientId: string
  locale: Locale
  brand: string
  reply: ReplyInfo
  initial: { to: string; subject: string; body: string }
  alternatives: { mailto: string; outlookWeb: string; gmail: string; copy: () => void }
  onClose: () => void
  onSent: (info: { to: string[]; test: boolean; warning: string | null }) => void
}) {
  const [to, setTo] = useState(initial.to)
  const [cc, setCc] = useState('')
  const [subject, setSubject] = useState(initial.subject)
  const [body, setBody] = useState(reply.signature && !initial.body.includes(reply.signature) ? `${initial.body}\n${reply.signature}` : initial.body)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async () => {
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/email-ops/tickets/${ticketId}/reply`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, to, cc, subject, body }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error'); return }
      onSent({ to: data.to, test: !!data.test, warning: data.warning || null })
    } catch {
      setError('Network error')
    } finally {
      setBusy(false)
    }
  }

  const reasonKey = reply.reason ? `emailops.send.cannot.${reply.reason}` : null

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-line bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">{t('emailops.send.title', locale)}</h2>
            <p className="mt-0.5 text-xs text-ink-tertiary">
              {reply.inbox ? t('emailops.send.from', locale).replace('{address}', reply.inbox.address) : t('emailops.send.no-inbox', locale)}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-ink-muted hover:bg-surface hover:text-ink" aria-label="close"><X size={14} /></button>
        </div>

        {reply.test_to && (
          <p className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            <FlaskConical size={14} className="mt-0.5 shrink-0" />
            <span>{t('emailops.send.test-banner', locale).replace('{address}', reply.test_to)}</span>
          </p>
        )}
        {!reply.can && reasonKey && (
          <p className="mb-3 flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" /> <span>{t(reasonKey, locale)}</span>
          </p>
        )}

        <div className="grid gap-2">
          <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">
            {t('emailops.send.to', locale)}
            <input value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-line bg-page px-2.5 py-1.5 text-sm text-ink outline-none" />
          </label>
          <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">
            {t('emailops.send.cc', locale)}
            <input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="—" className="rounded-lg border border-line bg-page px-2.5 py-1.5 text-sm text-ink outline-none" />
          </label>
          <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">
            {t('emailops.send.subject', locale)}
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-lg border border-line bg-page px-2.5 py-1.5 text-sm text-ink outline-none" />
          </label>
          <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">
            {t('emailops.send.body', locale)}
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} className="rounded-lg border border-line bg-page px-2.5 py-1.5 font-sans text-[13px] leading-relaxed text-ink outline-none" />
          </label>
        </div>

        {error && <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button onClick={send} disabled={busy || !reply.can || !to.trim() || !body.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white disabled:opacity-50" style={{ background: reply.test_to ? '#D97706' : brand }}>
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            {t(reply.test_to ? 'emailops.send.send-test' : 'emailops.send.send', locale)}
          </button>
          <span className="text-[11px] text-ink-muted">{t('emailops.send.or', locale)}</span>
          <a href={alternatives.mailto} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-ink-secondary hover:bg-surface hover:text-ink"><ExternalLink size={11} /> {t('emailops.send.alt-mail-app', locale)}</a>
          <a href={alternatives.outlookWeb} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-ink-secondary hover:bg-surface hover:text-ink"><ExternalLink size={11} /> Outlook web</a>
          <a href={alternatives.gmail} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-ink-secondary hover:bg-surface hover:text-ink"><ExternalLink size={11} /> Gmail</a>
          <button onClick={alternatives.copy} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-ink-secondary hover:bg-surface hover:text-ink"><Copy size={11} /> {t('emailops.action.copy-reply', locale)}</button>
        </div>
      </div>
    </div>
  )
}
