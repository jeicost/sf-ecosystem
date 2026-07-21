'use client'

import { useState, useEffect } from 'react'
import { useActiveClient } from '@/lib/client-context'
import { BookOpen, Pin, Archive, Loader2, AlertCircle } from 'lucide-react'

interface MemoryItem {
  id: string
  title: string
  category: 'insight' | 'decision' | 'action' | 'metric' | 'content'
  summary: string
  tags: string[]
  source_department: string
  created_at: string
  is_pinned: boolean
}

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  insight: { icon: '💡', color: '#FCD34D', label: 'Insight' },
  decision: { icon: '📌', color: '#A78BFA', label: 'Decision' },
  action: { icon: '✅', color: '#4ADE80', label: 'Action' },
  metric: { icon: '📊', color: '#60A5FA', label: 'Metric' },
  content: { icon: '📝', color: '#F87171', label: 'Content' },
}

export default function ProjectMemoryViewer() {
  const { activeClient } = useActiveClient()
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    fetchMemories()
  }, [selectedCategory, activeClient?.id])

  const fetchMemories = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = new URL('/api/project-memory', window.location.origin)
      if (selectedCategory) url.searchParams.set('category', selectedCategory)
      if (activeClient?.id) url.searchParams.set('clientId', activeClient.id)

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch project memory')
      const { data } = await res.json()
      setMemories(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
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
    if (!confirm('Archive this memory?')) return

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(34,197,94,0.8)', letterSpacing: '0.12em' }}>
          PROJECT INTELLIGENCE
        </p>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Project Memory</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Insights, decisions, and actions from your toolkit results. Build institutional knowledge.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedCategory === null
              ? 'bg-white text-black'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          All
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              selectedCategory === key
                ? 'text-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            style={{
              background: selectedCategory === key ? config.color : undefined,
            }}
          >
            {config.icon} {config.label}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="card p-4 border-red-500/20 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} style={{ color: '#EF4444' }} />
            <div>
              <p className="font-semibold text-red-400">Error</p>
              <p className="text-sm text-gray-400 mt-1">{error}</p>
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
          <BookOpen size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No memories yet. Save quick action results to build your project knowledge base.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {memories.map((memory) => {
            const config = CATEGORY_CONFIG[memory.category]
            return (
              <div key={memory.id} className="card p-4 hover:bg-white/5 transition-colors group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header with category and pin */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{config.icon}</span>
                      <h3 className="text-sm font-semibold text-white">{memory.title}</h3>
                      {memory.is_pinned && (
                        <Pin size={14} className="text-yellow-400 fill-yellow-400" />
                      )}
                    </div>

                    {/* Summary */}
                    <p className="text-xs text-gray-400 mb-2 line-clamp-2">{memory.summary}</p>

                    {/* Meta info */}
                    <div className="flex flex-wrap gap-2 items-center text-xs text-gray-500">
                      <span className="px-2 py-1 rounded bg-white/5">{memory.source_department}</span>
                      <span>•</span>
                      <span>{formatDate(memory.created_at)}</span>
                      {memory.tags && memory.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex gap-1">
                            {memory.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
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
                    <button
                      onClick={() => handleTogglePin(memory.id, memory.is_pinned)}
                      className="p-2 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                      title={memory.is_pinned ? 'Unpin' : 'Pin'}
                    >
                      <Pin size={16} fill={memory.is_pinned ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => handleArchive(memory.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Archive"
                    >
                      <Archive size={16} />
                    </button>
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
