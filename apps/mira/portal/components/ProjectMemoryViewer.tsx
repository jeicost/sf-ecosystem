'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useActiveClient } from '@/lib/client-context'
import { useActiveProject } from '@/lib/project-context'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import { BookOpen, Pin, Archive, Loader2, AlertCircle, Pencil, Trash2, Plus, Check, X } from 'lucide-react'

interface MemoryItem {
  id: string
  title: string
  category: string
  summary: string
  tags: string[]
  source_department: string
  created_at: string
  is_pinned: boolean
}

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; labelKey: string }> = {
  insight: { icon: '💡', color: '#FCD34D', labelKey: 'memory.category.insight' },
  decision: { icon: '📌', color: '#A78BFA', labelKey: 'memory.category.decision' },
  action: { icon: '✅', color: '#4ADE80', labelKey: 'memory.category.action' },
  metric: { icon: '📊', color: '#60A5FA', labelKey: 'memory.category.metric' },
  content: { icon: '📝', color: '#F87171', labelKey: 'memory.category.content' },
  generation: { icon: '🛠️', color: '#C084FC', labelKey: 'memory.category.generation' },
}

// El toolkit (y cualquier writer futuro) puede introducir categorías que el
// viewer no conoce — sin este fallback, config.icon de undefined rompía la card.
const FALLBACK_CATEGORY = { icon: '🗂️', color: '#9CA3AF', labelKey: 'memory.category.other' }

// useSearchParams exige un límite de Suspense en build: el wrapper lo aporta
// aquí mismo para no tocar la página que lo monta.
export default function ProjectMemoryViewer() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32">
          <Loader2 size={24} className="animate-spin text-purple-400" />
        </div>
      }
    >
      <ProjectMemoryViewerInner />
    </Suspense>
  )
}

