'use client'

// P6 — "Cuéntale a MIRA": chat para meter información al cerebro sin subir
// documentos ni editar campos. Propone cambios concretos y NADA se aplica
// hasta confirmar (las propuestas de cliente las confirma la agencia).

import { useCallback, useEffect, useRef, useState } from 'react'
import { useActiveClient } from '@/lib/client-context'

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
}

interface Proposal {
  id: string
  origin: 'agency' | 'client'
  summary: string
  changes: Array<{ target: string; op: string; payload: Record<string, unknown> }>
  created_at?: string
}

const TARGET_LABEL: Record<string, string> = {
  brand_profile: '🧠 Brand Brain',
  project_memory: '📌 Memoria',
  content_pillar: '🏛️ Pilar de contenido',
  brand_reference: '🔗 Referencia',
}

function ProposalCard({
  proposal,
  isAgency,
  onResolved,
}: {
  proposal: Proposal
  isAgency: boolean
  onResolved: (id: string, status: string) => void
}) {
  const [state, setState] = useState<'idle' | 'working' | 'error'>('idle')
  const [msg, setMsg] = useState<string | null>(null)

  const act = async (action: 'confirm' | 'reject') => {
    setState('working')
    setMsg(null)
    const res = await fetch(`/api/brain/proposals/${proposal.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    }).catch(() => null)
    const data = await res?.json().catch(() => null)
    if (res?.ok && data?.success) {
      onResolved(proposal.id, data.status)
    } else {
      setState('error')
      setMsg(data?.error || 'No se pudo resolver')
    }
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
      <p className="text-xs font-medium text-ink">
        {proposal.origin === 'client' ? '👤 Propuesta del cliente · ' : ''}{proposal.summary}
      </p>
      <ul className="space-y-1">
        {(proposal.changes || []).map((c, i) => (
          <li key={i} className="text-[11px] text-ink-secondary">
            {TARGET_LABEL[c.target] || c.target}{' '}
            <span className="text-ink-tertiary">
              {Object.keys(c.payload || {}).slice(0, 4).join(', ')}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        {isAgency ? (
          <button
            onClick={() => act('confirm')}
            disabled={state === 'working'}
            className="text-[11px] px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 transition-colors disabled:opacity-50"
          >
            {state === 'working' ? '⏳ Aplicando…' : '✓ Confirmar y aplicar'}
          </button>
        ) : (
          <span className="text-[11px] text-ink-tertiary">Pendiente de la agencia</span>
        )}
        <button
          onClick={() => act('reject')}
          disabled={state === 'working'}
          className="text-[11px] px-3 py-1.5 rounded-lg bg-surface-hover text-ink-secondary hover:text-ink transition-colors disabled:opacity-50"
        >
          Descartar
        </button>
        {msg && <span className="text-[11px] text-amber-400">{msg}</span>}
      </div>
    </div>
  )
}

const SEEN_KEY = 'mira_brain_chat_seen'

export default function BrainChat({ isAgency }: { isAgency: boolean }) {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id
  const [open, setOpen] = useState(false)

  // Se abre sola la primera vez que alguien ve esta tarjeta (por navegador) —
  // era descubrible del todo, cerrada por defecto y sin ninguna señal visual
  // distinta a las demás tarjetas de /brand-brain, así que casi nadie la
  // encontraba por accidente. Solo una vez: a partir de ahí respeta lo que
  // el usuario decida.
  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) {
        setOpen(true)
        localStorage.setItem(SEEN_KEY, '1')
      }
    } catch {}
  }, [])
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [pending, setPending] = useState<Proposal[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadPending = useCallback(async () => {
    if (!clientId) return
    const res = await fetch(`/api/brain/proposals?clientId=${clientId}&status=pending`).catch(() => null)
    const data = await res?.json().catch(() => null)
    if (data?.proposals) setPending(data.proposals)
  }, [clientId])

  useEffect(() => { loadPending() }, [loadPending])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || sending || !clientId) return
    const next = [...messages, { role: 'user' as const, content: text }]
    setMessages(next)
    setInput('')
    setSending(true)
    const res = await fetch('/api/brain/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, messages: next }),
    }).catch(() => null)
    const data = await res?.json().catch(() => null)
    if (res?.ok && data?.reply) {
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }])
      if (data.proposals?.length) loadPending()
    } else {
      setMessages((m) => [...m, { role: 'assistant', content: `⚠️ ${data?.error || 'No se pudo procesar — inténtalo de nuevo.'}` }])
    }
    setSending(false)
  }

  const onResolved = (id: string, status: string) => {
    setPending((p) => p.filter((x) => x.id !== id))
    setMessages((m) => [...m, {
      role: 'assistant',
      content: status === 'applied' ? '✅ Cambios aplicados al brain.' : 'Propuesta descartada.',
    }])
  }

  return (
    <div
      className="card mb-6 overflow-hidden border-l-4"
      style={{ borderLeftColor: 'rgba(251,191,36,0.7)' }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-surface-hover transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">💬</span>
          <div>
            <p className="text-sm font-semibold text-ink flex items-center gap-2">
              Cuéntale a MIRA
              <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(251,191,36,0.15)', color: 'rgba(251,191,36,0.7)' }}>
                SIN FORMULARIOS
              </span>
            </p>
            <p className="text-[11px] text-ink-tertiary">
              ¿Novedades del negocio? Cuéntalo aquí y el brain se actualiza — con tu confirmación, nunca solo.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pending.length > 0 && (
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
              {pending.length} pendiente{pending.length > 1 ? 's' : ''}
            </span>
          )}
          <span className="text-xs text-ink-tertiary">{open ? 'Cerrar' : 'Abrir'}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-line p-4 space-y-3">
          {pending.length > 0 && (
            <div className="space-y-2">
              {pending.map((p) => (
                <ProposalCard key={p.id} proposal={p} isAgency={isAgency} onResolved={onResolved} />
              ))}
            </div>
          )}

          <div className="max-h-72 overflow-y-auto space-y-2">
            {messages.length === 0 && (
              <p className="text-xs text-ink-tertiary">
                Ej.: «Vamos a abrir una línea de foodtruck en septiembre» · «El precio del menú sube a 12,90€» · «Los reels de producto funcionan el doble que las fotos»
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`text-sm rounded-xl px-3 py-2 whitespace-pre-wrap ${m.role === 'user' ? 'bg-surface-hover text-ink ml-8' : 'bg-surface border border-line text-ink-secondary mr-8'}`}>
                {m.content}
              </div>
            ))}
            {sending && <p className="text-xs text-ink-tertiary">Pensando…</p>}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Cuéntale una novedad del negocio…"
              className="flex-1 rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink placeholder-ink-tertiary outline-none focus:border-ink-muted"
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="rounded-lg bg-surface-hover px-4 py-2 text-sm font-medium text-ink hover:opacity-80 transition-colors disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
