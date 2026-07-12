'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, Check, AlertCircle, Upload } from 'lucide-react'
import BrandBrainSuggestions from './BrandBrainSuggestions'

interface BrandData {
  identity?: Record<string, string>
  what_it_is?: string
  audiences?: any[]
  value_proposition?: string
  hero_features?: Record<string, string>
  business_model?: string
  tone_and_voice?: Record<string, string>
  visual_identity?: string
  competitive_positioning?: string
  go_to_market?: string
  strategy_roadmap?: string
}

interface BrandProfile {
  id: string
  client_id: string
  name: string
  mission: string
  tone_of_voice: Record<string, string>
  values: string[]
  description: string
  brand_data?: BrandData
  created_at: string
  updated_at: string
}

type TabType = 'identity' | 'what_it_is' | 'audiences' | 'value_prop' | 'features' | 'business' | 'tone' | 'visual' | 'competitive' | 'go_to_market' | 'strategy' | 'documents'

export default function BrandBrainEditor() {
  const [profile, setProfile] = useState<BrandProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('identity')
  const [documents, setDocuments] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<Record<string, any> | null>(null)
  const [analyzing, setAnalyzing] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/brand-brain')
        if (!res.ok) throw new Error('Failed to fetch brand profile')
        const { data } = await res.json()
        setProfile(data || {
          id: '',
          client_id: '',
          name: '',
          mission: '',
          tone_of_voice: {},
          values: [],
          description: '',
          brand_data: {
            identity: { name: '', mission: '', vision: '', tagline: '', one_liner: '', enemy: '' },
            what_it_is: '',
            audiences: [],
            value_proposition: '',
            hero_features: { feature_1: '', feature_2: '', feature_3: '' },
            business_model: '',
            tone_and_voice: {},
            visual_identity: '',
            competitive_positioning: '',
            go_to_market: '',
            strategy_roadmap: '',
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        // Fetch documents
        const docsRes = await fetch('/api/brand-brain/documents')
        if (docsRes.ok) {
          const { data: docs } = await docsRes.json()
          setDocuments(docs || [])
        }
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

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('brand_profile_id', profile.id)

      const res = await fetch('/api/brand-brain/upload-document', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to upload document')
      }

      const { data: newDoc } = await res.json()
      setDocuments([...documents, newDoc])
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)

      // Automatically trigger analysis
      if (newDoc?.id) {
        analyzeDocument(newDoc.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setUploading(false)
    }
  }

  const analyzeDocument = async (documentId: string) => {
    setAnalyzing(documentId)
    try {
      const res = await fetch('/api/brand-brain/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: documentId }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Analysis failed')
      }

      const { suggestedUpdates } = await res.json()
      setSuggestions(suggestedUpdates)

      // Update document status in list
      setDocuments(
        documents.map((doc) =>
          doc.id === documentId ? { ...doc, analysis_status: 'completed' } : doc
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setDocuments(
        documents.map((doc) =>
          doc.id === documentId ? { ...doc, analysis_status: 'failed' } : doc
        )
      )
    } finally {
      setAnalyzing(null)
    }
  }

  const handleApplySuggestions = async (updates: Record<string, any>) => {
    if (!profile) return

    setSaving(true)
    setError(null)

    try {
      const newBrandData = { ...profile.brand_data } as BrandData

      // Deep merge for nested objects (identity, hero_features, tone_and_voice)
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          const existingValue = newBrandData[key as keyof BrandData]
          if (typeof value === 'object' && !Array.isArray(value) && typeof existingValue === 'object' && !Array.isArray(existingValue)) {
            // Deep merge for nested objects
            newBrandData[key as keyof BrandData] = { ...existingValue, ...value }
          } else {
            // Direct assignment for primitives and arrays
            newBrandData[key as keyof BrandData] = value
          }
        }
      })

      setProfile({ ...profile, brand_data: newBrandData })
      setSuggestions(null)

      // Auto-save
      const res = await fetch('/api/brand-brain', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, brand_data: newBrandData }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to save')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      // Revert UI to previous state on error
      setSuggestions(null)
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

      {suggestions && (
        <BrandBrainSuggestions
          documentId=""
          suggestions={suggestions}
          onApply={handleApplySuggestions}
          onDismiss={() => setSuggestions(null)}
        />
      )}

      {/* Tabs - 11 Fields + Documents */}
      <div className="flex gap-1 mb-6 border-b border-white/10 overflow-x-auto pb-2">
        {[
          { id: 'identity', label: '🎯 Identity', icon: '📛' },
          { id: 'what_it_is', label: '❓ What It Is', icon: '📝' },
          { id: 'audiences', label: '👥 Audiences', icon: '🎯' },
          { id: 'value_prop', label: '💎 Value Prop', icon: '✨' },
          { id: 'features', label: '⭐ Hero Features', icon: '🚀' },
          { id: 'business', label: '💰 Business Model', icon: '💵' },
          { id: 'tone', label: '💬 Tone & Voice', icon: '🗣️' },
          { id: 'visual', label: '🎨 Visual Identity', icon: '🎭' },
          { id: 'competitive', label: '⚔️ Competitive', icon: '🎯' },
          { id: 'go_to_market', label: '🚀 Go-to-Market', icon: '📢' },
          { id: 'strategy', label: '📋 Strategy', icon: '📊' },
          { id: 'documents', label: '📄 Documents', icon: '📁' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-3 py-3 text-xs font-medium transition-all whitespace-nowrap ${
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

      {/* Tab Content - 11 Fields */}
      <div className="card p-6 mb-6 space-y-4">
        {activeTab === 'identity' && (
          <div className="space-y-4">
            <TextInput label="Brand Name" value={profile.brand_data?.identity?.name || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, identity: { ...profile.brand_data?.identity, name: v } } })} placeholder="e.g., Discoolver" />
            <TextInput label="Tagline" value={profile.brand_data?.identity?.tagline || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, identity: { ...profile.brand_data?.identity, tagline: v } } })} placeholder="Short, memorable phrase" />
            <TextInput label="One-Liner" value={profile.brand_data?.identity?.one_liner || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, identity: { ...profile.brand_data?.identity, one_liner: v } } })} placeholder="What does your brand do?" />
            <TextareaInput label="Mission" value={profile.brand_data?.identity?.mission || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, identity: { ...profile.brand_data?.identity, mission: v } } })} placeholder="Your mission and purpose" />
            <TextareaInput label="Vision" value={profile.brand_data?.identity?.vision || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, identity: { ...profile.brand_data?.identity, vision: v } } })} placeholder="Your long-term vision" />
            <TextInput label="Enemy" value={profile.brand_data?.identity?.enemy || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, identity: { ...profile.brand_data?.identity, enemy: v } } })} placeholder="What do you compete against? (mindset, competitor, problem)" />
          </div>
        )}

        {activeTab === 'what_it_is' && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-white">What Your Brand Is (5-7 simultaneous things)</label>
            <TextareaInput value={profile.brand_data?.what_it_is || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, what_it_is: v } })} placeholder="1. Curated discovery platform&#10;2. Influencer-powered marketplace&#10;3. AI-assisted city explorer&#10;..." />
            <p className="text-xs text-gray-500">Separate each item with a line break</p>
          </div>
        )}

        {activeTab === 'audiences' && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-white">Primary Audiences</label>
            <TextareaInput value={(profile.brand_data?.audiences || []).join('\n')} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, audiences: v.split('\n').filter(a => a.trim()) } })} placeholder="Segment 1&#10;Segment 2&#10;Segment 3&#10;Segment 4" />
            <p className="text-xs text-gray-500">One audience per line (e.g., Entrepreneurs, Enterprises, Corporates, Startups)</p>
          </div>
        )}

        {activeTab === 'value_prop' && (
          <div className="space-y-4">
            <TextareaInput label="Value Proposition" value={profile.brand_data?.value_proposition || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, value_proposition: v } })} placeholder="Problems you solve + emotional promise + time/money saved" />
          </div>
        )}

        {activeTab === 'features' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 mb-4">Three hero features/differentiators that lead your narrative</p>
            <TextInput label="Feature 1" value={profile.brand_data?.hero_features?.feature_1 || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, hero_features: { ...profile.brand_data?.hero_features, feature_1: v } } })} />
            <TextInput label="Feature 2" value={profile.brand_data?.hero_features?.feature_2 || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, hero_features: { ...profile.brand_data?.hero_features, feature_2: v } } })} />
            <TextInput label="Feature 3" value={profile.brand_data?.hero_features?.feature_3 || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, hero_features: { ...profile.brand_data?.hero_features, feature_3: v } } })} />
          </div>
        )}

        {activeTab === 'business' && (
          <div className="space-y-4">
            <TextareaInput label="Business Model" value={profile.brand_data?.business_model || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, business_model: v } })} placeholder="Revenue streams, pricing tiers, customer types (B2C/B2B/B2B2C)" />
          </div>
        )}

        {activeTab === 'tone' && (
          <div className="space-y-4">
            <TextareaInput label="Tone & Voice + Key Messages" value={profile.brand_data?.tone_and_voice ? Object.entries(profile.brand_data.tone_and_voice).map(([k, v]) => `${k}: ${v}`).join('\n') : ''} onChange={(v) => {
              const tone: Record<string, string> = {}
              v.split('\n').forEach(line => {
                const [k, ...rest] = line.split(':')
                if (k && rest.length > 0) tone[k.trim()] = rest.join(':').trim()
              })
              setProfile({ ...profile, brand_data: { ...profile.brand_data, tone_and_voice: tone } })
            }} placeholder="Professional: Executive communication&#10;Accessible: Understandable by anyone&#10;Innovative: Forward-thinking" />
          </div>
        )}

        {activeTab === 'visual' && (
          <div className="space-y-4">
            <TextareaInput label="Visual Identity" value={profile.brand_data?.visual_identity || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, visual_identity: v } })} placeholder="Primary color, secondary colors, typography, logo style, aesthetic" />
          </div>
        )}

        {activeTab === 'competitive' && (
          <div className="space-y-4">
            <TextareaInput label="Competitive Positioning" value={profile.brand_data?.competitive_positioning || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, competitive_positioning: v } })} placeholder="Who are competitors, what makes you unique, market opportunities" />
          </div>
        )}

        {activeTab === 'go_to_market' && (
          <div className="space-y-4">
            <TextareaInput label="Go-to-Market & Channels" value={profile.brand_data?.go_to_market || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, go_to_market: v } })} placeholder="How you reach customers, main channels (Instagram, LinkedIn, Events, etc.), tactics" />
          </div>
        )}

        {activeTab === 'strategy' && (
          <div className="space-y-4">
            <TextareaInput label="Strategy & Roadmap" value={profile.brand_data?.strategy_roadmap || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, strategy_roadmap: v } })} placeholder="90-day plan, growth model, strategic principles, key milestones" />
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-white">Upload Brand Documents</label>
            <p className="text-xs text-gray-400">Upload brand books, handbooks, pitch decks, or strategy docs. Our AI will analyze and suggest updates to your Brand Brain fields.</p>

            <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center hover:border-purple-500/50 transition-colors">
              <input
                type="file"
                id="doc-upload"
                onChange={handleDocumentUpload}
                disabled={uploading}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
              />
              <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload size={24} className="text-gray-400" />
                <span className="text-sm text-gray-400">{uploading ? 'Uploading...' : 'Click to upload or drag files'}</span>
                <span className="text-xs text-gray-500">PDF, DOC, DOCX, or TXT</span>
              </label>
            </div>

            {documents.length > 0 && (
              <div className="mt-6 space-y-2">
                <p className="text-sm font-medium text-white">Uploaded Documents</p>
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded text-sm">
                    <div className="flex-1">
                      <p className="text-gray-300">{doc.original_filename}</p>
                      <p className="text-xs text-gray-500 mt-1">{doc.document_type.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {analyzing === doc.id ? (
                        <>
                          <Loader2 size={14} className="animate-spin text-blue-400" />
                          <span className="text-xs text-blue-300">Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              doc.analysis_status === 'completed'
                                ? 'bg-green-500/20 text-green-300'
                                : doc.analysis_status === 'processing'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : doc.analysis_status === 'failed'
                                    ? 'bg-red-500/20 text-red-300'
                                    : 'bg-purple-500/20 text-purple-300'
                            }`}
                          >
                            {doc.analysis_status}
                          </span>
                          {doc.analysis_status !== 'completed' && (
                            <button
                              onClick={() => analyzeDocument(doc.id)}
                              className="text-xs px-2 py-1 rounded text-purple-300 hover:bg-purple-500/20 transition-colors"
                            >
                              Retry
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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

// Helper components
function TextInput({ label, value, onChange, placeholder }: { label?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-white mb-2">{label}</label>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors text-sm"
      />
    </div>
  )
}

function TextareaInput({ label, value, onChange, placeholder }: { label?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-white mb-2">{label}</label>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors h-32 resize-none text-sm"
      />
    </div>
  )
}
