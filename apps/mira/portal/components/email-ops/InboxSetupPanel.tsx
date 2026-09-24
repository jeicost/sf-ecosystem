'use client'
import { useCallback, useEffect, useState } from 'react'
import { Copy, Check, Plus, Mail, Loader2, Power, Plug, RefreshCw, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'
import { t, type Locale } from '@/lib/i18n'
import { timeAgo } from '@/lib/email-ops/format'
import type { EmailInbox } from '@/lib/email-ops/inboxes'

// Panel "reenvía a esta dirección": lista de buzones por departamento con botón
// copiar e instrucciones de regla. La agencia (super_admin) puede dar de alta.

export default function InboxSetupPanel({ clientId, locale, brand, compact, refreshKey }: { clientId: string; locale: Locale; brand: string; compact?: boolean; refreshKey?: number }) {
  const [inboxes, setInboxes] = useState<EmailInbox[]>([])
  const [domain, setDomain] = useState<string | null>(null)
  const [canManage, setCanManage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [dept, setDept] = useState('')
  const [local, setLocal] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [polling, setPolling] = useState<string | null>(null)
  const [pollResult, setPollResult] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/email-ops/inboxes?clientId=${clientId}`)
    const data = await res.json()
    if (res.ok) { setInboxes(data.inboxes || []); setDomain(data.domain); setCanManage(!!data.canManage) }
    setLoading(false)
  }, [clientId])
  // refreshKey cambia cuando se conecta un buzón nuevo en el panel de al lado.
  useEffect(() => { load() }, [load, refreshKey])

  const copy = async (addr: string) => {
    try { await navigator.clipboard.writeText(addr); setCopied(addr); setTimeout(() => setCopied(null), 1500) } catch { /* sin portapapeles */ }
  }

  const add = async () => {
    if (!dept.trim()) return
    setSaving(true); setError(null)
    const res = await fetch('/api/email-ops/inboxes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, department: dept.trim(), localPart: local.trim() || undefined }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Error')
    else { setDept(''); setLocal(''); await load() }
    setSaving(false)
  }

  const toggle = async (inbox: EmailInbox) => {
    await fetch('/api/email-ops/inboxes', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, id: inbox.id, active: !inbox.active }),
    })
    await load()
  }

  // Lectura bajo demanda: el cron va cada 10 minutos, pero al conectar (o al
  // arreglar una contraseña) se quiere ver ya si entra correo.
  const readNow = async (inbox: EmailInbox) => {
    setPolling(inbox.id)
    setPollResult((prev) => ({ ...prev, [inbox.id]: '' }))
    try {
      const res = await fetch('/api/email-ops/inboxes/imap/poll', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, id: inbox.id }),
      })
      const data = await res.json()
      const text = !res.ok || data.error
        ? (data.error || 'Error')
        : data.fetched > 0
          ? t('emailops.setup.read-result', locale).replace('{fetched}', String(data.fetched)).replace('{processed}', String(data.processed))
          : t('emailops.setup.read-none', locale)
      setPollResult((prev) => ({ ...prev, [inbox.id]: text }))
      await load()
    } catch {
      setPollResult((prev) => ({ ...prev, [inbox.id]: 'Network error' }))
    } finally {
      setPolling(null)
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><Mail size={15} style={{ color: brand }} /> {t('emailops.setup.title', locale)}</h2>
        {loading && <Loader2 size={14} className="animate-spin text-ink-muted" />}
      </div>
      {!compact && <p className="mb-4 text-xs text-ink-tertiary">{t('emailops.setup.desc', locale)}</p>}
      {/* El aviso del dominio de reenvío solo importa si este cliente va a usar
          reenvío. Con un buzón leído por IMAP, salía un aviso ámbar que parecía
          una avería y no lo era. */}
      {!domain && !loading && !inboxes.some((ib) => ib.source === 'imap') && (
        <p className="mb-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400">{t('emailops.setup.no-domain', locale)}</p>
      )}

      {inboxes.length === 0 && !loading ? (
        <p className="text-xs text-ink-muted">{t('emailops.empty.no-inbox', locale)}</p>
      ) : (
        <div className="space-y-1.5">
          {inboxes.map((ib) => {
            const isImap = ib.source === 'imap'
            return (
            <div key={ib.id} className={clsx('rounded-xl border border-line-subtle px-3 py-2', !ib.active && 'opacity-50')}>
              <div className="flex flex-wrap items-center gap-2">
                {/* En móvil el departamento y la dirección van en líneas propias:
                    apretados en una sola, la dirección quedaba en "lo…". */}
                <span className="w-full shrink-0 truncate text-xs font-medium text-ink sm:w-32">{ib.department}</span>
                <code className="w-full min-w-0 truncate rounded bg-surface px-2 py-1 text-[12px] text-ink-secondary sm:w-auto sm:flex-1">{ib.address}</code>
                <span className={clsx('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px]',
                  isImap ? 'bg-emerald-500/10 text-emerald-400' : 'bg-surface text-ink-tertiary')}>
                  {isImap ? <Plug size={10} /> : <Mail size={10} />}
                  {t(isImap ? 'emailops.setup.src-imap' : 'emailops.setup.src-forward', locale)}
                </span>
                {isImap ? (
                  canManage && (
                    <button onClick={() => readNow(ib)} disabled={polling !== null}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-ink-secondary transition-colors hover:bg-surface hover:text-ink disabled:opacity-50">
                      {polling === ib.id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                      {polling === ib.id ? t('emailops.setup.reading', locale) : t('emailops.setup.read-now', locale)}
                    </button>
                  )
                ) : (
                  <button onClick={() => copy(ib.address)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-ink-secondary transition-colors hover:bg-surface hover:text-ink">
                    {copied === ib.address ? <Check size={12} /> : <Copy size={12} />} {copied === ib.address ? t('emailops.setup.copied', locale) : t('emailops.setup.copy', locale)}
                  </button>
                )}
                {canManage && (
                  <button onClick={() => toggle(ib)} title={ib.active ? t('emailops.setup.active', locale) : t('emailops.setup.inactive', locale)}
                    className="rounded-lg p-1 text-ink-muted transition-colors hover:bg-surface hover:text-ink"><Power size={12} /></button>
                )}
              </div>
              {isImap && (
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 pl-0 text-[11px] sm:pl-[8.5rem]">
                  <span className="text-ink-muted">
                    {ib.imap_last_checked_at
                      ? t('emailops.setup.last-read', locale).replace('{when}', timeAgo(ib.imap_last_checked_at, locale))
                      : t('emailops.setup.never-read', locale)}
                  </span>
                  {pollResult[ib.id] && <span className="text-ink-secondary">{pollResult[ib.id]}</span>}
                </div>
              )}
              {isImap && ib.imap_last_error && (
                <p className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-400">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                  <span>{t('emailops.setup.imap-error', locale).replace('{error}', ib.imap_last_error)}</span>
                </p>
              )}
            </div>
            )
          })}
        </div>
      )}

      {canManage && !compact && (
        <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-line-subtle pt-4">
          <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">
            {t('emailops.setup.department', locale)}
            <input value={dept} onChange={(e) => setDept(e.target.value)} placeholder="operaciones" className="rounded-lg border border-line bg-page px-2.5 py-1.5 text-sm text-ink outline-none" />
          </label>
          <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">
            {t('emailops.setup.local-part', locale)}
            <input value={local} onChange={(e) => setLocal(e.target.value.toLowerCase())} placeholder="albasanz-operaciones" className="rounded-lg border border-line bg-page px-2.5 py-1.5 text-sm text-ink outline-none" />
          </label>
          <button onClick={add} disabled={saving || !dept.trim() || !domain}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50" style={{ background: brand }}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} {t('emailops.setup.add', locale)}
          </button>
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
      )}

      {!compact && (
        <details className="mt-4 text-xs text-ink-tertiary">
          <summary className="cursor-pointer text-ink-secondary">{t('emailops.setup.instructions', locale)}</summary>
          <p className="mt-2">{t('emailops.setup.instructions-outlook', locale)}</p>
          <p className="mt-2">{t('emailops.setup.instructions-generic', locale)}</p>
        </details>
      )}
    </div>
  )
}
