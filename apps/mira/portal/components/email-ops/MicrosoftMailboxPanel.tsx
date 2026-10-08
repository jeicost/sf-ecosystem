'use client'
import { useCallback, useEffect, useState } from 'react'
import { Loader2, CheckCircle2, AlertTriangle, LogIn, Copy } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n'
import type { PublicConnection } from '@/lib/microsoft/connections'

// Conectar un buzón de Microsoft 365 a Email Ops por OAuth (Graph), sin
// contraseña ni reenvío. Es el camino para local@albasanzexpress.es, que es
// de Microsoft 365 y rechaza IMAP por contraseña (8-oct-2026).
//
// Flujo: la persona DEL BUZÓN pulsa «Iniciar sesión con Microsoft» (permiso
// de correo), vuelve aquí, elige departamento y pulsa «Conectar este buzón».
// Si su organización exige aprobación del administrador, aquí mismo está el
// enlace de consentimiento para pasárselo.

type Status = { kind: 'ok' | 'error' | 'saved'; text: string } | null

export default function MicrosoftMailboxPanel({ clientId, locale, brand, onSaved }: {
  clientId: string; locale: Locale; brand: string; onSaved?: () => void
}) {
  const [configured, setConfigured] = useState(true)
  const [connections, setConnections] = useState<PublicConnection[]>([])
  const [connectionId, setConnectionId] = useState('')
  const [department, setDepartment] = useState('')
  const [busy, setBusy] = useState<'auth' | 'save' | null>(null)
  const [status, setStatus] = useState<Status>(null)
  const [consentUrl, setConsentUrl] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/integrations/microsoft/connections?clientId=${clientId}`)
    if (!res.ok) return
    const json = await res.json()
    setConfigured(json.configured !== false)
    const list: PublicConnection[] = json.connections || []
    setConnections(list)
    setConnectionId((prev) => prev || list.find((c) => c.can_mail && c.is_authorized)?.id || '')
  }, [clientId])

  useEffect(() => {
    load()
    const params = new URLSearchParams(window.location.search)
    const ms = params.get('microsoft')
    if (ms === 'connected' && params.get('purpose') === 'mail') {
      setStatus({ kind: 'ok', text: t('emailops.ms.account', locale) + ' ✓' })
      if (params.get('id')) setConnectionId(params.get('id') as string)
      window.history.replaceState({}, '', window.location.pathname)
    } else if (ms === 'error') {
      setStatus({ kind: 'error', text: `Microsoft 365: ${params.get('reason') || 'error'}` })
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [load, locale])

  const signIn = async (loginHint?: string) => {
    setBusy('auth'); setStatus(null)
    try {
      const res = await fetch('/api/integrations/microsoft/authorize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, purpose: 'mail', returnTo: '/email-ops/settings', loginHint }),
      })
      const json = await res.json()
      if (res.status === 503) { setConfigured(false); return }
      if (!res.ok || !json.authUrl) throw new Error(json.error || 'Error')
      setConsentUrl(json.adminConsentUrl || null)
      window.location.href = json.authUrl
    } catch (e) {
      setStatus({ kind: 'error', text: e instanceof Error ? e.message : 'Error' })
    } finally { setBusy(null) }
  }

  // El enlace de consentimiento se puede pedir sin salir de la página.
  const copyConsent = async () => {
    try {
      let url = consentUrl
      if (!url) {
        const res = await fetch('/api/integrations/microsoft/authorize', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, purpose: 'mail', returnTo: '/email-ops/settings' }),
        })
        const json = await res.json()
        url = json.adminConsentUrl || null
        setConsentUrl(url)
      }
      if (url) { await navigator.clipboard.writeText(url); setStatus({ kind: 'ok', text: '📋 ' + t('emailops.ms.copy-consent', locale) }) }
    } catch { /* sin portapapeles */ }
  }

  const save = async () => {
    if (!connectionId) return
    setBusy('save'); setStatus(null)
    try {
      const res = await fetch('/api/email-ops/inboxes/microsoft', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, connectionId, department: department.trim() || 'operaciones' }),
      })
      const data = await res.json()
      if (!res.ok) { setStatus({ kind: 'error', text: data.error || 'Error' }); return }
      if (data.ok === false) { setStatus({ kind: 'error', text: data.error || 'Error' }); return }
      const p = data.firstPoll
      setStatus({ kind: 'saved', text: p?.error ? `${t('emailops.ms.saved', locale)} ⚠️ ${p.error}` : t('emailops.ms.saved-poll', locale).replace('{n}', String(p?.fetched ?? 0)) })
      onSaved?.()
    } catch {
      setStatus({ kind: 'error', text: 'Network error' })
    } finally { setBusy(null) }
  }

  const mailReady = connections.filter((c) => c.is_authorized && c.can_mail)

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
        <LogIn size={15} style={{ color: brand }} /> {t('emailops.ms.title', locale)}
      </h2>
      <p className="mt-1 mb-4 text-xs text-ink-tertiary">{t('emailops.ms.desc', locale)}</p>

      {!configured ? (
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400">{t('emailops.ms.not-configured', locale)}</p>
      ) : (
        <div className="space-y-3">
          {connections.length > 0 && (
            <div className="space-y-1">
              <p className="text-[11px] text-ink-tertiary">{t('emailops.ms.account', locale)}</p>
              {connections.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line-subtle px-3 py-1.5 text-xs">
                  <input type="radio" name="ms-conn" checked={connectionId === c.id} onChange={() => setConnectionId(c.id)} disabled={!c.can_mail || !c.is_authorized} />
                  <span className="font-medium text-ink">{c.account_email}</span>
                  {!c.can_mail && c.is_authorized && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-400"><AlertTriangle size={10} /> {t('emailops.ms.no-mail-scope', locale)}
                      <button onClick={() => signIn(c.account_email)} className="underline">{t('emailops.ms.sign-in', locale)}</button>
                    </span>
                  )}
                  {!c.is_authorized && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-400"><AlertTriangle size={10} /> {t('emailops.ms.needs-reauth', locale)}
                      <button onClick={() => signIn(c.account_email)} className="underline">{t('emailops.ms.sign-in', locale)}</button>
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-end gap-2">
            <button onClick={() => signIn()} disabled={busy !== null}
              className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-2 text-xs font-medium text-ink hover:bg-line disabled:opacity-50">
              {busy === 'auth' ? <Loader2 size={12} className="animate-spin" /> : <LogIn size={12} />} {t(connections.length ? 'emailops.ms.another' : 'emailops.ms.sign-in', locale)}
            </button>
            {mailReady.length > 0 && (
              <>
                <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">
                  {t('emailops.imap.department', locale)}
                  <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="tráfico local"
                    className="rounded-lg border border-line bg-page px-2.5 py-1.5 text-sm text-ink outline-none" />
                </label>
                <button onClick={save} disabled={busy !== null || !connectionId}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white disabled:opacity-50" style={{ background: brand }}>
                  {busy === 'save' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} {t('emailops.ms.connect', locale)}
                </button>
              </>
            )}
          </div>
          <p className="text-[11px] text-ink-muted">{t('emailops.ms.sign-in-hint', locale)}</p>

          <div className="rounded-lg bg-surface px-3 py-2 text-[11px] text-ink-tertiary">
            <p>{t('emailops.ms.admin-consent', locale)}</p>
            <button onClick={copyConsent} className="mt-1 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-ink-secondary hover:bg-card hover:text-ink"><Copy size={11} /> {t('emailops.ms.copy-consent', locale)}</button>
          </div>

          {status && (
            <p className={`flex items-start gap-1.5 rounded-lg px-3 py-2 text-xs ${status.kind === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {status.kind === 'error' ? <AlertTriangle size={12} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={12} className="mt-0.5 shrink-0" />}
              <span>{status.text}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
