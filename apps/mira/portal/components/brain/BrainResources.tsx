'use client'
import { useEffect, useState } from 'react'
import { Trash2, Plus, Link as LinkIcon } from 'lucide-react'
import { BrainResource, ResourceType, SocialChannel } from '@/lib/types/brain'
import { createClient } from '@/lib/supabase'

interface BrainResourcesProps {
  clientId: string
}

const RESOURCE_TYPES: Array<{ value: ResourceType; label: string; emoji: string }> = [
  { value: 'logo', label: 'Logo', emoji: '📌' },
  { value: 'social_profile', label: 'Social Profile', emoji: '📱' },
  { value: 'presentation', label: 'Presentation', emoji: '📊' },
  { value: 'document', label: 'Document', emoji: '📄' },
  { value: 'reference_url', label: 'Reference', emoji: '🔗' },
]

const SOCIAL_CHANNELS: SocialChannel[] = ['linkedin', 'twitter', 'instagram', 'tiktok', 'youtube', 'discord']

export default function BrainResources({ clientId }: BrainResourcesProps) {
  const [resources, setResources] = useState<BrainResource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    resourceType: 'social_profile' as ResourceType,
    channel: 'linkedin' as SocialChannel | null,
    name: '',
    url: '',
  })

  const db = createClient()

  useEffect(() => {
    const fetchResources = async () => {
      const { data } = await db
        .from('brain_resources')
        .select('*')
        .eq('client_id', clientId)
        .order('connected_at', { ascending: false })

      if (data) {
        setResources(data)
      }
      setIsLoading(false)
    }

    fetchResources()
  }, [clientId, db])

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await db.from('brain_resources').insert({
      client_id: clientId,
      resource_type: formData.resourceType,
      channel: formData.resourceType === 'social_profile' ? formData.channel : null,
      name: formData.name,
      url: formData.url,
      metadata: {},
    })

    if (!error) {
      const { data } = await db
        .from('brain_resources')
        .select('*')
        .eq('client_id', clientId)
        .order('connected_at', { ascending: false })

      if (data) setResources(data)
      setShowForm(false)
      setFormData({
        resourceType: 'social_profile',
        channel: 'linkedin',
        name: '',
        url: '',
      })
    }
  }

  const handleDeleteResource = async (resourceId: string) => {
    const { error } = await db.from('brain_resources').delete().eq('id', resourceId)

    if (!error) {
      setResources((prev) => prev.filter((r) => r.id !== resourceId))
    }
  }

  const groupedResources = RESOURCE_TYPES.map((type) => ({
    ...type,
    items: resources.filter((r) => r.resource_type === type.value),
  }))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-ink-tertiary">Loading resources...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Resource Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded bg-[#EC4899] text-white text-sm font-medium hover:bg-[#E00B7F]"
        >
          <Plus size={16} />
          Add Resource
        </button>
      )}

      {/* Add Resource Form */}
      {showForm && (
        <form onSubmit={handleAddResource} className="card p-4 border border-[#EC4899]/30 space-y-3">
          <select
            value={formData.resourceType}
            onChange={(e) => {
              const newType = e.target.value as ResourceType
              setFormData({
                ...formData,
                resourceType: newType,
                channel: newType === 'social_profile' ? 'linkedin' : null,
              })
            }}
            className="w-full px-3 py-2 rounded bg-surface border border-line text-sm text-ink focus:outline-none focus:border-[#EC4899]"
          >
            {RESOURCE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.emoji} {type.label}
              </option>
            ))}
          </select>

          {formData.resourceType === 'social_profile' && (
            <select
              value={formData.channel || ''}
              onChange={(e) => setFormData({ ...formData, channel: e.target.value as SocialChannel })}
              className="w-full px-3 py-2 rounded bg-surface border border-line text-sm text-ink focus:outline-none focus:border-[#EC4899]"
            >
              {SOCIAL_CHANNELS.map((ch) => (
                <option key={ch} value={ch} className="capitalize">
                  {ch}
                </option>
              ))}
            </select>
          )}

          <input
            type="text"
            placeholder="Name / Handle"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-3 py-2 rounded bg-surface border border-line text-sm text-ink placeholder-ink-tertiary focus:outline-none focus:border-[#EC4899]"
          />

          <input
            type="url"
            placeholder="URL"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            className="w-full px-3 py-2 rounded bg-surface border border-line text-sm text-ink placeholder-ink-tertiary focus:outline-none focus:border-[#EC4899]"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-3 py-2 rounded bg-[#10B981] text-white text-sm font-medium hover:bg-[#059669]"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 px-3 py-2 rounded bg-surface text-ink-secondary text-sm font-medium hover:bg-surface-hover"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Resources by Type */}
      {groupedResources.map((group) => (
        <div key={group.value}>
          {group.items.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-ink-tertiary uppercase">
                {group.emoji} {group.label}
              </div>
              <div className="space-y-2">
                {group.items.map((resource) => (
                  <div
                    key={resource.id}
                    className="card p-3 border border-line-subtle flex items-center justify-between hover:border-line"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-ink truncate">
                        {resource.channel && (
                          <span className="text-ink-secondary">[{resource.channel}] </span>
                        )}
                        {resource.name}
                      </div>
                      {resource.url && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#EC4899] hover:text-[#FF1493] truncate flex items-center gap-1 mt-1"
                        >
                          <LinkIcon size={12} />
                          {resource.url.replace(/^https?:\/\//, '')}
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteResource(resource.id)}
                      className="ml-2 p-1 text-ink-tertiary hover:text-[#FF6B6B] transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {resources.length === 0 && !showForm && (
        <div className="text-center py-12">
          <div className="text-4xl mb-2">📦</div>
          <div className="text-sm text-ink-secondary">No resources connected yet</div>
        </div>
      )}
    </div>
  )
}
