'use client'

// Bandeja del Brand Brain: lo que MIRA ha aprendido y está esperando tu visto
// bueno, SIEMPRE visible.
//
// Por qué existe (2026-08-05): al sincronizar Drive, el sync creaba una
// `brain_change_proposal` pendiente y esa propuesta solo se veía dentro de la
// tarjeta plegable "Cuéntale a MIRA" — una tarjeta titulada como un chat de
// novedades, que no menciona Drive por ningún lado y que solo se auto-abre UNA
// VEZ por navegador en toda su vida. Resultado real en producción: 2
// propuestas de Salsa y 1 contradicción llevaban días esperando sin que nadie
// supiera que estaban ahí, y la sensación era "subo documentos al Drive y el
// Brand Brain no se actualiza".
//
// Y las contradicciones, además, no tenían forma NINGUNA de resolverse: se
// creaban, se contaban, y ahí se quedaban para siempre.

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Check, Loader2, Sparkles, X } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { createClient } from '@/lib/supabase'

interface Proposal {
  id: string
  origin: 'agency' | 'client' | 'drive_sync' | 'lint'
  summary: string
  changes: Array<{ target: string; op: string; payload: Record<string, unknown> }>
  created_at?: string
}

interface Contradiction {
  id: string
  field_path: string
  existing_value_excerpt?: string | null
  proposed_value_excerpt?: string | null
  note: string
  source_type: string
  created_at?: string
}

const ORIGIN_LABEL: Record<string, string> = {
  drive_sync: 'From Google Drive',
  chat: 'From chat',
  client: 'Proposed by the client',
  agency: 'From chat',
  lint: 'From the weekly review',
}

const TARGET_LABEL: Record<string, string> = {
  brand_profile: 'Brand Brain',
  project_memory: 'Memory',
  content_pillar: 'Content pillar',
  brand_reference: 'Reference',
}

const SOURCE_LABEL: Record<string, string> = {
  drive_sync: 'Google Drive',
  document_analysis: 'Uploaded document',
  chat: 'Chat',
  manual: 'Manual edit',
  lint: 'Weekly review',
}

function timeAgo(iso?: string): string {
  if (!iso) return ''
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days < 1) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

