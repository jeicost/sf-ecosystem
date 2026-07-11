'use client'
import { useEffect, useState } from 'react'
import { Trash2, Plus, Edit2, Check } from 'lucide-react'
import { ContentPillar } from '@/lib/types'
import { createClient } from '@/lib/supabase'
import { EditableTagList } from './EditableTagList'

interface ContentPillarsProps {
  clientId: string
}

interface Notification {
  id: string
  message: string
  type: 'success' | 'error'
  timeout?: number
}

export default function ContentPillars({ clientId }: ContentPillarsProps) {
  const [pillars, setPillars] = useState<ContentPillar[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirming, setDeleteConfirming] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    weight: 5,
    sub_topics: [] as string[],
    example_hooks: [] as string[],
    cta_patterns: [] as string[],
    is_active: true,
  })

  const [editFormData, setEditFormData] = useState(formData)

  const db = createClient()

  const addNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9)
    const notification: Notification = { id, message, type }
    setNotifications((prev) => [...prev, notification])

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 3000)
  }

  useEffect(() => {
    const fetchPillars = async () => {
      try {
        const { data, error } = await db
          .from('content_pillars')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })

        if (error) {
          addNotification('Failed to load content pillars', 'error')
        } else if (data) {
          setPillars(data)
        }
      } catch (err) {
        addNotification('Error loading content pillars', 'error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPillars()
  }, [clientId, db])

  const resetFormData = () => {
    setFormData({
      name: '',
      description: '',
      weight: 5,
      sub_topics: [],
      example_hooks: [],
      cta_patterns: [],
      is_active: true,
    })
    setEditFormData({
      name: '',
      description: '',
      weight: 5,
      sub_topics: [],
      example_hooks: [],
      cta_patterns: [],
      is_active: true,
    })
  }

  const handleCreatePillar = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      addNotification('Pillar name is required', 'error')
      return
    }

    try {
      const { error } = await db.from('content_pillars').insert({
        client_id: clientId,
        name: formData.name,
        description: formData.description || null,
        weight: formData.weight,
        sub_topics: formData.sub_topics.length > 0 ? formData.sub_topics : null,
        example_hooks: formData.example_hooks.length > 0 ? formData.example_hooks : null,
        cta_patterns: formData.cta_patterns.length > 0 ? formData.cta_patterns : null,
        is_active: formData.is_active,
      })

      if (error) {
        addNotification('Failed to create pillar', 'error')
      } else {
        // Optimistic update
        const newPillar: ContentPillar = {
          id: Math.random().toString(36).substr(2, 9),
          client_id: clientId,
          name: formData.name,
          description: formData.description || null,
          weight: formData.weight,
          sub_topics: formData.sub_topics.length > 0 ? formData.sub_topics : null,
          example_hooks: formData.example_hooks.length > 0 ? formData.example_hooks : null,
          cta_patterns: formData.cta_patterns.length > 0 ? formData.cta_patterns : null,
          is_active: formData.is_active,
          created_at: new Date().toISOString(),
        }
        setPillars((prev) => [newPillar, ...prev])

        addNotification('Pillar created successfully', 'success')
        setShowCreateForm(false)
        resetFormData()

        // Refetch to get real ID from database
        setTimeout(() => {
          const fetchUpdated = async () => {
            const { data } = await db
              .from('content_pillars')
              .select('*')
              .eq('client_id', clientId)
              .order('created_at', { ascending: false })
            if (data) setPillars(data)
          }
          fetchUpdated()
        }, 500)
      }
    } catch (err) {
      addNotification('Error creating pillar', 'error')
    }
  }

  const handleUpdatePillar = async (id: string) => {
    if (!editFormData.name.trim()) {
      addNotification('Pillar name is required', 'error')
      return
    }

    try {
      const { error } = await db
        .from('content_pillars')
        .update({
          name: editFormData.name,
          description: editFormData.description || null,
          weight: editFormData.weight,
          sub_topics: editFormData.sub_topics.length > 0 ? editFormData.sub_topics : null,
          example_hooks: editFormData.example_hooks.length > 0 ? editFormData.example_hooks : null,
          cta_patterns: editFormData.cta_patterns.length > 0 ? editFormData.cta_patterns : null,
          is_active: editFormData.is_active,
        })
        .eq('id', id)
        .eq('client_id', clientId)

      if (error) {
        addNotification('Failed to update pillar', 'error')
      } else {
        // Optimistic update
        setPillars((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  name: editFormData.name,
                  description: editFormData.description || null,
                  weight: editFormData.weight,
                  sub_topics: editFormData.sub_topics.length > 0 ? editFormData.sub_topics : null,
                  example_hooks: editFormData.example_hooks.length > 0 ? editFormData.example_hooks : null,
                  cta_patterns: editFormData.cta_patterns.length > 0 ? editFormData.cta_patterns : null,
                  is_active: editFormData.is_active,
                }
              : p
          )
        )

        addNotification('Pillar updated successfully', 'success')
        setEditingId(null)
      }
    } catch (err) {
      addNotification('Error updating pillar', 'error')
    }
  }

  const handleDeletePillar = async (id: string) => {
    try {
      const { error } = await db.from('content_pillars').delete().eq('id', id).eq('client_id', clientId)

      if (error) {
        addNotification('Failed to delete pillar', 'error')
      } else {
        // Optimistic update
        setPillars((prev) => prev.filter((p) => p.id !== id))
        addNotification('Pillar deleted successfully', 'success')
        setDeleteConfirming(null)
      }
    } catch (err) {
      addNotification('Error deleting pillar', 'error')
    }
  }

  const startEditingPillar = (pillar: ContentPillar) => {
    setEditFormData({
      name: pillar.name,
      description: pillar.description || '',
      weight: pillar.weight,
      sub_topics: pillar.sub_topics || [],
      example_hooks: pillar.example_hooks || [],
      cta_patterns: pillar.cta_patterns || [],
      is_active: pillar.is_active,
    })
    setEditingId(pillar.id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#666]">Loading content pillars...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`px-4 py-3 rounded text-sm font-medium text-white ${
              notif.type === 'success' ? 'bg-[#10B981]' : 'bg-[#FF6B6B]'
            }`}
          >
            {notif.message}
          </div>
        ))}
      </div>

      {/* Add Pillar Button */}
      {!showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded bg-[#EC4899] text-white text-sm font-medium hover:bg-[#E00B7F]"
        >
          <Plus size={16} />
          New Pillar
        </button>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <form onSubmit={handleCreatePillar} className="card p-4 border border-[#EC4899]30 space-y-3">
          <input
            type="text"
            placeholder="Pillar name (required)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-3 py-2 rounded bg-[#1E1E1E] border border-[#333] text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#EC4899]"
          />

          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 rounded bg-[#1E1E1E] border border-[#333] text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#EC4899] resize-none"
          />

          <div>
            <label className="text-xs font-semibold text-[#999] uppercase mb-2 block">Weight (1-10)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
              className="w-full px-3 py-2 rounded bg-[#1E1E1E] border border-[#333] text-sm text-white focus:outline-none focus:border-[#EC4899]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#999] uppercase mb-2 block">Sub-Topics</label>
            <EditableTagList
              tags={formData.sub_topics}
              onChange={(tags) => setFormData({ ...formData, sub_topics: tags })}
              placeholder="Add sub-topic..."
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#999] uppercase mb-2 block">Example Hooks</label>
            <EditableTagList
              tags={formData.example_hooks}
              onChange={(tags) => setFormData({ ...formData, example_hooks: tags })}
              placeholder="Add hook..."
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#999] uppercase mb-2 block">CTA Patterns</label>
            <EditableTagList
              tags={formData.cta_patterns}
              onChange={(tags) => setFormData({ ...formData, cta_patterns: tags })}
              placeholder="Add CTA pattern..."
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-white">Active</span>
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-3 py-2 rounded bg-[#10B981] text-white text-sm font-medium hover:bg-[#059669]"
            >
              Create Pillar
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false)
                resetFormData()
              }}
              className="flex-1 px-3 py-2 rounded bg-[#333] text-[#999] text-sm font-medium hover:bg-[#444]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Pillars Grid */}
      <div className="grid gap-4 grid-cols-1">
        {pillars.map((pillar) => (
          <div key={pillar.id}>
            {editingId === pillar.id ? (
              // Edit Mode
              <form onSubmit={(e) => {
                e.preventDefault()
                handleUpdatePillar(pillar.id)
              }} className="card p-4 border border-[#EC4899]30 space-y-3">
                <input
                  type="text"
                  placeholder="Pillar name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded bg-[#1E1E1E] border border-[#333] text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#EC4899]"
                />

                <textarea
                  placeholder="Description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded bg-[#1E1E1E] border border-[#333] text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#EC4899] resize-none"
                />

                <div>
                  <label className="text-xs font-semibold text-[#999] uppercase mb-2 block">Weight (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editFormData.weight}
                    onChange={(e) => setEditFormData({ ...editFormData, weight: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded bg-[#1E1E1E] border border-[#333] text-sm text-white focus:outline-none focus:border-[#EC4899]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#999] uppercase mb-2 block">Sub-Topics</label>
                  <EditableTagList
                    tags={editFormData.sub_topics}
                    onChange={(tags) => setEditFormData({ ...editFormData, sub_topics: tags })}
                    placeholder="Add sub-topic..."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#999] uppercase mb-2 block">Example Hooks</label>
                  <EditableTagList
                    tags={editFormData.example_hooks}
                    onChange={(tags) => setEditFormData({ ...editFormData, example_hooks: tags })}
                    placeholder="Add hook..."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#999] uppercase mb-2 block">CTA Patterns</label>
                  <EditableTagList
                    tags={editFormData.cta_patterns}
                    onChange={(tags) => setEditFormData({ ...editFormData, cta_patterns: tags })}
                    placeholder="Add CTA pattern..."
                  />
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editFormData.is_active}
                    onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-white">Active</span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-3 py-2 rounded bg-[#10B981] text-white text-sm font-medium hover:bg-[#059669] flex items-center justify-center gap-2"
                  >
                    <Check size={16} />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="flex-1 px-3 py-2 rounded bg-[#333] text-[#999] text-sm font-medium hover:bg-[#444]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : deleteConfirming === pillar.id ? (
              // Delete Confirmation
              <div className="card p-4 border border-[#FF6B6B]30 space-y-3">
                <div className="text-sm text-white">
                  Are you sure you want to delete <strong>{pillar.name}</strong>?
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeletePillar(pillar.id)}
                    className="flex-1 px-3 py-2 rounded bg-[#FF6B6B] text-white text-sm font-medium hover:bg-[#FF5252]"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setDeleteConfirming(null)}
                    className="flex-1 px-3 py-2 rounded bg-[#333] text-[#999] text-sm font-medium hover:bg-[#444]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="card p-4 border border-[#1E1E1E] hover:border-[#333] space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{pillar.name}</h3>
                      {!pillar.is_active && (
                        <span className="text-xs px-2 py-1 rounded bg-[#333] text-[#999]">Inactive</span>
                      )}
                    </div>
                    {pillar.description && (
                      <p className="text-xs text-[#999] mt-1">{pillar.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={() => startEditingPillar(pillar)}
                      className="p-1 text-[#666] hover:text-[#EC4899] transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirming(pillar.id)}
                      className="p-1 text-[#666] hover:text-[#FF6B6B] transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Weight */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#666]">Weight:</span>
                  <div className="w-32 bg-[#1E1E1E] rounded h-2">
                    <div
                      className="bg-[#EC4899] h-2 rounded"
                      style={{ width: `${(pillar.weight / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-[#999]">{pillar.weight}/10</span>
                </div>

                {/* Sub-Topics */}
                {pillar.sub_topics && pillar.sub_topics.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-[#666] uppercase mb-1">Sub-Topics</div>
                    <div className="flex flex-wrap gap-1">
                      {pillar.sub_topics.map((topic, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 rounded bg-[#1E1E1E] text-[#999]">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Example Hooks */}
                {pillar.example_hooks && pillar.example_hooks.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-[#666] uppercase mb-1">Example Hooks</div>
                    <div className="flex flex-wrap gap-1">
                      {pillar.example_hooks.map((hook, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 rounded bg-[#1E1E1E] text-[#999]">
                          {hook}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA Patterns */}
                {pillar.cta_patterns && pillar.cta_patterns.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-[#666] uppercase mb-1">CTA Patterns</div>
                    <div className="flex flex-wrap gap-1">
                      {pillar.cta_patterns.map((cta, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 rounded bg-[#1E1E1E] text-[#999]">
                          {cta}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {pillars.length === 0 && !showCreateForm && (
        <div className="text-center py-12">
          <div className="text-4xl mb-2">📚</div>
          <div className="text-sm text-[#999]">No content pillars yet. Create your first one to get started.</div>
        </div>
      )}
    </div>
  )
}
