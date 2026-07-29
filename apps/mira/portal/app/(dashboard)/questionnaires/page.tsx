'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardList, Loader2, Sparkles, Send, BrainCircuit } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { getUser, type MiraUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import type { UserPlan } from '@/lib/plans'

interface QuestionnaireListItem {
  id: string
  title: string
  intro: string | null
  status: 'draft' | 'sent' | 'in_progress' | 'completed' | 'ingested' | 'archived'
  source: string
  created_at: string
  completed_at: string | null
  question_count: number
}

const STATUS_META: Record<string, { label: string; classes: string }> = {
  draft: { label: 'Borrador', classes: 'bg-surface-hover text-ink-secondary' },
  sent: { label: 'Enviado', classes: 'bg-sky-500/15 text-sky-400' },
  in_progress: { label: 'En curso', classes: 'bg-blue-500/15 text-blue-300' },
  completed: { label: 'Completado', classes: 'bg-green-500/15 text-green-400' },
  ingested: { label: 'Ingestado al brain', classes: 'bg-violet-500/15 text-violet-400' },
  archived: { label: 'Archivado', classes: 'bg-surface-hover text-ink-tertiary' },
}

const SOURCE_LABEL: Record<string, string> = {
  manual: 'Manual',
  brain_gaps: 'Huecos del brain',
  intake_template: 'Plantilla intake',
  onboarding: 'Onboarding',
}