export default function BrainInbox() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id
  const [isAgency, setIsAgency] = useState(false)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [contradictions, setContradictions] = useState<Contradiction[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        const plan = (data.user?.user_metadata?.plan as string) ?? 'starter'
        setIsAgency(plan === 'super_admin' || plan === 'admin')
      })
      .catch(() => {})
  }, [])

  const load = useCallback(async () => {
    if (!clientId) return
    const [pRes, cRes] = await Promise.allSettled([
      fetch(`/api/brain/proposals?clientId=${clientId}&status=pending`).then((r) => r.json()),
      fetch(`/api/brain/contradictions?clientId=${clientId}&status=open`).then((r) => r.json()),
    ])
    if (pRes.status === 'fulfilled' && Array.isArray(pRes.value?.proposals)) {
      setProposals(pRes.value.proposals)
    }
    if (cRes.status === 'fulfilled' && Array.isArray(cRes.value?.contradictions)) {
      setContradictions(cRes.value.contradictions)
    }
    setLoaded(true)
  }, [clientId])

  useEffect(() => { load() }, [load])

  const resolveProposal = async (id: string, action: 'confirm' | 'reject') => {
    setBusy(id); setError(null)
    try {
      const res = await fetch(`/api/brain/proposals/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not resolve this change')
      setProposals((list) => list.filter((p) => p.id !== id))
      if (action === 'confirm') await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(null)
    }
  }

  const resolveContradiction = async (id: string, action: 'keep_current' | 'adopt_new' | 'dismiss') => {
    setBusy(id); setError(null)
    try {
      const res = await fetch(`/api/brain/contradictions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not resolve this contradiction')
      setContradictions((list) => list.filter((c) => c.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(null)
    }
  }

  const total = proposals.length + contradictions.length
  // Sin nada pendiente no se ocupa espacio, pero tampoco se pinta un esqueleto
  // vacío durante la carga.
  if (!loaded || total === 0) return null

  return (
    <div className="card mb-6 overflow-hidden border-l-4" style={{ borderLeftColor: 'rgba(168,85,247,0.8)' }}>
      <div className="p-4 border-b border-line flex items-center gap-3">
        <Sparkles size={18} className="text-purple-400" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">What MIRA learned — waiting for you</p>
          <p className="text-[11px] text-ink-tertiary">
            Nothing is written into your Brand Brain until you approve it here.
          </p>
        </div>
        <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-purple-300">
          {total}
        </span>
      </div>

      {error && (
        <div className="mx-4 mt-3 p-2.5 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-300">
          {error}
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Contradicciones primero: bloquean la fuente de verdad de la marca */}
        {contradictions.map((c) => (
          <div key={c.id} className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
            <p className="text-xs font-medium text-ink flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-amber-400 shrink-0" />
              Conflict in <code className="text-amber-300">{c.field_path}</code>
            </p>
            <p className="text-[11px] text-ink-secondary">{c.note}</p>

            <div className="grid gap-1.5 sm:grid-cols-2">
              <div className="rounded-lg bg-surface border border-line p-2">
                <p className="text-[10px] uppercase tracking-wider text-ink-tertiary mb-0.5">Currently in the Brain</p>
                <p className="text-[11px] text-ink-secondary">{c.existing_value_excerpt || '—'}</p>
              </div>
              <div className="rounded-lg bg-surface border border-line p-2">
                <p className="text-[10px] uppercase tracking-wider text-ink-tertiary mb-0.5">
                  Proposed by {SOURCE_LABEL[c.source_type] || c.source_type}
                </p>
                <p className="text-[11px] text-ink-secondary">{c.proposed_value_excerpt || '—'}</p>
              </div>
            </div>

            {isAgency ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => resolveContradiction(c.id, 'adopt_new')}
                  disabled={busy === c.id || !c.proposed_value_excerpt}
                  className="text-[11px] px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 transition-colors disabled:opacity-40"
                  title={!c.proposed_value_excerpt ? 'This conflict has no proposed value to adopt' : undefined}
                >
                  {busy === c.id ? <Loader2 size={11} className="animate-spin inline" /> : 'Use the new value'}
                </button>
                <button
                  onClick={() => resolveContradiction(c.id, 'keep_current')}
                  disabled={busy === c.id}
                  className="text-[11px] px-3 py-1.5 rounded-lg bg-surface-hover text-ink-secondary hover:text-ink transition-colors disabled:opacity-40"
                >
                  Keep what I have
                </button>
                <button
                  onClick={() => resolveContradiction(c.id, 'dismiss')}
                  disabled={busy === c.id}
                  className="text-[11px] px-3 py-1.5 rounded-lg text-ink-tertiary hover:text-ink transition-colors disabled:opacity-40"
                >
                  Not a real conflict
                </button>
                <span className="text-[10px] text-ink-tertiary ml-auto">{timeAgo(c.created_at)}</span>
              </div>
            ) : (
              <p className="text-[11px] text-ink-tertiary">Waiting for the agency to resolve it</p>
            )}
          </div>
        ))}

        {/* Propuestas de cambio */}
        {proposals.map((p) => (
          <div key={p.id} className="rounded-xl border border-line bg-surface p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-ink">{p.summary}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-hover text-ink-tertiary whitespace-nowrap">
                {ORIGIN_LABEL[p.origin] || p.origin}
              </span>
            </div>
            <ul className="space-y-0.5">
              {(p.changes || []).map((c, i) => (
                <li key={i} className="text-[11px] text-ink-secondary">
                  <span className="text-ink">{TARGET_LABEL[c.target] || c.target}</span>
                  {' — '}
                  <span className="text-ink-tertiary">
                    {Object.keys(c.payload || {}).slice(0, 5).join(', ')}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2">
              {isAgency ? (
                <button
                  onClick={() => resolveProposal(p.id, 'confirm')}
                  disabled={busy === p.id}
                  className="text-[11px] px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                >
                  {busy === p.id
                    ? <Loader2 size={11} className="animate-spin" />
                    : <Check size={11} />}
                  Add to the Brain
                </button>
              ) : (
                <span className="text-[11px] text-ink-tertiary">Waiting for the agency</span>
              )}
              <button
                onClick={() => resolveProposal(p.id, 'reject')}
                disabled={busy === p.id}
                className="text-[11px] px-3 py-1.5 rounded-lg text-ink-secondary hover:text-ink transition-colors disabled:opacity-40 flex items-center gap-1.5"
              >
                <X size={11} /> Discard
              </button>
              <span className="text-[10px] text-ink-tertiary ml-auto">{timeAgo(p.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
