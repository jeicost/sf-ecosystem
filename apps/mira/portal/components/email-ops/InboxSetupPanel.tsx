'use client'
import { useCallback, useEffect, useState } from 'react'
import { Copy, Check, Plus, Mail, Loader2, Power } from 'lucide-react'
import { clsx } from 'clsx'
import { t, type Locale } from '@/lib/i18n'
import type { EmailInbox } from '@/lib/email-ops/inboxes'

// Panel "reenvía a esta dirección": lista de buzones por departamento con botón
// copiar e instrucciones de regla. La agencia (super_admin) puede dar de alta.

export default function InboxSetupPanel({ clientId, locale, brand, compact }: { clientId: string; locale: Locale; brand: string; compact?: boolean }) {
  const [inboxes, setInboxes] = useState<EmailInbox[]>([])
  const [domain, setDomain] = useState<string | null>(null)
  const [canManage, setCanManage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [dept, setDept] = useState('')
  const [local, setLocal] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/email-ops/inboxes?clientId=${clientId}`)
    const data = await res.json()
    if (res.ok) { setInboxes(data.inboxes || []); setDomain(data.domain); setCanManage(!!data.canManage) }
    setLoading(false)
  }, [clientId])
  useEffect(() => { load() }, [load])

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

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><Mail size={15} style={{ color: brand }} /> {t('emailops.setup.title', locale)}</h2>
        {loading && <Loader2 size={14} className="animate-spin text-ink-muted" />}
      </div>
      {!compact && <p className="mb-4 text-xs text-ink-tertiary">{t('emailops.setup.desc', locale)}</p>}
      {!domain && !loading && <p className="mb-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400">{t('emailops.setup.no-domain', locale)}</p>}

      {inboxes.length === 0 && !loading ? (
        <p className="text-xs text-ink-muted">{t('emailops.empty.no-inbox', locale)}</p>
      ) : (
        <div className="space-y-1.5">
          {inboxes.map((ib) => (
            <div key={ib.id} className={clsx('flex flex-wrap items-center gap-2 rounded-xl border border-line-subtle px-3 py-2', !ib.active && 'opacity-50')}>
              <span className="w-32 shrink-0 truncate text-xs font-medium text-ink">{ib.department}</span>
              <code className="flex-1 truncate rounded bg-surface px-2 py-1 text-[12px] text-ink-secondary">{ib.address}</code>
              <button onClick={() => copy(ib.address)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-ink-secondary transition-colors hover:bg-surface hover:text-ink">
                {copied === ib.address ? <Check size={12} /> : <Copy size={12} />} {copied === ib.address ? t('emailops.setup.copied', locale) : t('emailops.setup.copy', locale)}
              </button>
              {canManage && (
                <button onClick={() => toggle(ib)} title={ib.active ? t('emailops.setup.active', locale) : t('emailops.setup.inactive', locale)}
                  className="rounded-lg p-1 text-ink-muted transition-colors hover:bg-surface hover:text-ink"><Power size={12} /></button>
              )}
            </div>
          ))}
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
