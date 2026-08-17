'use client'
import { useEffect, useState } from 'react'
import { BookOpen, Loader2, Save } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n'

export default function RulesPanel({ clientId, locale, brand }: { clientId: string; locale: Locale; brand: string }) {
  const [rules, setRules] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetch(`/api/email-ops/settings?clientId=${clientId}`).then((r) => r.json()).then((d) => {
      if (!alive) return
      setRules(d.settings?.rules || '')
      setLoading(false)
    })
    return () => { alive = false }
  }, [clientId])

  const save = async () => {
    setSaving(true); setMsg(null)
    const res = await fetch('/api/email-ops/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, rules }),
    })
    setMsg(res.ok ? t('emailops.rules.saved', locale) : t('emailops.toast.error', locale))
    setSaving(false)
    setTimeout(() => setMsg(null), 2000)
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink"><BookOpen size={15} style={{ color: brand }} /> {t('emailops.rules.title', locale)}</h2>
      <p className="mb-3 text-xs text-ink-tertiary">{t('emailops.rules.desc', locale)}</p>
      {loading ? <Loader2 size={14} className="animate-spin text-ink-muted" /> : (
        <textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={6} maxLength={4000}
          placeholder={t('emailops.rules.placeholder', locale)}
          className="w-full resize-y rounded-xl border border-line bg-page px-3 py-2 text-sm text-ink outline-none" />
      )}
      <div className="mt-2 flex items-center gap-3">
        <button onClick={save} disabled={saving || loading}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50" style={{ background: brand }}>
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} {t('emailops.action.save', locale)}
        </button>
        {msg && <span className="text-xs text-ink-tertiary">{msg}</span>}
        <span className="ml-auto text-[10px] text-ink-muted">{rules.length}/4000</span>
      </div>
    </div>
  )
}
