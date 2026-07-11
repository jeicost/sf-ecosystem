'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, Check, AlertCircle } from 'lucide-react'

interface BrandProfile {
  id: string
  name: string
  mission: string
  tone_of_voice: Record<string, string>
  values: string[]
  description: string
  created_at: string
  updated_at: string
}

export default function BrandBrainEditor() {
  const [profile, setProfile] = useState<BrandProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'name' | 'mission' | 'tone' | 'values'>('name')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/brand-brain')
        if (!res.ok) throw new Error('Failed to fetch brand profile')
        const { data } = await res.json()
        setProfile(data || {
          id: '',
          name: '',
          mission: '',
          tone_of_voice: {},
          values: [],
          description: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    setSuccess(false)
    setError(null)

    try {
      const res = await fetch('/api/brand-brain', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to save brand profile')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-purple-400" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="px-8 py-8">
        <div className="card p-6 border-red-500/20">
          <p className="text-red-400">Failed to load brand profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(168,85,247,0.8)', letterSpacing: '0.12em' }}>
          BRAND INTELLIGENCE
        </p>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Brand Brain</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Define your brand context. This guides all AI generation across the platform.
        </p>
      </div>

      {/* Alerts */}
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

      {success && (
        <div className="card p-4 border-green-500/20 mb-6">
          <div className="flex items-start gap-3">
            <Check size={20} style={{ color: '#22C55E' }} />
            <div>
              <p className="font-semibold text-green-400">Saved successfully</p>
              <p className="text-sm text-gray-400 mt-1">Your brand profile has been updated</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10">
        {[
          { id: 'name', label: '📛 Brand Name' },
          { id: 'mission', label: '🎯 Mission' },
          { id: 'tone', label: '💬 Tone of Voice' },
          { id: 'values', label: '✨ Values' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'text-white border-b-2'
                : 'text-gray-400 border-b-2 border-transparent hover:text-white'
            }`}
            style={{
              borderBottomColor: activeTab === tab.id ? '#A855F7' : 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card p-6 mb-6">
        {activeTab === 'name' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Brand Name</label>
              <input
                type="text"
                value={profile.name || ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="e.g., Dadybox"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Short Description</label>
              <textarea
                value={profile.description || ''}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                placeholder="One-line description of your brand"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors h-20 resize-none"
              />
            </div>
          </div>
        )}

        {activeTab === 'mission' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Mission Statement</label>
              <textarea
                value={profile.mission || ''}
                onChange={(e) => setProfile({ ...profile, mission: e.target.value })}
                placeholder="What is your brand's mission and purpose?"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors h-32 resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">Guides the voice and goals of AI generation</p>
            </div>
          </div>
        )}

        {activeTab === 'tone' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Tone Attributes</label>
              <p className="text-xs text-gray-400 mb-3">Define your communication style (e.g., professional, casual, humorous)</p>
              <div className="space-y-2">
                {Object.entries(profile.tone_of_voice || {}).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => {
                        const newTone = { ...profile.tone_of_voice }
                        delete newTone[key]
                        newTone[e.target.value] = value
                        setProfile({ ...profile, tone_of_voice: newTone })
                      }}
                      placeholder="Attribute (e.g., Formality)"
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-gray-500 text-sm"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => {
                        setProfile({
                          ...profile,
                          tone_of_voice: { ...profile.tone_of_voice, [key]: e.target.value },
                        })
                      }}
                      placeholder="Value (e.g., Professional)"
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-gray-500 text-sm"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const newKey = `attribute_${Object.keys(profile.tone_of_voice || {}).length + 1}`
                  setProfile({
                    ...profile,
                    tone_of_voice: { ...profile.tone_of_voice, [newKey]: '' },
                  })
                }}
                className="mt-3 px-3 py-2 rounded text-sm font-medium text-purple-400 hover:bg-purple-500/10 transition-colors"
              >
                + Add Attribute
              </button>
            </div>
          </div>
        )}

        {activeTab === 'values' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Brand Values</label>
              <p className="text-xs text-gray-400 mb-3">List your core values (one per line)</p>
              <textarea
                value={(profile.values || []).join('\n')}
                onChange={(e) => setProfile({ ...profile, values: e.target.value.split('\n').filter(v => v.trim()) })}
                placeholder="Innovation&#10;Customer-first&#10;Transparency"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors h-32 resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-3 rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {saving ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save size={16} />
            Save Brand Brain
          </>
        )}
      </button>
    </div>
  )
}
