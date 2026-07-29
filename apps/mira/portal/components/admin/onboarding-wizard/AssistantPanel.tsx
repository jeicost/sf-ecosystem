'use client'

// P7 — panel asistente embebido en cada paso del wizard: el admin pega texto
// libre (brief, notas de llamada, copy de la web) y la IA EXTRAE los campos
// de ESE paso para rellenar el formulario. Nunca escribe en BD — solo
// devuelve el JSON que el wizard vuelca en su estado, editable después.

import { useState } from 'react'

export default function AssistantPanel({
  step,
  onExtracted,
}: {
  step: 'basics' | 'brand' | 'project' | 'login'
  onExtracted: (fields: Record<string, unknown>) => void
}) {
  const [text, setText] = useState('')
  const [state, setState] = useState<'idle' | 'working' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState<string | null>(null)

  const extract = async () => {
    if (!text.trim() || state === 'working') return
    setState('working')
    setMsg(null)
    const res = await fetch('/api/admin/onboarding/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim(), step }),
    }).catch(() => null)
    const data = await res?.json().catch(() => null)
    if (res?.ok && data?.fields) {
      onExtracted(data.fields)
      const n = Object.keys(data.fields).length
      setState('done')
      setMsg(n ? `${n} campo${n > 1 ? 's' : ''} rellenado${n > 1 ? 's' : ''} — revísalos abajo.` : 'No encontré nada nuevo en ese texto.')
    } else {
      setState('error')
      setMsg(data?.error || 'No se pudo extraer')
    }
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4 space-y-2.5">
      <p className="text-xs font-semibold text-ink-secondary">✨ Asistente — pega texto y rellena este paso</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Pega aquí el brief, notas de la llamada, o el texto de su web…"
        rows={3}
        className="w-full rounded-lg border border-line bg-page px-3 py-2 text-xs text-ink placeholder-ink-tertiary outline-none focus:border-purple-500 resize-none"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={extract}
          disabled={!text.trim() || state === 'working'}
          className="text-xs px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 transition-colors disabled:opacity-50"
        >
          {state === 'working' ? '⏳ Extrayendo…' : '✨ Extraer y rellenar'}
        </button>
        {msg && (
          <span className={`text-[11px] ${state === 'error' ? 'text-amber-400' : 'text-ink-tertiary'}`}>{msg}</span>
        )}
      </div>
    </div>
  )
}
