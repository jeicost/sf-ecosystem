'use client'
import { useEffect, useState } from 'react'
import { Brain, ChevronRight, Plus, Save, X, Loader2, Edit2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { clsx } from 'clsx'
import { useActiveClient } from '@/lib/client-context'

interface BrandProfile {
  id: string
  client_id: string
  name: string | null
  mission: string | null
  values: string[] | null
  tone_of_voice: string | null
  description: string | null
  proposition: string | null
  created_at: string
  updated_at: string
}

interface ContentPillar {
  id: string
  client_id: string
  pillar_name: string
  description: string | null
  themes: any[] | null
  examples: any[] | null
  created_at: string
}

export default function BrainPageV2() {
  const { activeClient } = useActiveClient()
  const [clientId, setClientId] = useState<string | null>(null)
  const [profile, setProfile] = useState<BrandProfile | null>(null)
  const [pillars, setPillars] = useState<ContentPillar[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'identity' | 'pillars' | 'references' | 'visual'>('identity')
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await createClient().auth.getUser()
      if (user?.user_metadata?.client_id) {
        setClientId(user.user_metadata.client_id)
      } else if (activeClient?.id) {
        setClientId(activeClient.id)
      }
    })()
  }, [activeClient])

  useEffect(() => {
    if (!clientId) return

    setLoading(true)
    const db = createClient()
    Promise.all([
      db.from('brand_profiles').select('*').eq('client_id', clientId).single(),
      db.from('content_pillars').select('*').eq('client_id', clientId).order('created_at')
    ]).then(([p, c]) => {
      if (p.data) setProfile(p.data as BrandProfile)
      if (c.data) setPillars(c.data as ContentPillar[])
      setLoading(false)
    })
  }, [clientId])

  const handleSaveField = async (field: string, value: any) => {
    if (!profile || !clientId) return
    setSaving(true)

    const db = createClient()
    const { error } = await db
      .from('brand_profiles')
      .update({ [field]: value })
      .eq('id', profile.id)

    if (!error) {
      setProfile({ ...profile, [field]: value })
      setEditingField(null)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="text-[#444] animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[#555]">Loading brand profile...</p>
      </div>
    )
  }

  return (
    <div className="px-8 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Brain size={28} className="text-violet-400" />
          <h1 className="text-3xl font-bold text-white">Brand Brain</h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/8 border border-white/15 w-fit">
          <span className="text-sm font-medium text-white">{profile.name}</span>
          <span className="text-xs px-2 py-1 rounded-full bg-violet-500/15 text-violet-300">v1.0</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-[#1A1A1A]">
        {[
          { id: 'identity' as const, label: '📝 Identidad', icon: '👤' },
          { id: 'pillars' as const, label: '📍 Pilares', icon: '🎯' },
          { id: 'references' as const, label: '📚 Referencias', icon: '📖' },
          { id: 'visual' as const, label: '🎨 Visuales', icon: '✨' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'text-white border-violet-500'
                : 'text-[#666] border-transparent hover:text-[#888]'
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* IDENTITY TAB */}
      {activeTab === 'identity' && (
        <div className="space-y-6">
          {/* Name */}
          <div className="card p-6">
            <label className="block text-xs font-medium text-[#AAA] mb-3">Nombre de la marca</label>
            {editingField === 'name' ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  className="flex-1 bg-[#0F0F0F] border border-[#222] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveField('name', editingValue)}
                  disabled={saving}
                  className="px-4 py-2 bg-violet-500 text-white rounded-lg text-sm hover:bg-violet-600 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button
                  onClick={() => setEditingField(null)}
                  className="px-4 py-2 bg-[#222] text-white rounded-lg text-sm hover:bg-[#333]"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-lg text-white font-semibold">{profile.name || '—'}</p>
                <button
                  onClick={() => {
                    setEditingField('name')
                    setEditingValue(profile.name || '')
                  }}
                  className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors"
                >
                  <Edit2 size={14} className="text-[#666]" />
                </button>
              </div>
            )}
          </div>

          {/* Mission */}
          <div className="card p-6">
            <label className="block text-xs font-medium text-[#AAA] mb-3">Misión</label>
            {editingField === 'mission' ? (
              <div className="flex gap-2">
                <textarea
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  className="flex-1 bg-[#0F0F0F] border border-[#222] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 resize-none h-24"
                  autoFocus
                />
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleSaveField('mission', editingValue)}
                    disabled={saving}
                    className="px-4 py-2 bg-violet-500 text-white rounded-lg text-sm hover:bg-violet-600 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  </button>
                  <button
                    onClick={() => setEditingField(null)}
                    className="px-4 py-2 bg-[#222] text-white rounded-lg text-sm hover:bg-[#333]"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-[#ccc] leading-relaxed">{profile.mission || '—'}</p>
                <button
                  onClick={() => {
                    setEditingField('mission')
                    setEditingValue(profile.mission || '')
                  }}
                  className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors flex-shrink-0"
                >
                  <Edit2 size={14} className="text-[#666]" />
                </button>
              </div>
            )}
          </div>

          {/* Tone of Voice */}
          <div className="card p-6">
            <label className="block text-xs font-medium text-[#AAA] mb-3">Tono de voz</label>
            {editingField === 'tone_of_voice' ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  placeholder="Ej: Profesional, directo, innovador"
                  className="flex-1 bg-[#0F0F0F] border border-[#222] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveField('tone_of_voice', editingValue)}
                  disabled={saving}
                  className="px-4 py-2 bg-violet-500 text-white rounded-lg text-sm hover:bg-violet-600 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button
                  onClick={() => setEditingField(null)}
                  className="px-4 py-2 bg-[#222] text-white rounded-lg text-sm hover:bg-[#333]"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#ccc]">{profile.tone_of_voice || '—'}</p>
                <button
                  onClick={() => {
                    setEditingField('tone_of_voice')
                    setEditingValue(profile.tone_of_voice || '')
                  }}
                  className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors"
                >
                  <Edit2 size={14} className="text-[#666]" />
                </button>
              </div>
            )}
          </div>

          {/* Values */}
          <div className="card p-6">
            <label className="block text-xs font-medium text-[#AAA] mb-3">Valores</label>
            <div className="flex flex-wrap gap-2">
              {(profile.values || []).map((val, idx) => (
                <span key={idx} className="px-3 py-2 rounded-full bg-violet-500/20 text-violet-300 text-sm font-medium">
                  {val}
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="card p-6">
            <label className="block text-xs font-medium text-[#AAA] mb-3">Descripción</label>
            {editingField === 'description' ? (
              <div className="flex gap-2">
                <textarea
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  className="flex-1 bg-[#0F0F0F] border border-[#222] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 resize-none h-32"
                  autoFocus
                />
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleSaveField('description', editingValue)}
                    disabled={saving}
                    className="px-4 py-2 bg-violet-500 text-white rounded-lg text-sm hover:bg-violet-600 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  </button>
                  <button
                    onClick={() => setEditingField(null)}
                    className="px-4 py-2 bg-[#222] text-white rounded-lg text-sm hover:bg-[#333]"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-[#ccc] leading-relaxed">{profile.description || '—'}</p>
                <button
                  onClick={() => {
                    setEditingField('description')
                    setEditingValue(profile.description || '')
                  }}
                  className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors flex-shrink-0"
                >
                  <Edit2 size={14} className="text-[#666]" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PILLARS TAB */}
      {activeTab === 'pillars' && (
        <div className="space-y-6">
          {pillars.map(pillar => (
            <div key={pillar.id} className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-2">{pillar.pillar_name}</h3>
              <p className="text-sm text-[#888] mb-4">{pillar.description}</p>
              {pillar.themes && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-[#AAA] mb-2">Temas:</p>
                  <div className="flex flex-wrap gap-2">
                    {pillar.themes.map((t: any, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 rounded-full bg-[#0F0F0F] border border-[#222] text-[11px] text-[#888]">
                        {t.name || t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {pillar.examples && (
                <div>
                  <p className="text-xs font-medium text-[#AAA] mb-2">Estructura de ejemplo:</p>
                  <ol className="text-[11px] text-[#666] space-y-1">
                    {pillar.examples.map((ex: any, idx: number) => (
                      <li key={idx}>
                        <strong className="text-[#888]">{idx + 1}.</strong> {typeof ex === 'string' ? ex : JSON.stringify(ex)}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* REFERENCES TAB */}
      {activeTab === 'references' && (
        <div className="card p-6 text-center">
          <p className="text-sm text-[#666] mb-4">📚 Biblioteca de referencias de contenido</p>
          <p className="text-xs text-[#444]">Aquí guardarás URLs, titles, y análisis de qué contenido funcionó bien en cada pilar.</p>
          <button className="mt-6 px-4 py-2 bg-violet-500/20 text-violet-300 rounded-lg text-sm font-medium hover:bg-violet-500/30">
            + Agregar referencia
          </button>
        </div>
      )}

      {/* VISUAL TAB */}
      {activeTab === 'visual' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-sm font-medium text-white mb-4">Colores principales</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'Navy', hex: '#073756', usage: 'Fondo principal' },
                { name: 'Verde Dadybox', hex: '#32EF84', usage: 'Acento de marca' },
                { name: 'Blanco', hex: '#FFFFFF', usage: 'Tarjetas y contraste' },
                { name: 'Rojo coral', hex: '#E64A4A', usage: 'CTA secundario' }
              ].map(color => (
                <div key={color.hex} className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg border border-[#222]"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div>
                    <p className="text-sm font-medium text-white">{color.name}</p>
                    <p className="text-xs text-[#666]">{color.hex}</p>
                    <p className="text-[10px] text-[#444]">{color.usage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-medium text-white mb-4">Tipografía</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-[#AAA] mb-1">Tipografía base</p>
                <p className="text-sm text-white">Poppins / Inter / DM Sans</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#AAA] mb-1">Titulares</p>
                <p className="text-sm text-white">Poppins</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#AAA] mb-1">Cuerpo</p>
                <p className="text-sm text-white">DM Sans</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
