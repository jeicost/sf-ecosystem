'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, Check, AlertCircle, Upload } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import BrandBrainSuggestions from './BrandBrainSuggestions'

interface BrandData {
  identity?: Record<string, string>
  what_it_is?: string
  audiences?: any[]
  value_proposition?: string
  hero_features?: Record<string, string>
  business_model?: string
  tone_and_voice?: Record<string, string>
  voice_archetypes?: string[]
  voice_principles?: Array<{ name: string; example: string }>
  voice_vocabulary?: { do?: string[]; dont?: string[] }
  visual_identity?: {
    status?: string
    colors?: Record<string, string>
    typography?: Record<string, string>
    logo?: Record<string, string>
    imagery_style?: string
    mascot_dady?: { specs: string; model_sheet_status: string; approved_anchors: string }
  }
  competitive_positioning?: string
  go_to_market?: string
  editorial_rhythm?: string
  strategy_roadmap?: string
  qa_rules?: { formula?: string; checklist?: string[]; what_to_avoid?: string[] }
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

type TabType = 'brand_identity' | 'audience_market' | 'voice_visual' | 'content_strategy' | 'business_ops' | 'documents'

export default function BrandBrainEditor() {
  const { activeClient } = useActiveClient()
  const [profile, setProfile] = useState<BrandProfile | null>(null)
  const [pillars, setPillars] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('brand_identity')
  const [documents, setDocuments] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<Record<string, any> | null>(null)
  const [analyzing, setAnalyzing] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const url = new URL('/api/brand-brain', window.location.origin)
        if (activeClient?.id) url.searchParams.set('clientId', activeClient.id)
        const res = await fetch(url)
        if (!res.ok) throw new Error('Failed to fetch brand profile')
        const { data, pillars: fetchedPillars } = await res.json()
        setPillars(fetchedPillars || [])
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
            visual_identity: {
              status: 'missing',
              colors: {},
              typography: {},
              logo: {},
              imagery_style: '',
            },
            competitive_positioning: '',
            go_to_market: '',
            strategy_roadmap: '',
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        // Fetch documents
        const docsUrl = new URL('/api/brand-brain/documents', window.location.origin)
        if (activeClient?.id) docsUrl.searchParams.set('clientId', activeClient.id)
        const docsRes = await fetch(docsUrl)
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

    if (activeClient?.id) fetchProfile()
  }, [activeClient?.id])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    setSuccess(false)
    setError(null)

    try {
      const body = { ...profile, pillars } as any
      if (activeClient?.id) body.clientId = activeClient.id
      const res = await fetch('/api/brand-brain', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
      if (activeClient?.id) formData.append('clientId', activeClient.id)

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

      {/* Tabs - 6 Consolidated Fields */}
      <div className="flex gap-1 mb-6 border-b border-white/10 overflow-x-auto pb-2">
        {[
          { id: 'brand_identity', label: '🎯 Brand Identity' },
          { id: 'audience_market', label: '👥 Audience & Market' },
          { id: 'voice_visual', label: '💬 Voice & Visual' },
          { id: 'content_strategy', label: '📚 Content Strategy' },
          { id: 'business_ops', label: '💼 Business & Ops' },
          { id: 'documents', label: '📄 Documents' },
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
        {activeTab === 'brand_identity' && (
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h3 className="text-sm font-medium text-white mb-4">Core Identity</h3>
              <TextInput label="Brand Name" value={profile.brand_data?.identity?.name || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, identity: { ...profile.brand_data?.identity, name: v } } })} placeholder="e.g., Discoolver" />
              <TextInput label="Tagline" value={profile.brand_data?.identity?.tagline || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, identity: { ...profile.brand_data?.identity, tagline: v } } })} placeholder="Short, memorable phrase" />
              <TextInput label="One-Liner" value={profile.brand_data?.identity?.one_liner || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, identity: { ...profile.brand_data?.identity, one_liner: v } } })} placeholder="What does your brand do?" />
            </div>
            <div className="border-b border-white/10 pb-4">
              <h3 className="text-sm font-medium text-white mb-4">Mission & Vision</h3>
              <TextareaInput label="Mission" value={profile.brand_data?.identity?.mission || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, identity: { ...profile.brand_data?.identity, mission: v } } })} placeholder="Your mission and purpose" />
              <TextareaInput label="Vision" value={profile.brand_data?.identity?.vision || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, identity: { ...profile.brand_data?.identity, vision: v } } })} placeholder="Your long-term vision" />
            </div>
            <div className="border-b border-white/10 pb-4">
              <h3 className="text-sm font-medium text-white mb-4">What Your Brand Is</h3>
              <label className="block text-xs text-gray-400 mb-2">(5-7 simultaneous things)</label>
              <TextareaInput value={profile.brand_data?.what_it_is || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, what_it_is: v } })} placeholder="1. Curated discovery platform&#10;2. Influencer-powered marketplace&#10;3. AI-assisted city explorer&#10;..." />
              <p className="text-xs text-gray-500 mt-2">Separate each item with a line break</p>
            </div>
            <div className="border-b border-white/10 pb-4">
              <h3 className="text-sm font-medium text-white mb-4">Value & Positioning</h3>
              <TextareaInput label="Value Proposition" value={profile.brand_data?.value_proposition || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, value_proposition: v } })} placeholder="Problems you solve + emotional promise + time/money saved" />
              <TextInput label="Enemy" value={profile.brand_data?.identity?.enemy || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, identity: { ...profile.brand_data?.identity, enemy: v } } })} placeholder="What do you compete against? (mindset, competitor, problem)" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-4">Hero Features</h3>
              <p className="text-xs text-gray-400 mb-4">Three differentiators that lead your narrative</p>
              <TextInput label="Feature 1" value={profile.brand_data?.hero_features?.feature_1 || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, hero_features: { ...profile.brand_data?.hero_features, feature_1: v } } })} />
              <TextInput label="Feature 2" value={profile.brand_data?.hero_features?.feature_2 || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, hero_features: { ...profile.brand_data?.hero_features, feature_2: v } } })} />
              <TextInput label="Feature 3" value={profile.brand_data?.hero_features?.feature_3 || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, hero_features: { ...profile.brand_data?.hero_features, feature_3: v } } })} />
            </div>
          </div>
        )}

        {activeTab === 'audience_market' && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-white">Primary Audiences (6 Segments)</label>
            <p className="text-xs text-gray-400 mb-4">Format: Segment | Need | Key Message (one per line)</p>
            <TextareaInput
              value={(profile.brand_data?.audiences || []).map((a: any) =>
                typeof a === 'string' ? a : `${a.segment || ''} | ${a.need || ''} | ${a.message || ''}`
              ).join('\n')}
              onChange={(v) => setProfile({
                ...profile,
                brand_data: {
                  ...profile.brand_data,
                  audiences: v.split('\n').filter(l => l.trim()).map(line => {
                    const [segment, need, message] = line.split('|').map(s => s.trim())
                    return { segment, need, message }
                  })
                }
              })}
              placeholder="E-commerce emergente | Ordenar operaciones | Valida y crece sin complicarte&#10;E-commerce en crecimiento | Soportar volumen | Campañas sin caos&#10;..."
            />
            <div className="border-t border-white/10 pt-4">
              <h4 className="text-xs font-semibold text-gray-300 mb-3">Preview:</h4>
              <div className="space-y-2 text-xs">
                {(profile.brand_data?.audiences || []).map((a: any, i: number) => (
                  <div key={i} className="bg-white/5 p-3 rounded border border-white/10">
                    <div className="font-medium text-white">{a.segment || a}</div>
                    <div className="text-gray-400 text-xs mt-1">{a.need || a}</div>
                    <div className="text-purple-300 text-xs mt-1">{a.message || a}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'brand_identity' && (
          <div className="space-y-4">
            <TextareaInput label="Value Proposition" value={profile.brand_data?.value_proposition || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, value_proposition: v } })} placeholder="Problems you solve + emotional promise + time/money saved" />
          </div>
        )}

        {activeTab === 'brand_identity' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 mb-4">Three hero features/differentiators that lead your narrative</p>
            <TextInput label="Feature 1" value={profile.brand_data?.hero_features?.feature_1 || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, hero_features: { ...profile.brand_data?.hero_features, feature_1: v } } })} />
            <TextInput label="Feature 2" value={profile.brand_data?.hero_features?.feature_2 || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, hero_features: { ...profile.brand_data?.hero_features, feature_2: v } } })} />
            <TextInput label="Feature 3" value={profile.brand_data?.hero_features?.feature_3 || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, hero_features: { ...profile.brand_data?.hero_features, feature_3: v } } })} />
          </div>
        )}

        {activeTab === 'business_ops' && (
          <div className="space-y-4">
            <TextareaInput label="Business Model" value={profile.brand_data?.business_model || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, business_model: v } })} placeholder="Revenue streams, pricing tiers, customer types (B2C/B2B/B2B2C)" />
          </div>
        )}

        {activeTab === 'voice_visual' && (
          <div className="space-y-6">
            {/* Archetypes */}
            <div className="border-b border-white/10 pb-4">
              <h3 className="text-sm font-medium text-white mb-3">Brand Archetypes</h3>
              <TextInput
                label="Primary Archetype"
                value={profile.brand_data?.voice_archetypes?.[0] || ''}
                onChange={(v) => setProfile({
                  ...profile,
                  brand_data: {
                    ...profile.brand_data,
                    voice_archetypes: [v, profile.brand_data?.voice_archetypes?.[1] || '']
                  }
                })}
                placeholder="e.g., El Aliado Experto"
              />
              <TextInput
                label="Secondary Archetype"
                value={profile.brand_data?.voice_archetypes?.[1] || ''}
                onChange={(v) => setProfile({
                  ...profile,
                  brand_data: {
                    ...profile.brand_data,
                    voice_archetypes: [profile.brand_data?.voice_archetypes?.[0] || '', v]
                  }
                })}
                placeholder="e.g., El Mago Operativo"
              />
            </div>

            {/* Voice Principles */}
            <div className="border-b border-white/10 pb-4">
              <h3 className="text-sm font-medium text-white mb-3">5 Voice Principles</h3>
              <p className="text-xs text-gray-400 mb-3">Format: Principle | Example (one per line)</p>
              <TextareaInput
                value={(profile.brand_data?.voice_principles || []).map((p: any) => `${p.name} | ${p.example}`).join('\n')}
                onChange={(v) => setProfile({
                  ...profile,
                  brand_data: {
                    ...profile.brand_data,
                    voice_principles: v.split('\n').filter(l => l.trim()).map(line => {
                      const [name, example] = line.split('|').map(s => s.trim())
                      return { name, example }
                    })
                  }
                })}
                placeholder="Claro | Controla stock, pedidos y devoluciones desde un solo panel.&#10;Práctico | Si tu inventario no está actualizado, tu marketing vende problemas.&#10;..."
              />
            </div>

            {/* Vocabulary */}
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Vocabulary Rules</h3>
              <label className="block text-xs font-medium text-gray-400 mb-2">✅ Words to Use (comma-separated)</label>
              <TextareaInput
                value={(profile.brand_data?.voice_vocabulary?.do || []).join(', ')}
                onChange={(v) => setProfile({
                  ...profile,
                  brand_data: {
                    ...profile.brand_data,
                    voice_vocabulary: {
                      ...profile.brand_data?.voice_vocabulary,
                      do: v.split(',').map(s => s.trim()).filter(s => s)
                    }
                  }
                })}
                placeholder="stock bajo control, pedidos sin fricción, logística conectada, margen..."
              />
              <label className="block text-xs font-medium text-gray-400 mb-2 mt-4">❌ Words to Avoid (comma-separated)</label>
              <TextareaInput
                value={(profile.brand_data?.voice_vocabulary?.dont || []).join(', ')}
                onChange={(v) => setProfile({
                  ...profile,
                  brand_data: {
                    ...profile.brand_data,
                    voice_vocabulary: {
                      ...profile.brand_data?.voice_vocabulary,
                      dont: v.split(',').map(s => s.trim()).filter(s => s)
                    }
                  }
                })}
                placeholder="barato, rápido porque sí, líder del mercado, revolucionario..."
              />
            </div>
          </div>
        )}

        {activeTab === 'voice_visual' && (
          <div className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <label className="block text-sm font-medium text-white">Status:</label>
              <select
                value={(profile.brand_data?.visual_identity as any)?.status || 'missing'}
                onChange={(e) => setProfile({
                  ...profile,
                  brand_data: {
                    ...profile.brand_data,
                    visual_identity: {
                      ...(profile.brand_data?.visual_identity as any),
                      status: e.target.value,
                    },
                  },
                })}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"
              >
                <option value="confirmed">✅ Confirmed (Client approved)</option>
                <option value="proposed">⏳ Proposed (Pending decision)</option>
                <option value="missing">❌ Missing (Not documented)</option>
              </select>
            </div>

            {/* Colors Section */}
            <div className="border-t border-white/10 pt-4">
              <h3 className="text-sm font-medium text-white mb-4">Colors</h3>
              <div className="grid grid-cols-2 gap-4">
                {['primary', 'secondary', 'accent', 'neutral'].map((colorRole) => (
                  <div key={colorRole}>
                    <label className="block text-xs font-medium text-gray-400 mb-2 capitalize">{colorRole}</label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={(profile.brand_data?.visual_identity as any)?.colors?.[colorRole] || ''}
                          onChange={(e) => setProfile({
                            ...profile,
                            brand_data: {
                              ...profile.brand_data,
                              visual_identity: {
                                ...(profile.brand_data?.visual_identity as any),
                                colors: {
                                  ...(profile.brand_data?.visual_identity as any)?.colors,
                                  [colorRole]: e.target.value,
                                },
                              },
                            },
                          })}
                          placeholder="#000000"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none text-xs"
                        />
                      </div>
                      <input
                        type="color"
                        value={(profile.brand_data?.visual_identity as any)?.colors?.[colorRole] || '#000000'}
                        onChange={(e) => setProfile({
                          ...profile,
                          brand_data: {
                            ...profile.brand_data,
                            visual_identity: {
                              ...(profile.brand_data?.visual_identity as any),
                              colors: {
                                ...(profile.brand_data?.visual_identity as any)?.colors,
                                [colorRole]: e.target.value,
                              },
                            },
                          },
                        })}
                        className="w-12 h-10 rounded cursor-pointer border border-white/10"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <TextareaInput
                label="Color Notes (roles, usage rules)"
                value={(profile.brand_data?.visual_identity as any)?.colors?.notes || ''}
                onChange={(v) => setProfile({
                  ...profile,
                  brand_data: {
                    ...profile.brand_data,
                    visual_identity: {
                      ...(profile.brand_data?.visual_identity as any),
                      colors: {
                        ...(profile.brand_data?.visual_identity as any)?.colors,
                        notes: v,
                      },
                    },
                  },
                })}
                placeholder="E.g., Primary on dark backgrounds, never accent on white..."
              />
            </div>

            {/* Typography Section */}
            <div className="border-t border-white/10 pt-4">
              <h3 className="text-sm font-medium text-white mb-4">Typography</h3>
              <div className="space-y-3">
                <TextInput
                  label="Heading Font"
                  value={(profile.brand_data?.visual_identity as any)?.typography?.heading_font || ''}
                  onChange={(v) => setProfile({
                    ...profile,
                    brand_data: {
                      ...profile.brand_data,
                      visual_identity: {
                        ...(profile.brand_data?.visual_identity as any),
                        typography: {
                          ...(profile.brand_data?.visual_identity as any)?.typography,
                          heading_font: v,
                        },
                      },
                    },
                  })}
                  placeholder="E.g., Inter Bold, Playfair Display"
                />
                <TextInput
                  label="Body Font"
                  value={(profile.brand_data?.visual_identity as any)?.typography?.body_font || ''}
                  onChange={(v) => setProfile({
                    ...profile,
                    brand_data: {
                      ...profile.brand_data,
                      visual_identity: {
                        ...(profile.brand_data?.visual_identity as any),
                        typography: {
                          ...(profile.brand_data?.visual_identity as any)?.typography,
                          body_font: v,
                        },
                      },
                    },
                  })}
                  placeholder="E.g., Inter, Open Sans"
                />
                <TextInput
                  label="Accent Font"
                  value={(profile.brand_data?.visual_identity as any)?.typography?.accent_font || ''}
                  onChange={(v) => setProfile({
                    ...profile,
                    brand_data: {
                      ...profile.brand_data,
                      visual_identity: {
                        ...(profile.brand_data?.visual_identity as any),
                        typography: {
                          ...(profile.brand_data?.visual_identity as any)?.typography,
                          accent_font: v,
                        },
                      },
                    },
                  })}
                  placeholder="E.g., Montserrat, DM Serif Display"
                />
                <TextareaInput
                  label="Typography Notes (usage by section)"
                  value={(profile.brand_data?.visual_identity as any)?.typography?.notes || ''}
                  onChange={(v) => setProfile({
                    ...profile,
                    brand_data: {
                      ...profile.brand_data,
                      visual_identity: {
                        ...(profile.brand_data?.visual_identity as any),
                        typography: {
                          ...(profile.brand_data?.visual_identity as any)?.typography,
                          notes: v,
                        },
                      },
                    },
                  })}
                  placeholder="E.g., Heading font for H1-H3, body for p-text, accent sparingly..."
                />
              </div>
            </div>

            {/* Logo Section */}
            <div className="border-t border-white/10 pt-4">
              <h3 className="text-sm font-medium text-white mb-4">Logo</h3>
              <TextInput
                label="Logo URL"
                value={(profile.brand_data?.visual_identity as any)?.logo?.primary_url || ''}
                onChange={(v) => setProfile({
                  ...profile,
                  brand_data: {
                    ...profile.brand_data,
                    visual_identity: {
                      ...(profile.brand_data?.visual_identity as any),
                      logo: {
                        ...(profile.brand_data?.visual_identity as any)?.logo,
                        primary_url: v,
                      },
                    },
                  },
                })}
                placeholder="URL to logo file (PNG recommended)"
              />
              <TextareaInput
                label="Logo Usage Rules"
                value={(profile.brand_data?.visual_identity as any)?.logo?.notes || ''}
                onChange={(v) => setProfile({
                  ...profile,
                  brand_data: {
                    ...profile.brand_data,
                    visual_identity: {
                      ...(profile.brand_data?.visual_identity as any),
                      logo: {
                        ...(profile.brand_data?.visual_identity as any)?.logo,
                        notes: v,
                      },
                    },
                  },
                })}
                placeholder="E.g., Use on dark backgrounds, minimum 110px, clear space required, etc."
              />
            </div>

            {/* Imagery Style */}
            <div className="border-t border-white/10 pt-4">
              <h3 className="text-sm font-medium text-white mb-4">Imagery & Aesthetic</h3>
              <TextareaInput
                value={(profile.brand_data?.visual_identity as any)?.imagery_style || ''}
                onChange={(v) => setProfile({
                  ...profile,
                  brand_data: {
                    ...profile.brand_data,
                    visual_identity: {
                      ...(profile.brand_data?.visual_identity as any),
                      imagery_style: v,
                    },
                  },
                })}
                placeholder="Mood, lighting, photography style, prohibited imagery, visual references, etc."
              />
            </div>

            {/* Mascot / Character */}
            <div className="border-t border-white/10 pt-4">
              <h3 className="text-sm font-medium text-white mb-4">Brand Mascot / Character</h3>
              <TextInput
                label="Mascot Name"
                value={(profile.brand_data?.visual_identity as any)?.mascot_dady?.specs?.split('|')[0] || ''}
                onChange={(v) => {
                  const specs = profile.brand_data?.visual_identity as any
                  const currentSpecs = specs?.mascot_dady?.specs || ''
                  const rest = currentSpecs.split('|').slice(1).join('|')
                  setProfile({
                    ...profile,
                    brand_data: {
                      ...profile.brand_data,
                      visual_identity: {
                        ...(profile.brand_data?.visual_identity as any),
                        mascot_dady: {
                          specs: `${v}${rest ? '|' + rest : ''}`,
                          model_sheet_status: specs?.mascot_dady?.model_sheet_status || '',
                          approved_anchors: specs?.mascot_dady?.approved_anchors || ''
                        },
                      },
                    },
                  })
                }}
                placeholder="e.g., Dady"
              />
              <TextareaInput
                label="Mascot Specs & Personality"
                value={(profile.brand_data?.visual_identity as any)?.mascot_dady?.specs || ''}
                onChange={(v) => setProfile({
                  ...profile,
                  brand_data: {
                    ...profile.brand_data,
                    visual_identity: {
                      ...(profile.brand_data?.visual_identity as any),
                      mascot_dady: {
                        ...(profile.brand_data?.visual_identity as any)?.mascot_dady,
                        specs: v,
                      },
                    },
                  },
                })}
                placeholder="Description, personality, voice, scene rules, design language..."
              />
              <TextInput
                label="Model Sheet Status"
                value={(profile.brand_data?.visual_identity as any)?.mascot_dady?.model_sheet_status || ''}
                onChange={(v) => setProfile({
                  ...profile,
                  brand_data: {
                    ...profile.brand_data,
                    visual_identity: {
                      ...(profile.brand_data?.visual_identity as any),
                      mascot_dady: {
                        ...(profile.brand_data?.visual_identity as any)?.mascot_dady,
                        model_sheet_status: v,
                      },
                    },
                  },
                })}
                placeholder="e.g., Pilot visual - formal orthographic sheet pending"
              />
              <TextareaInput
                label="Approved Visual Anchors"
                value={(profile.brand_data?.visual_identity as any)?.mascot_dady?.approved_anchors || ''}
                onChange={(v) => setProfile({
                  ...profile,
                  brand_data: {
                    ...profile.brand_data,
                    visual_identity: {
                      ...(profile.brand_data?.visual_identity as any),
                      mascot_dady: {
                        ...(profile.brand_data?.visual_identity as any)?.mascot_dady,
                        approved_anchors: v,
                      },
                    },
                  },
                })}
                placeholder="List of 4 reference images, URLs, or descriptions"
              />
            </div>
          </div>
        )}

        {activeTab === 'audience_market' && (
          <div className="space-y-4">
            <TextareaInput label="Competitive Positioning" value={profile.brand_data?.competitive_positioning || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, competitive_positioning: v } })} placeholder="Who are competitors, what makes you unique, market opportunities" />
          </div>
        )}

        {activeTab === 'content_strategy' && (
          <div className="space-y-6">
            {/* Go-to-Market Channels */}
            <div className="border-b border-white/10 pb-4">
              <h3 className="text-sm font-medium text-white mb-3">Go-to-Market & Channels</h3>
              <TextareaInput
                value={profile.brand_data?.go_to_market || ''}
                onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, go_to_market: v } })}
                placeholder="How you reach customers, main channels (Instagram, LinkedIn, Events, etc.), tactics"
              />
            </div>

            {/* Content Pillars */}
            <div className="border-b border-white/10 pb-4">
              <h3 className="text-sm font-medium text-white mb-3">4 Content Pillars</h3>
              <p className="text-xs text-gray-400 mb-3">Format: Pillar Name | Description | Claim (one per line)</p>
              <TextareaInput
                value={(pillars || []).map((p: any) =>
                  `${p.pillar_name} | ${p.description} | ${p.claim || ''}`
                ).join('\n')}
                onChange={(v) => setPillars(
                  v.split('\n').filter(l => l.trim()).map(line => {
                    const [pillar_name, description, claim] = line.split('|').map(s => s.trim())
                    return { pillar_name, description, claim, themes: [], examples: [] }
                  })
                )}
                placeholder="Radar Logístico | Actualidad y tendencias en logística | Lo que pasa en logística afecta tu e-commerce&#10;Dadybox en Acción | Servicios y procesos reales | Así convertimos tu logística en operación escalable&#10;..."
              />
              {(pillars || []).length > 0 && (
                <div className="mt-4 space-y-2 text-xs">
                  <p className="text-gray-300 font-medium">Pillars Summary:</p>
                  {(pillars || []).map((p: any, i: number) => (
                    <div key={i} className="bg-white/5 p-3 rounded border border-white/10">
                      <div className="font-medium text-purple-300">{p.pillar_name}</div>
                      <div className="text-gray-400 mt-1">{p.description}</div>
                      <div className="text-gray-500 text-xs mt-1 italic">"{p.claim}"</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Editorial Rhythm */}
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Editorial Rhythm & Calendar</h3>
              <p className="text-xs text-gray-400 mb-3">Weekly publishing rhythm, formats, and which pillar content for each day</p>
              <TextareaInput
                value={profile.brand_data?.editorial_rhythm || ''}
                onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, editorial_rhythm: v } })}
                placeholder="Lunes/Martes: E-com Playbook (framework + checklist)&#10;Miércoles: Dadybox en Acción (servicio, backstage)&#10;Jueves/Viernes: Radar Logístico (actualidad, caso)&#10;Fin de semana: Entregas Mágicas (creatividad, alcance)&#10;Principio: Publicar por función, no por llenar calendario."
              />
            </div>
          </div>
        )}

        {activeTab === 'content_strategy' && (
          <div className="space-y-6">
            {/* Strategy & Roadmap */}
            <div className="border-b border-white/10 pb-4">
              <h3 className="text-sm font-medium text-white mb-3">Strategy & Roadmap</h3>
              <TextareaInput
                value={profile.brand_data?.strategy_roadmap || ''}
                onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, strategy_roadmap: v } })}
                placeholder="90-day plan, growth model, strategic principles, key milestones"
              />
            </div>

            {/* QA Rules & Operations */}
            <div>
              <h3 className="text-sm font-medium text-white mb-3">QA Rules & Content Operations</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Base Formula (Problem → Solution → Benefit → Result → CTA)</label>
                  <TextareaInput
                    value={profile.brand_data?.qa_rules?.formula || ''}
                    onChange={(v) => setProfile({
                      ...profile,
                      brand_data: {
                        ...profile.brand_data,
                        qa_rules: { ...profile.brand_data?.qa_rules, formula: v }
                      }
                    })}
                    placeholder="1. Problem: Real challenge&#10;2. System: How we solve it&#10;3. Benefit: What improves&#10;4. Result: Metric/proof&#10;5. CTA: Next action"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">7-Point QA Checklist (one per line)</label>
                  <TextareaInput
                    value={(profile.brand_data?.qa_rules?.checklist || []).join('\n')}
                    onChange={(v) => setProfile({
                      ...profile,
                      brand_data: {
                        ...profile.brand_data,
                        qa_rules: {
                          ...profile.brand_data?.qa_rules,
                          checklist: v.split('\n').filter(l => l.trim())
                        }
                      }
                    })}
                    placeholder="¿Aporta algo útil o solo rellena calendario?&#10;¿Problema desde perspectiva del cliente?&#10;¿Conecta con control, margen, experiencia o escala?&#10;¿Hay lección real aunque sea creativo?&#10;¿CTA encaja con etapa del funnel?&#10;¿Diseño respeta colores, jerarquía y legibilidad?&#10;¿Claims legales verificados?"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">What to AVOID (comma-separated)</label>
                  <TextareaInput
                    value={(profile.brand_data?.qa_rules?.what_to_avoid || []).join(', ')}
                    onChange={(v) => setProfile({
                      ...profile,
                      brand_data: {
                        ...profile.brand_data,
                        qa_rules: {
                          ...profile.brand_data?.qa_rules,
                          what_to_avoid: v.split(',').map(s => s.trim()).filter(s => s)
                        }
                      }
                    })}
                    placeholder="Posts sin aprendizaje, claims sin prueba, hablar de magia sin explicar, estilos visuales inconsistentes, solo hablar de marca..."
                  />
                </div>
              </div>
            </div>
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
