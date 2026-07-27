'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useActiveClient } from '@/lib/client-context'
import DocumentUpload from '@/components/DocumentUpload'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'

// name / desc hold i18n keys, resolved with t() at render time
const DOC_TYPE_META: Record<string, { name: string; icon: string; desc: string }> = {
  'doc-playbook': {
    name: 'docs.type-playbook-name',
    icon: '📘',
    desc: 'docs.type-playbook-desc',
  },
  'doc-deck': {
    name: 'docs.type-deck-name',
    icon: '🎬',
    desc: 'docs.type-deck-desc',
  },
  'doc-results': {
    name: 'docs.type-results-name',
    icon: '📈',
    desc: 'docs.type-results-desc',
  },
  'doc-onepager': {
    name: 'docs.type-onepager-name',
    icon: '📄',
    desc: 'docs.type-onepager-desc',
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
  const { locale } = useLocaleContext()
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
      if (!res.ok) throw new Error(json.error || t('docs.generation-failed', locale))
      setCreating(null)
      setForm({ topic: '', objective: '', key_data: '' })
      window.location.href = `/documents/${json.queue_id}`
    } catch (e) {
      setError(e instanceof Error ? e.message : t('docs.generation-error', locale))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink">{t('docs.title', locale)}</h1>
        <p className="text-ink-secondary mt-2">
          {t('docs.subtitle', locale).replace('{name}', activeClient?.name || t('docs.your-brand', locale))}
        </p>
      </div>

      {/* Crear documento */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-ink">{t('docs.create-document', locale)}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(DOC_TYPE_META).map(([slug, meta]) => (
            <button
              key={slug}
              onClick={() => setCreating(creating === slug ? null : slug)}
              className={`p-5 rounded-xl border text-left transition ${
                creating === slug
                  ? 'border-amber-500/60 bg-amber-500/10'
                  : 'border-line bg-card hover:border-amber-500/30'
              }`}
            >
              <div className="text-2xl mb-2">{meta.icon}</div>
              <p className="font-semibold text-ink text-sm">{t(meta.name, locale)}</p>
              <p className="text-ink-secondary text-xs mt-1 leading-relaxed">{t(meta.desc, locale)}</p>
            </button>
          ))}
        </div>

        {creating && (
          <div className="p-6 rounded-xl border border-amber-500/30 bg-card space-y-4">
            <p className="text-ink font-semibold">
              {DOC_TYPE_META[creating].icon} {t('docs.new', locale)} {t(DOC_TYPE_META[creating].name, locale)}
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs text-ink-secondary uppercase tracking-wide">{t('docs.field-topic', locale)}</label>
                <input
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  placeholder={t('docs.topic-placeholder', locale)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-surface border border-line text-ink text-sm focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-ink-secondary uppercase tracking-wide">{t('docs.field-objective', locale)}</label>
                <input
                  value={form.objective}
                  onChange={(e) => setForm({ ...form, objective: e.target.value })}
                  placeholder={t('docs.objective-placeholder', locale)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-surface border border-line text-ink text-sm focus:border-amber-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-ink-secondary uppercase tracking-wide">
                {t('docs.field-key-data', locale)}
              </label>
              <textarea
                value={form.key_data}
                onChange={(e) => setForm({ ...form, key_data: e.target.value })}
                rows={3}
                placeholder={t('docs.key-data-placeholder', locale)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-surface border border-line text-ink text-sm focus:border-amber-500 outline-none"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={generating || !form.topic.trim()}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-surface-hover disabled:text-ink-tertiary text-black font-semibold text-sm transition"
              >
                {generating ? t('docs.generating', locale) : t('docs.generate', locale)}
              </button>
              <button
                onClick={() => setCreating(null)}
                className="px-5 py-2 rounded-lg border border-line text-ink-secondary text-sm hover:bg-surface-hover transition"
              >
                {t('docs.cancel', locale)}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Biblioteca */}
      <div className="space-y-4">
        <div className="flex gap-2 border-b border-line">
          <button
            onClick={() => setTab('generated')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              tab === 'generated'
                ? 'border-amber-500 text-ink'
                : 'border-transparent text-ink-tertiary hover:text-ink-secondary'
            }`}
          >
            {t('docs.tab-generated', locale)} ({docs.length})
          </button>
          <button
            onClick={() => setTab('files')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              tab === 'files'
                ? 'border-amber-500 text-ink'
                : 'border-transparent text-ink-tertiary hover:text-ink-secondary'
            }`}
          >
            {t('docs.tab-files', locale)}
          </button>
        </div>

        {tab === 'generated' ? (
          docs.length === 0 ? (
            <div className="p-10 rounded-xl border-2 border-dashed border-line text-center">
              <p className="text-ink-secondary">{t('docs.empty-generated', locale)}</p>
              <p className="text-ink-tertiary text-sm mt-1">{t('docs.empty-generated-hint', locale)}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {docs.map((d) => {
                const meta = DOC_TYPE_META[d.tool_slug]
                const topic = (d.input_data?.topic as string) || (meta ? t(meta.name, locale) : '') || d.tool_slug
                return (
                  <div
                    key={d.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-line bg-card"
                  >
                    <span className="text-xl">{meta?.icon || '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-ink text-sm font-medium truncate">{topic}</p>
                      <p className="text-ink-tertiary text-xs mt-0.5">
                        {meta ? t(meta.name, locale) : ''} · {new Date(d.created_at).toLocaleString('es-ES')}
                      </p>
                    </div>
                    {d.status === 'completed' ? (
                      <Link
                        href={`/documents/${d.id}`}
                        className="px-4 py-1.5 rounded-lg text-xs font-medium bg-surface hover:bg-surface-hover text-ink transition"
                      >
                        {t('docs.open', locale)}
                      </Link>
                    ) : d.status === 'failed' ? (
                      <span className="text-xs text-red-400">{d.error_message || t('docs.error', locale)}</span>
                    ) : (
                      <span className="text-xs text-amber-400 animate-pulse">{t('docs.generating-short', locale)}</span>
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
