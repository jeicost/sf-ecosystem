'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useActiveClient } from '@/lib/client-context'
import DocumentUpload from '@/components/DocumentUpload'

const DOC_TYPE_META: Record<string, { name: string; icon: string; desc: string }> = {
  'doc-playbook': {
    name: 'Playbook Operativo',
    icon: '📘',
    desc: 'Guía paso a paso con estrategia, ejecución y métricas. Formato informe premium.',
  },
  'doc-deck': {
    name: 'Presentación / Dossier 16:9',
    icon: '🎬',
    desc: 'Presentación navegable para clientes o inversores, con modo pantalla completa.',
  },
  'doc-results': {
    name: 'Informe de Resultados',
    icon: '📈',
    desc: 'Reporte periódico de métricas: qué funcionó, qué no, y plan del siguiente periodo.',
  },
  'doc-onepager': {
    name: 'One-Pager Comercial',
    icon: '📄',
    desc: 'Una página de ventas: problema, solución, cifras y llamada a la acción.',
  },
}

interface DocRow {
  id: string
  tool_slug: string
  status: string
  created_at: string
  error_message: string | null
  input_data: Record<string, unknown> | null
}

export default function DocumentsPage() {
  const { activeClient } = useActiveClient()
  const [tab, setTab] = useState<'generated' | 'files'>('generated')
  const [docs, setDocs] = useState<DocRow[]>([])
  const [creating, setCreating] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [form, setForm] = useState({ topic: '', objective: '', key_data: '' })
  const [error, setError] = useState<string | null>(null)

  const loadDocs = useCallback(async () => {
    if (!activeClient?.id) return
    const { data } = await createClient()
      .from('generation_queue')
      .select('id, tool_slug, status, created_at, error_message, input_data')
      .eq('client_id', activeClient.id)
      .in('tool_slug', Object.keys(DOC_TYPE_META))
      .order('created_at', { ascending: false })
      .limit(50)
    setDocs((data as DocRow[]) || [])
  }, [activeClient?.id])

  useEffect(() => {
    loadDocs()
  }, [loadDocs])

  // Polling cada 5s mientras haya documentos en proceso; se detiene al no quedar ninguno
  useEffect(() => {
    const hasProcessing = docs.some((d) => d.status !== 'completed' && d.status !== 'failed')
    if (!hasProcessing) return
    const interval = setInterval(loadDocs, 5000)
    return () => clearInterval(interval)
  }, [docs, loadDocs])

  async function handleGenerate() {
    if (!creating || !activeClient?.id) return
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_type: creating,
          client_id: activeClient.id,
          input_data: form,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Generation failed')
      setCreating(null)
      setForm({ topic: '', objective: '', key_data: '' })
      window.location.href = `/documents/${json.queue_id}`
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error generando el documento')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Documentos</h1>
        <p className="text-gray-400 mt-2">
          Genera playbooks, presentaciones e informes con la identidad de {activeClient?.name || 'tu marca'}.
          Todos tus entregables en un solo lugar.
        </p>
      </div>

      {/* Crear documento */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Crear documento</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(DOC_TYPE_META).map(([slug, meta]) => (
            <button
              key={slug}
              onClick={() => setCreating(creating === slug ? null : slug)}
              className={`p-5 rounded-xl border text-left transition ${
                creating === slug
                  ? 'border-amber-500/60 bg-amber-500/10'
                  : 'border-gray-800 bg-gray-900 hover:border-amber-500/30'
              }`}
            >
              <div className="text-2xl mb-2">{meta.icon}</div>
              <p className="font-semibold text-white text-sm">{meta.name}</p>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed">{meta.desc}</p>
            </button>
          ))}
        </div>

        {creating && (
          <div className="p-6 rounded-xl border border-amber-500/30 bg-gray-900 space-y-4">
            <p className="text-white font-semibold">
              {DOC_TYPE_META[creating].icon} Nuevo {DOC_TYPE_META[creating].name}
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide">Tema *</label>
                <input
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  placeholder="Ej: Incrementar ventas en Q4"
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-black/40 border border-gray-700 text-white text-sm focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide">Objetivo</label>
                <input
                  value={form.objective}
                  onChange={(e) => setForm({ ...form, objective: e.target.value })}
                  placeholder="Ej: Plan accionable para el equipo comercial"
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-black/40 border border-gray-700 text-white text-sm focus:border-amber-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide">
                Datos clave (opcional — cifras, contexto, requisitos)
              </label>
              <textarea
                value={form.key_data}
                onChange={(e) => setForm({ ...form, key_data: e.target.value })}
                rows={3}
                placeholder="Cualquier dato real que deba aparecer en el documento"
                className="mt-1 w-full px-3 py-2 rounded-lg bg-black/40 border border-gray-700 text-white text-sm focus:border-amber-500 outline-none"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={generating || !form.topic.trim()}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-400 text-black font-semibold text-sm transition"
              >
                {generating ? 'Generando… (~1-2 min)' : 'Generar documento'}
              </button>
              <button
                onClick={() => setCreating(null)}
                className="px-5 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm hover:bg-white/5 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Biblioteca */}
      <div className="space-y-4">
        <div className="flex gap-2 border-b border-gray-800">
          <button
            onClick={() => setTab('generated')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              tab === 'generated'
                ? 'border-amber-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Generados ({docs.length})
          </button>
          <button
            onClick={() => setTab('files')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              tab === 'files'
                ? 'border-amber-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Archivos subidos
          </button>
        </div>

        {tab === 'generated' ? (
          docs.length === 0 ? (
            <div className="p-10 rounded-xl border-2 border-dashed border-gray-800 text-center">
              <p className="text-gray-400">Aún no hay documentos generados.</p>
              <p className="text-gray-500 text-sm mt-1">Elige un tipo arriba para crear el primero.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {docs.map((d) => {
                const meta = DOC_TYPE_META[d.tool_slug]
                const topic = (d.input_data?.topic as string) || meta?.name || d.tool_slug
                return (
                  <div
                    key={d.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-800 bg-gray-900"
                  >
                    <span className="text-xl">{meta?.icon || '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{topic}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {meta?.name} · {new Date(d.created_at).toLocaleString('es-ES')}
                      </p>
                    </div>
                    {d.status === 'completed' ? (
                      <Link
                        href={`/documents/${d.id}`}
                        className="px-4 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition"
                      >
                        Abrir →
                      </Link>
                    ) : d.status === 'failed' ? (
                      <span className="text-xs text-red-400">{d.error_message || 'Error'}</span>
                    ) : (
                      <span className="text-xs text-amber-400 animate-pulse">Generando…</span>
                    )}
                  </div>
                )
              })}
            </div>
          )
        ) : (
          <DocumentUpload />
        )}
      </div>
    </div>
  )
}
