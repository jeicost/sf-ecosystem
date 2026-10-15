'use client'
import { useState } from 'react'
import { GraduationCap, Loader2 } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n'

// «Enséñale a MIRA» (Noel, 15-oct-2026): debajo de lo que la IA ha deducido,
// una caja para decirle qué ha hecho mal o qué tiene que saber de este correo,
// como se le diría a un compañero nuevo. Entra como ejemplo de ESTE correo
// (el texto del hilo + el parte tal como está ahora + la nota) y, si se marca,
// también como regla general de la marca. «Guardar y reanalizar» vuelve a
// pasar el hilo por la IA con lo aprendido, sin pisar lo corregido a mano.
export default function TeachBox({ ticketId, clientId, locale, brand, onSaved }: {
  ticketId: string; clientId: string; locale: Locale; brand: string
  /** Tras guardar; `reanalizar` = la persona pidió volver a pasar el correo por la IA. */
  onSaved: (reanalizar: boolean) => void
}) {
  const [nota, setNota] = useState('')
  const [comoRegla, setComoRegla] = useState(false)
  const [busy, setBusy] = useState<'save' | 'reanalyze' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const guardar = async (reanalizar: boolean) => {
    if (nota.trim().length < 8) return
    setBusy(reanalizar ? 'reanalyze' : 'save'); setError(null)
    try {
      const res = await fetch('/api/email-ops/training', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId, ticketId, note: nota.trim(), as_rule: comoRegla }) })
      const d = await res.json()
      if (!res.ok) { setError(d.error || t('emailops.toast.error', locale)); return }
      setNota(''); setComoRegla(false)
      onSaved(reanalizar)
    } catch { setError(t('emailops.toast.error', locale)) } finally { setBusy(null) }
  }

  return (
    <section className="mb-4 rounded-2xl border border-line bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <GraduationCap size={14} style={{ color: brand }} />
        <h3 className="text-xs font-semibold text-ink">{t('emailops.teach.title', locale)}</h3>
      </div>
      <p className="mb-2 text-[11px] text-ink-tertiary">{t('emailops.teach.hint', locale)}</p>
      <textarea value={nota} onChange={(e) => setNota(e.target.value.slice(0, 600))} rows={2} placeholder={t('emailops.teach.placeholder', locale)}
        className="w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted" />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-[11px] text-ink-secondary">
          <input type="checkbox" checked={comoRegla} onChange={(e) => setComoRegla(e.target.checked)} /> {t('emailops.teach.as-rule', locale)}
        </label>
        <div className="ml-auto flex gap-1.5">
          <button onClick={() => guardar(false)} disabled={busy !== null || nota.trim().length < 8} className="rounded-lg bg-surface px-3 py-1.5 text-xs text-ink-secondary hover:text-ink disabled:opacity-50">
            {busy === 'save' ? <Loader2 size={12} className="inline animate-spin" /> : t('emailops.teach.save', locale)}
          </button>
          <button onClick={() => guardar(true)} disabled={busy !== null || nota.trim().length < 8} className="rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50" style={{ background: brand }}>
            {busy === 'reanalyze' ? <Loader2 size={12} className="inline animate-spin" /> : t('emailops.teach.save-reanalyze', locale)}
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </section>
  )
}
