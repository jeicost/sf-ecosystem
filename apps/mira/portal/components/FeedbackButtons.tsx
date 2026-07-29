'use client'

// 👍/👎 + nota del "diseñador de documentos" — componente único (P3).
// Sirve para informes/documentos (queueId) y quick actions (actionId).
// La nota negativa se reinyecta en la siguiente generación del mismo tipo.

import { useState } from 'react'

export function FeedbackButtons({
  queueId,
  actionId,
  compact = false,
}: {
  queueId?: string
  actionId?: string
  compact?: boolean
}) {
  const [outcome, setOutcome] = useState<'helpful' | 'not_helpful' | null>(null)
  const [note, setNote] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [msg, setMsg] = useState<string | null>(null)

  const send = async (o: 'helpful' | 'not_helpful', n?: string) => {
    setState('sending')
    const res = await fetch('/api/document-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(queueId ? { queue_id: queueId } : {}),
        ...(actionId ? { action_id: actionId } : {}),
        outcome: o,
        ...(n ? { note: n } : {}),
      }),
    }).catch(() => null)
    const data = await res?.json().catch(() => null)
    if (res?.ok) setState('sent')
    else {
      setState('error')
      setMsg(data?.error || 'Error')
    }
  }

  if (state === 'sent') {
    return (
      <p className="text-xs text-emerald-400">✓ Gracias — tu feedback mejora la próxima generación.</p>
    )
  }

  return (
    <div className={`flex items-center gap-2 flex-wrap ${compact ? '' : 'py-1'}`}>
      {!compact && <span className="text-xs text-ink-tertiary">¿Cómo salió?</span>}
      <button
        onClick={() => { setOutcome('helpful'); send('helpful') }}
        disabled={state === 'sending'}
        className={`text-sm px-2 py-1 rounded transition-colors ${outcome === 'helpful' ? 'bg-emerald-500/20' : 'hover:bg-surface-hover'}`}
      >👍</button>
      <button
        onClick={() => setOutcome('not_helpful')}
        disabled={state === 'sending'}
        className={`text-sm px-2 py-1 rounded transition-colors ${outcome === 'not_helpful' ? 'bg-red-500/20' : 'hover:bg-surface-hover'}`}
      >👎</button>
      {outcome === 'not_helpful' && (
        <>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && note.trim() && send('not_helpful', note.trim())}
            placeholder="¿Qué cambiarías? (se usa en la próxima generación)"
            className="flex-1 min-w-[200px] px-3 py-1.5 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-xs"
          />
          <button
            onClick={() => note.trim() && send('not_helpful', note.trim())}
            disabled={state === 'sending' || !note.trim()}
            className="text-xs px-3 py-1.5 rounded bg-surface-hover text-ink hover:opacity-80 transition-colors disabled:opacity-50"
          >
            {state === 'sending' ? 'Enviando…' : 'Enviar'}
          </button>
        </>
      )}
      {state === 'error' && msg && <span className="text-xs text-amber-400">{msg}</span>}
    </div>
  )
}
