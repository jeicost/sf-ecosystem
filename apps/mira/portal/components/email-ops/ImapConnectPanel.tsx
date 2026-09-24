'use client'
import { useState } from 'react'
import { Loader2, KeyRound, Plug, CheckCircle2, AlertTriangle } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n'

// Conectar un buzón del cliente directamente por IMAP, sin reenvíos ni DNS.
//
// La contraseña se escribe aquí UNA vez, se prueba contra el servidor y se
// guarda cifrada: no vuelve a salir de la base de datos ni aparece en la lista
// de buzones. El botón "Probar" existe para descubrir en el momento, por
// ejemplo, que Microsoft 365 rechaza el acceso por contraseña — en vez de
// enterarse cuando no llegue ningún correo.

interface Preset { label: string; host: string; port: number; hint?: string }

// Servidores habituales. El usuario puede escribir otro.
const PRESETS: Preset[] = [
  { label: 'Microsoft 365 / Outlook', host: 'outlook.office365.com', port: 993, hint: 'Microsoft suele tener desactivado el acceso por contraseña; si falla, su administrador debe activarlo.' },
  { label: 'Servicio de correo (Hostalia)', host: 'imap.serviciodecorreo.es', port: 993 },
  { label: 'IONOS', host: 'imap.ionos.es', port: 993 },
  { label: 'Gmail / Google Workspace', host: 'imap.gmail.com', port: 993, hint: 'Requiere contraseña de aplicación, no la del usuario.' },
  { label: 'Otro servidor', host: '', port: 993 },
]

type Status = { kind: 'ok' | 'error' | 'saved'; text: string } | null

export default function ImapConnectPanel({ clientId, locale, brand, onSaved }: {
  clientId: string; locale: Locale; brand: string; onSaved?: () => void
}) {
  const [preset, setPreset] = useState(0)
  const [host, setHost] = useState(PRESETS[0].host)
  const [port, setPort] = useState(993)
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [department, setDepartment] = useState('')
  const [busy, setBusy] = useState<'test' | 'save' | null>(null)
  const [status, setStatus] = useState<Status>(null)

  const pickPreset = (i: number) => {
    setPreset(i); setHost(PRESETS[i].host); setPort(PRESETS[i].port); setStatus(null)
  }

  const call = async (action: 'test' | 'save') => {
    setBusy(action); setStatus(null)
    try {
      const res = await fetch('/api/email-ops/inboxes/imap', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, action, host, port, user, password, department: department.trim() || 'operaciones', address: user }),
      })
      const data = await res.json()
      if (!res.ok) { setStatus({ kind: 'error', text: data.error || 'Error' }); return }
      if (data.ok === false) { setStatus({ kind: 'error', text: data.error || 'No se pudo conectar' }); return }
      if (action === 'test') {
        setStatus({ kind: 'ok', text: t('emailops.imap.test-ok', locale).replace('{n}', String(data.messages ?? '?')) })
        return
      }
      // Guardado: se borra la contraseña del formulario en el acto.
      setPassword('')
      const p = data.firstPoll
      setStatus({
        kind: 'saved',
        text: p?.error
          ? `${t('emailops.imap.saved', locale)} ⚠️ ${p.error}`
          : t('emailops.imap.saved-poll', locale).replace('{n}', String(p?.processed ?? 0)),
      })
      onSaved?.()
    } catch {
      setStatus({ kind: 'error', text: 'Network error' })
    } finally {
      setBusy(null)
    }
  }

  const ready = host.trim() && user.trim() && password

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Plug size={15} style={{ color: brand }} /> {t('emailops.imap.title', locale)}
      </h2>
      <p className="mt-1 mb-4 text-xs text-ink-tertiary">{t('emailops.imap.desc', locale)}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary sm:col-span-2">
          {t('emailops.imap.provider', locale)}
          <select value={preset} onChange={(e) => pickPreset(Number(e.target.value))}
            className="rounded-lg border border-line bg-page px-2.5 py-1.5 text-sm text-ink outline-none">
            {PRESETS.map((p, i) => <option key={p.label} value={i}>{p.label}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">
          {t('emailops.imap.host', locale)}
          <input value={host} onChange={(e) => setHost(e.target.value.trim())} placeholder="imap.ejemplo.com"
            className="rounded-lg border border-line bg-page px-2.5 py-1.5 text-sm text-ink outline-none" />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">
          {t('emailops.imap.port', locale)}
          <input value={port} onChange={(e) => setPort(Number(e.target.value) || 993)} inputMode="numeric"
            className="rounded-lg border border-line bg-page px-2.5 py-1.5 text-sm text-ink outline-none" />
        </label>

        <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">
          {t('emailops.imap.user', locale)}
          <input value={user} onChange={(e) => setUser(e.target.value.trim())} placeholder="local@cliente.es" autoComplete="off"
            className="rounded-lg border border-line bg-page px-2.5 py-1.5 text-sm text-ink outline-none" />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">
          {t('emailops.imap.password', locale)}
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="new-password"
            className="rounded-lg border border-line bg-page px-2.5 py-1.5 text-sm text-ink outline-none" />
        </label>

        <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary sm:col-span-2">
          {t('emailops.imap.department', locale)}
          <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="tráfico local"
            className="rounded-lg border border-line bg-page px-2.5 py-1.5 text-sm text-ink outline-none" />
        </label>
      </div>

      {PRESETS[preset].hint && (
        <p className="mt-3 flex items-start gap-1.5 text-[11px] text-ink-tertiary">
          <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-500" aria-hidden /> {PRESETS[preset].hint}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={() => call('test')} disabled={!ready || busy !== null}
          className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs text-ink-secondary transition-colors hover:text-ink disabled:opacity-50">
          {busy === 'test' ? <Loader2 size={12} className="animate-spin" /> : <KeyRound size={12} />} {t('emailops.imap.test', locale)}
        </button>
        <button onClick={() => call('save')} disabled={!ready || busy !== null}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50" style={{ background: brand }}>
          {busy === 'save' ? <Loader2 size={12} className="animate-spin" /> : <Plug size={12} />} {t('emailops.imap.connect', locale)}
        </button>
      </div>

      {status && (
        <p className={`mt-3 flex items-start gap-1.5 rounded-lg px-3 py-2 text-xs ${
          status.kind === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
          {status.kind === 'error' ? <AlertTriangle size={13} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={13} className="mt-0.5 shrink-0" />}
          <span>{status.text}</span>
        </p>
      )}

      <p className="mt-3 text-[11px] text-ink-muted">{t('emailops.imap.privacy', locale)}</p>
    </div>
  )
}