function ProjectMemoryViewerInner() {
  const { activeClient } = useActiveClient()
  const { activeProject, projects, setActiveProject } = useActiveProject()
  const { locale } = useLocaleContext()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSummary, setEditSummary] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newSummary, setNewSummary] = useState('')
  const [newCategory, setNewCategory] = useState('insight')
  const [saving, setSaving] = useState(false)

  // Prioridad: ?project= en la URL → proyecto activo del contexto → todos.
  const urlProjectId = searchParams.get('project')
  const selectedProjectId = urlProjectId ?? activeProject?.id ?? null

  useEffect(() => {
    fetchMemories()
  }, [selectedCategory, activeClient?.id, selectedProjectId])

  const handleProjectChange = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId) ?? null
    setActiveProject(project)
    // Si la URL forzaba un proyecto, la limpiamos para que mande el contexto.
    if (urlProjectId) router.replace(pathname)
  }

  const fetchMemories = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = new URL('/api/project-memory', window.location.origin)
      if (selectedCategory) url.searchParams.set('category', selectedCategory)
      if (activeClient?.id) url.searchParams.set('clientId', activeClient.id)
      if (selectedProjectId) url.searchParams.set('project_id', selectedProjectId)

      const res = await fetch(url)
      if (!res.ok) throw new Error(t('memory.error-fetch', locale))
      const { data } = await res.json()
      setMemories(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : t('memory.error-unknown', locale))
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePin = async (memoryId: string, isPinned: boolean) => {
    try {
      const res = await fetch('/api/project-memory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId, isPinned: !isPinned }),
      })

      if (!res.ok) throw new Error('Failed to update memory')
      await fetchMemories()
    } catch (err) {
      console.error('Error updating memory:', err)
    }
  }

  const handleArchive = async (memoryId: string) => {
    if (!confirm(t('memory.confirm-archive', locale))) return

    try {
      const res = await fetch('/api/project-memory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId, isArchived: true }),
      })

      if (!res.ok) throw new Error('Failed to archive memory')
      await fetchMemories()
    } catch (err) {
      console.error('Error archiving memory:', err)
    }
  }

  const handleDelete = async (memoryId: string) => {
    if (!confirm(t('memory.confirm-delete', locale))) return
    try {
      const res = await fetch(`/api/project-memory?id=${memoryId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete memory')
      await fetchMemories()
    } catch (err) {
      console.error('Error deleting memory:', err)
    }
  }

  const startEdit = (m: MemoryItem) => {
    setEditingId(m.id)
    setEditTitle(m.title)
    setEditSummary(m.summary)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editTitle.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/project-memory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId: editingId, title: editTitle, summary: editSummary }),
      })
      if (!res.ok) throw new Error('Failed to update memory')
      setEditingId(null)
      await fetchMemories()
    } catch (err) {
      console.error('Error editing memory:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleAddManual = async () => {
    if (!newTitle.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/project-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: activeClient?.id,
          projectId: selectedProjectId,
          title: newTitle,
          category: newCategory,
          summary: newSummary || newTitle,
          sourceDepartment: 'manual',
        }),
      })
      if (!res.ok) throw new Error('Failed to add memory')
      setShowAddForm(false)
      setNewTitle('')
      setNewSummary('')
      setNewCategory('insight')
      await fetchMemories()
    } catch (err) {
      console.error('Error adding memory:', err)
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="px-8 py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(34,197,94,0.8)', letterSpacing: '0.12em' }}>
            {t('memory.kicker', locale)}
          </p>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">{t('memory.title', locale)}</h1>
          <p className="text-sm mt-1 text-ink-tertiary">
            {t('memory.subtitle', locale)}
          </p>
        </div>

        <div className="flex items-end gap-3">
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors"
        >
          <Plus size={15} />
          {t('memory.add-manual', locale)}
        </button>

        {/* Selector compacto de proyecto — filtra la memoria y fija el contexto */}
        <label className="flex items-center gap-2 text-xs text-ink-secondary">
          <span className="uppercase tracking-wide text-[10px] font-semibold">
            {t('projects.selector-label', locale)}
          </span>
          <select
            value={selectedProjectId ?? ''}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="rounded-lg bg-card border border-line px-3 py-2 text-sm text-ink outline-none transition-colors hover:border-line focus:border-line"
          >
            <option value="">{t('projects.all', locale)}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
            {urlProjectId && !projects.some((p) => p.id === urlProjectId) && (
              <option value={urlProjectId}>{t('projects.linked', locale)}</option>
            )}
          </select>
        </label>
        </div>
      </div>

      {/* Alta manual de memoria */}
      {showAddForm && (
        <div className="card p-4 mb-6 space-y-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={t('memory.add-title-ph', locale)}
            className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-sm"
          />
          <textarea
            value={newSummary}
            onChange={(e) => setNewSummary(e.target.value)}
            placeholder={t('memory.add-summary-ph', locale)}
            className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-sm min-h-[72px]"
          />
          <div className="flex items-center gap-2">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="px-3 py-2 bg-surface border border-line rounded-lg text-ink text-sm"
            >
              {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.icon} {t(cfg.labelKey, locale)}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddManual}
              disabled={saving || !newTitle.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {t('memory.add-save', locale)}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-ink-secondary bg-surface hover:bg-surface-hover transition-colors"
            >
              {t('actions.cancel', locale)}
            </button>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedCategory === null
              ? 'bg-ink text-page'
              : 'bg-surface text-ink hover:bg-surface-hover'
          }`}
        >
          {t('memory.filter-all', locale)}
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              selectedCategory === key
                ? 'text-black'
                : 'bg-surface text-ink hover:bg-surface-hover'
            }`}
            style={{
              background: selectedCategory === key ? config.color : undefined,
            }}
          >
            {config.icon} {t(config.labelKey, locale)}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="card p-4 border-red-500/20 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} style={{ color: '#EF4444' }} />
            <div>
              <p className="font-semibold text-red-400">{t('memory.error-title', locale)}</p>
              <p className="text-sm text-ink-secondary mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="card p-8 text-center">
          <Loader2 size={32} className="animate-spin text-purple-400 mx-auto" />
        </div>
      ) : memories.length === 0 ? (
        <div className="card p-8 text-center">
          <BookOpen size={40} className="text-ink-tertiary mx-auto mb-3" />
          <p className="text-ink-secondary">{t('memory.empty', locale)}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {memories.map((memory) => {
            const config = CATEGORY_CONFIG[memory.category] ?? FALLBACK_CATEGORY
            const isEditing = editingId === memory.id
            return (
              <div key={memory.id} className="card p-4 hover:bg-surface-hover transition-colors group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header with category and pin */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{config.icon}</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="flex-1 px-2 py-1 bg-surface border border-line rounded text-sm text-ink"
                        />
                      ) : (
                        <h3 className="text-sm font-semibold text-ink">{memory.title}</h3>
                      )}
                      {memory.is_pinned && (
                        <Pin size={14} className="text-yellow-400 fill-yellow-400" />
                      )}
                    </div>

                    {/* Summary */}
                    {isEditing ? (
                      <textarea
                        value={editSummary}
                        onChange={(e) => setEditSummary(e.target.value)}
                        className="w-full px-2 py-1 mb-2 bg-surface border border-line rounded text-xs text-ink min-h-[60px]"
                      />
                    ) : (
                      <p className="text-xs text-ink-secondary mb-2 line-clamp-2">{memory.summary}</p>
                    )}

                    {/* Meta info */}
                    <div className="flex flex-wrap gap-2 items-center text-xs text-ink-tertiary">
                      <span className="px-2 py-1 rounded bg-surface">{memory.source_department}</span>
                      <span>•</span>
                      <span>{formatDate(memory.created_at)}</span>
                      {memory.tags && memory.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex gap-1">
                            {memory.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="px-2 py-0.5 rounded-full bg-surface text-ink-secondary">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          disabled={saving}
                          className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                          title={t('memory.edit-save', locale)}
                        >
                          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-2 rounded-lg text-ink-secondary hover:text-ink hover:bg-surface transition-colors"
                          title={t('actions.cancel', locale)}
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(memory)}
                          className="p-2 rounded-lg text-ink-secondary hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                          title={t('memory.edit', locale)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleTogglePin(memory.id, memory.is_pinned)}
                          className="p-2 rounded-lg text-ink-secondary hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                          title={memory.is_pinned ? t('memory.unpin', locale) : t('memory.pin', locale)}
                        >
                          <Pin size={16} fill={memory.is_pinned ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          onClick={() => handleArchive(memory.id)}
                          className="p-2 rounded-lg text-ink-secondary hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                          title={t('memory.archive', locale)}
                        >
                          <Archive size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(memory.id)}
                          className="p-2 rounded-lg text-ink-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title={t('memory.delete', locale)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
