'use client'
import { useEffect, useState } from 'react'
import { FlaskConical, Loader2, Save, SendHorizonal } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n'

// Ajustes de las respuestas desde MIRA: modo prueba (todas las respuestas de la
// marca van a esta dirección, nunca al cliente) y firma al pie.

export default function ReplySettingsPanel({ clientId, locale, brand }: { clientId: string; locale: Locale; brand: string }) {
  const [testTo, setTestTo] = useState('')
  const [signature, setSignature] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/email-ops/settings?clientId=${clientId}`).then((r) => r.json()).then((d) => {
      setTestTo(d.settings?.reply_test_to || '')
      setSignature(d.settings?.reply_signature || '')
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [clientId])

  const save = async () => {
    setSaving(true); setMsg(null)
    const res = await fetch('/api/email-ops/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, reply_test_to: testTo.trim(), reply_signature: signature }),
    })
    const data = await res.json().catch(() => ({}))
    setMsg(res.ok ? t('emailops.rules.saved', locale) : data.error || t('emailops.toast.error', locale))
    setSaving(false)
  }

  const testOn = !!testTo.trim()
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink"><SendHorizonal size={15} style={{ color: brand }} /> {t('emailops.sendsettings.title', locale)}</h2>
      <p className="mb-3 text-xs text-ink-tertiary">{t('emailops.sendsettings.desc', locale)}</p>
      {!loaded ? <Loader2 size={14} className="animate-spin text-ink-muted" /> : (
        <div className="space-y-3">
          <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">
            <span className="inline-flex items-center gap-1.5"><FlaskConical size={12} /> {t('emailops.sendsettings.test-to', locale)}</span>
            <input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="prueba@empresa.es" autoComplete="off"
              className="rounded-lg border border-line bg-page px-2.5 py-1.5 text-sm text-ink outline-none" />
          </label>
          <p className={`rounded-lg px-3 py-2 text-[11px] ${testOn ? 'bg-amber-500/10 text-amber-300' : 'bg-surface text-ink-tertiary'}`}>
            {testOn ? t('emailops.sendsettings.test-on', locale).replace('{address}', testTo.trim()) : t('emailops.sendsettings.test-off', locale)}
          </p>
          <label className="flex flex-col gap-1 text-[11px] text-ink-tertiary">
            {t('emailops.sendsettings.signature', locale)}
            <textarea value={signature} onChange={(e) => setSignature(e.target.value)} rows={3} maxLength={600} placeholder={t('emailops.sendsettings.signature-placeholder', locale)}
              className="rounded-lg border border-line bg-page px-2.5 py-1.5 text-sm text-ink outline-none" />
          </label>
          <div className="flex items-center gap-3">
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white disabled:opacity-50" style={{ background: brand }}>
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} {t('emailops.rules.save', locale)}
            </button>
            {msg && <span className="text-xs text-ink-secondary">{msg}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