export default function QuestionnairesPage() {
  const { activeClient } = useActiveClient()
  const [user, setUser] = useState<MiraUser | null>(null)
  const [items, setItems] = useState<QuestionnaireListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [focus, setFocus] = useState('')
  const [generating, setGenerating] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    const stored = getUser()
    if (stored) { setUser(stored); return }
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) return
      const meta = data.user.user_metadata ?? {}
      setUser({
        id: data.user.id,
        name: meta.name ?? data.user.email ?? 'User',
        email: data.user.email ?? '',
        role: meta.role ?? 'client',
        plan: (meta.plan ?? 'starter') as UserPlan,
        avatar: meta.avatar ?? 'U',
      })
    })
  }, [])

  const isAgency = user?.plan === 'super_admin' || user?.plan === 'admin'

  const load = useCallback(async (clientId: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/questionnaires?clientId=${clientId}`)
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'Error cargando cuestionarios')
      setItems(Array.isArray(json?.questionnaires) ? json.questionnaires : [])
      setUnavailable(typeof json?.unavailable === 'string' ? json.unavailable : null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando cuestionarios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeClient?.id) load(activeClient.id)
  }, [activeClient?.id, load])

  async function handleGenerate() {
    if (!activeClient?.id || generating) return
    setGenerating(true)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch('/api/questionnaires/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: activeClient.id, ...(focus.trim() ? { focus: focus.trim() } : {}) }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'No se pudo generar el cuestionario')
      setFocus('')
      setNotice(`Cuestionario generado en borrador (${json?.question_count ?? '?'} preguntas). Revísalo y envíalo al cliente.`)
      await load(activeClient.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar el cuestionario')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSend(id: string) {
    if (!activeClient?.id || busyId) return
    setBusyId(id)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch(`/api/questionnaires/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent' }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'No se pudo enviar el cuestionario')
      setNotice('Cuestionario enviado — el cliente ya puede responderlo desde su portal.')
      await load(activeClient.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar el cuestionario')
    } finally {
      setBusyId(null)
    }
  }

  async function handleIngest(id: string) {
    if (!activeClient?.id || busyId) return
    if (!confirm('¿Aplicar las respuestas de este cuestionario al Brand Brain y la memoria? La ingesta es manual y definitiva.')) return
    setBusyId(id)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch(`/api/questionnaires/${id}/ingest`, { method: 'POST' })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'No se pudo ingestar el cuestionario')
      if (json?.already) {
        setNotice('Este cuestionario ya estaba ingestado.')
      } else {
        const a = json?.applied ?? {}
        setNotice(
          `Ingesta completada: ${a.brand_fields ?? 0} campos del brain, ${a.pillars ?? 0} pilares, ${a.memory_entries ?? 0} memorias.`
        )
      }
      await load(activeClient.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo ingestar el cuestionario')
    } finally {
      setBusyId(null)
    }
  }

  if (!activeClient) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-ink-tertiary">Selecciona un cliente para ver sus cuestionarios.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <div>
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.25em] text-sky-400">
          Cuestionarios · {activeClient.name}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Cuestionarios</h1>
        <p className="mt-1.5 max-w-xl text-sm text-ink-secondary">
          {isAgency
            ? 'Genera cuestionarios a partir de los huecos del Brand Brain, envíalos al cliente y, cuando los complete, ingesta sus respuestas al brain.'
            : 'Responde con calma — tus respuestas se guardan automáticamente y ayudan a que MIRA trabaje con tu contexto real.'}
        </p>
      </div>

      {unavailable && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          {unavailable}
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {notice}
        </div>
      )}

      {/* Panel de agencia: generar de huecos del brain */}
      {isAgency && !unavailable && (
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-sky-400" />
            <p className="text-sm font-semibold text-ink">Generar de huecos del brain</p>
          </div>
          <p className="mt-1 text-[11px] text-ink-tertiary">
            MIRA revisa lo que falta en el Brand Brain (campos vacíos + preguntas abiertas) y redacta un
            cuestionario en borrador para que lo revises antes de enviarlo.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Foco opcional (p. ej. «lanzamiento de la nueva línea»)"
              className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-sky-500/40"
            />
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-sky-500/15 px-4 py-2 text-xs font-semibold text-sky-400 transition hover:bg-sky-500/25 disabled:opacity-50"
            >
              {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {generating ? 'Generando…' : 'Generar'}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-line bg-surface py-10">
          <Loader2 size={16} className="animate-spin text-ink-muted" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface py-10 text-center">
          <ClipboardList size={20} className="mx-auto text-ink-muted" />
          <p className="mt-3 text-xs text-ink-tertiary">
            {isAgency
              ? 'Aún no hay cuestionarios para este cliente. Genera el primero desde los huecos del brain.'
              : 'No tienes cuestionarios pendientes por ahora.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((q) => {
            const meta = STATUS_META[q.status] ?? STATUS_META.draft
            const answerable = q.status === 'sent' || q.status === 'in_progress'
            return (
              <div key={q.id} className="rounded-2xl border border-line bg-surface p-5 transition hover:bg-surface-hover">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/questionnaires/${q.id}`} className="text-sm font-semibold text-ink hover:underline">
                      {q.title}
                    </Link>
                    <p className="mt-1 text-[10px] text-ink-tertiary">
                      {q.question_count} preguntas · {SOURCE_LABEL[q.source] ?? q.source} ·{' '}
                      {new Date(q.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${meta.classes}`}>
                    {meta.label}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {answerable && (
                    <Link
                      href={`/questionnaires/${q.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/15 px-3 py-1.5 text-[11px] font-semibold text-sky-400 transition hover:bg-sky-500/25"
                    >
                      Responder →
                    </Link>
                  )}
                  {(q.status === 'completed' || q.status === 'ingested') && (
                    <Link
                      href={`/questionnaires/${q.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-surface-hover px-3 py-1.5 text-[11px] font-medium text-ink transition hover:opacity-80"
                    >
                      Ver respuestas
                    </Link>
                  )}
                  {isAgency && q.status === 'draft' && (
                    <>
                      <Link
                        href={`/questionnaires/${q.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-surface-hover px-3 py-1.5 text-[11px] font-medium text-ink transition hover:opacity-80"
                      >
                        Revisar borrador
                      </Link>
                      <button
                        onClick={() => handleSend(q.id)}
                        disabled={busyId === q.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/15 px-3 py-1.5 text-[11px] font-semibold text-green-400 transition hover:bg-green-500/25 disabled:opacity-50"
                      >
                        {busyId === q.id ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                        Enviar al cliente
                      </button>
                    </>
                  )}
                  {isAgency && q.status === 'completed' && (
                    <button
                      onClick={() => handleIngest(q.id)}
                      disabled={busyId === q.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/15 px-3 py-1.5 text-[11px] font-semibold text-violet-400 transition hover:bg-violet-500/25 disabled:opacity-50"
                    >
                      {busyId === q.id ? <Loader2 size={11} className="animate-spin" /> : <BrainCircuit size={11} />}
                      Ingestar al brain
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
