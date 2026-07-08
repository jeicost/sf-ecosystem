'use client'
import { useEffect, useState } from 'react'
import { Brain, ChevronRight, CheckCircle, AlertCircle, Plus, Loader2, Link as LinkIcon, FileText, Globe, History } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { clsx } from 'clsx'
import { useActiveClient } from '@/lib/client-context'
import { CLIENT_ID } from '@/lib/constants'
import BrainResources from '@/components/brain/BrainResources'
import BrainVersionHistory from '@/components/brain/BrainVersionHistory'
import BrainChat from '@/components/brain/BrainChat'

interface BrandProfile {
  client_id: string
  brand_name: string | null
  mission: string | null
  tone_of_voice: Record<string, unknown> | null
  brand_personality: string[] | null
  banned_phrases: string[] | null
  icp_description: string | null
  web_url: string | null
  setup_complete: boolean
}

interface Pillar {
  id: string
  name: string
  description: string | null
  weight: number
  is_active: boolean
}

interface BrainLearning {
  id: string
  agent_id: string
  department_slug: string
  learning: string
  evidence: Record<string, unknown> | null
  validated: boolean | null
  created_at: string
}

interface BrainSource {
  id: string
  source_type: string
  title: string | null
  url: string | null
  file_path: string | null
  is_active: boolean
}

function completeness(profile: BrandProfile | null, pillars: Pillar[]) {
  const checks = [
    { label: 'Brand name', ok: !!profile?.brand_name, pct: profile?.brand_name ? 100 : 0 },
    { label: 'Mission', ok: !!profile?.mission, pct: profile?.mission ? 100 : 0 },
    { label: 'Voice & tone', ok: !!profile?.tone_of_voice, pct: profile?.tone_of_voice ? 80 : 0 },
    { label: 'Brand personality', ok: (profile?.brand_personality?.length ?? 0) > 0, pct: (profile?.brand_personality?.length ?? 0) > 0 ? 75 : 0 },
    { label: 'Content pillars', ok: pillars.length > 0, pct: Math.min(pillars.length * 20, 100) },
    { label: 'ICP defined', ok: !!profile?.icp_description, pct: profile?.icp_description ? 100 : 0 },
  ]
  const total = Math.round(checks.reduce((a, c) => a + c.pct, 0) / checks.length)
  return { checks, total }
}

function WizardMode({ profile, clientId, onComplete }: { profile: BrandProfile | null; clientId: string; onComplete: () => void }) {
  const [formData, setFormData] = useState({
    brand_name: profile?.brand_name || '',
    mission: profile?.mission || '',
    web_url: profile?.web_url || '',
    icp_description: profile?.icp_description || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const db = createClient()
    await db
      .from('brand_profiles')
      .update({
        ...formData,
        setup_complete: true,
      })
      .eq('client_id', clientId)
    setSaving(false)
    onComplete()
  }

  return (
    <div className="px-8 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <Brain size={28} className="text-violet-400" />
          Construye tu Cerebro de Empresa
        </h1>
        <p className="text-[#666] text-sm">
          Este es el corazón de tu empresa. Guiamos al sistema sobre quién eres, qué haces, y cómo comunicarte.
        </p>
      </div>

      <div className="space-y-5">
        <div className="card p-6">
          <label className="block text-xs font-medium text-[#AAA] mb-2">Nombre de la marca</label>
          <input
            type="text"
            value={formData.brand_name}
            onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
            placeholder="Ej: Salsa Burgers"
            className="w-full bg-[#0F0F0F] border border-[#222] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="card p-6">
          <label className="block text-xs font-medium text-[#AAA] mb-2">Misión o propósito</label>
          <textarea
            value={formData.mission}
            onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
            placeholder="¿Qué cambio quieres generar en el mundo?"
            className="w-full bg-[#0F0F0F] border border-[#222] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 resize-none h-24"
          />
        </div>

        <div className="card p-6">
          <label className="block text-xs font-medium text-[#AAA] mb-2">URL de tu web</label>
          <input
            type="url"
            value={formData.web_url}
            onChange={(e) => setFormData({ ...formData, web_url: e.target.value })}
            placeholder="https://tuempresa.com"
            className="w-full bg-[#0F0F0F] border border-[#222] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
          />
          <p className="text-[11px] text-[#555] mt-2">Extraeremos información automáticamente de tu sitio</p>
        </div>

        <div className="card p-6">
          <label className="block text-xs font-medium text-[#AAA] mb-2">ICP — A quién le vendes</label>
          <textarea
            value={formData.icp_description}
            onChange={(e) => setFormData({ ...formData, icp_description: e.target.value })}
            placeholder="Describe tu cliente ideal: sector, tamaño, retos, presupuesto..."
            className="w-full bg-[#0F0F0F] border border-[#222] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 resize-none h-24"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !formData.brand_name.trim()}
          className="w-full px-4 py-3 bg-violet-500 text-white rounded-lg font-medium text-sm hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? 'Guardando...' : 'Activar Brain'}
        </button>
      </div>
    </div>
  )
}

function TabContent({ tab, profile, pillars, learnings, sources, clientId, onProposalSave }: {
  tab: string
  profile: BrandProfile | null
  pillars: Pillar[]
  learnings: BrainLearning[]
  sources: BrainSource[]
  clientId: string
  onProposalSave?: (section: string, value: string) => Promise<void>
}) {
  if (tab === 'profile') {
    const toneVoice = profile?.tone_of_voice as Record<string, string> | null
    return (
      <div className="space-y-4">
        <div className="card p-5">
          <h3 className="text-sm font-medium text-white mb-3">Identidad</h3>
          <div className="space-y-3">
            <div>
              <p className="text-[11px] text-[#555]">Brand name</p>
              <p className="text-sm text-white">{profile?.brand_name || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#555]">Web URL</p>
              <p className="text-sm text-white">{profile?.web_url || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#555]">Misión</p>
              <p className="text-sm text-white">{profile?.mission || '—'}</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-medium text-white mb-3">Voz y tono</h3>
          {toneVoice ? (
            <div className="space-y-2">
              {Object.entries(toneVoice).map(([key, value]) => (
                <div key={key} className="flex justify-between text-[11px]">
                  <span className="text-[#555] capitalize">{key}</span>
                  <span className="text-[#ccc]">{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#444]">No configurado</p>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-medium text-white mb-3">Personalidad</h3>
          {profile?.brand_personality && profile.brand_personality.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.brand_personality.map((trait) => (
                <span key={trait} className="px-2.5 py-1.5 rounded-full bg-violet-500/20 text-violet-300 text-[11px] font-medium">
                  {trait}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#444]">No definida</p>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-medium text-white mb-3">Frases prohibidas</h3>
          {profile?.banned_phrases && profile.banned_phrases.length > 0 ? (
            <div className="space-y-2">
              {profile.banned_phrases.map((phrase, idx) => (
                <div key={idx} className="text-[11px] text-[#888] bg-[#0F0F0F] px-3 py-2 rounded">
                  {phrase}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#444]">Ninguna</p>
          )}
        </div>
      </div>
    )
  }

  if (tab === 'audience') {
    return (
      <div className="space-y-4">
        <div className="card p-5">
          <h3 className="text-sm font-medium text-white mb-3">ICP — Cliente ideal</h3>
          <p className="text-[11px] text-[#888]">{profile?.icp_description || 'No definido'}</p>
        </div>
      </div>
    )
  }

  if (tab === 'content') {
    return (
      <div className="space-y-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white">Content pillars</h3>
            <span className="text-[11px] text-[#555]">{pillars.length} activos</span>
          </div>
          {pillars.length === 0 ? (
            <p className="text-xs text-[#444] text-center py-4">No hay pilares configurados</p>
          ) : (
            <div className="space-y-2">
              {pillars.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-[#0F0F0F] last:border-0">
                  <div className={clsx('w-1.5 h-1.5 rounded-full shrink-0', p.is_active ? 'bg-emerald-400' : 'bg-[#333]')} />
                  <span className={clsx('text-xs flex-1', p.is_active ? 'text-[#ccc]' : 'text-[#444]')}>{p.name}</span>
                  <span className="text-[11px] text-[#444]">{Math.round(p.weight * 100)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (tab === 'memory') {
    return (
      <div className="space-y-4">
        {learnings.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-[#555]">El sistema aún no ha aprendido nada</p>
            <p className="text-[11px] text-[#444] mt-2">Los agentes actualizarán esta sección conforme trabajen</p>
          </div>
        ) : (
          learnings.map((learning) => (
            <div key={learning.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-[11px] text-[#666] mb-2">{learning.agent_id} — {learning.department_slug}</p>
                  <p className="text-sm text-[#ccc] leading-relaxed">{learning.learning}</p>
                  {learning.validated !== null && (
                    <span
                      className={clsx('text-[10px] mt-2 inline-block px-2 py-1 rounded-full', {
                        'bg-emerald-500/20 text-emerald-400': learning.validated === true,
                        'bg-red-500/20 text-red-400': learning.validated === false,
                      })}
                    >
                      {learning.validated === true ? 'Validado' : 'Rechazado'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    )
  }

  if (tab === 'sources') {
    return (
      <div className="space-y-4">
        {sources.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-[#555]">Sin fuentes aún</p>
            <p className="text-[11px] text-[#444] mt-2">Añade URLs, PDFs o documentos que alimenten tu cerebro</p>
          </div>
        ) : (
          sources
            .filter((s) => s.is_active)
            .map((source) => (
              <div key={source.id} className="card p-4 flex items-start gap-3">
                {source.source_type === 'website' && <Globe size={14} className="text-blue-400 mt-1 shrink-0" />}
                {source.source_type === 'pdf' && <FileText size={14} className="text-red-400 mt-1 shrink-0" />}
                {source.source_type === 'reference_link' && <LinkIcon size={14} className="text-cyan-400 mt-1 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{source.title || source.url || source.file_path || 'Sin título'}</p>
                  <p className="text-[10px] text-[#555] mt-1">{source.source_type}</p>
                </div>
              </div>
            ))
        )}
      </div>
    )
  }

  if (tab === 'resources') {
    return <BrainResources clientId={profile?.client_id || ''} />
  }

  if (tab === 'versions') {
    return <BrainVersionHistory clientId={profile?.client_id || ''} currentVersion={1} />
  }

  if (tab === 'ai-assistant') {
    return (
      <div className="h-[600px]">
        <BrainChat clientId={clientId} onProposalSave={onProposalSave} />
      </div>
    )
  }

  return null
}

// Allowed sections for safe proposal saving (anti-injection whitelist)
const ALLOWED_SECTIONS = [
  'tone_of_voice',
  'brand_personality',
  'mission',
  'values',
  'description',
  'proposition',
  'target_audience',
  'unique_value_props',
  'competitors',
  'banned_phrases',
  'banned_topics',
] as const

export default function BrainPage() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id ?? CLIENT_ID

  const [profile, setProfile] = useState<BrandProfile | null>(null)
  const [pillars, setPillars] = useState<Pillar[]>([])
  const [learnings, setLearnings] = useState<BrainLearning[]>([])
  const [sources, setSources] = useState<BrainSource[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    setLoading(true)
    const db = createClient()
    Promise.all([
      db.from('brand_profiles').select('*').eq('client_id', clientId).maybeSingle(),
      db.from('content_pillars').select('*').eq('client_id', clientId).order('weight', { ascending: false }),
      db.from('brain_learnings').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      db.from('brain_sources').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
    ]).then(([p, pi, bl, bs]) => {
      if (p.data) setProfile(p.data as BrandProfile)
      if (pi.data) setPillars(pi.data as Pillar[])
      if (bl.data) setLearnings(bl.data as BrainLearning[])
      if (bs.data) setSources(bs.data as BrainSource[])
      setLoading(false)
    })
  }, [clientId])

  // Handle safe proposal saving
  const handleProposalSave = async (section: string, value: string) => {
    // Validate section is in whitelist
    if (!ALLOWED_SECTIONS.includes(section as any)) {
      setToastMessage(`Invalid section: ${section}`)
      setToastType('error')
      setTimeout(() => setToastMessage(null), 3000)
      throw new Error(`Invalid section: ${section}`)
    }

    const db = createClient()

    try {
      // Update brand_profiles with the new section value
      const { error } = await db
        .from('brand_profiles')
        .update({ [section]: value })
        .eq('client_id', clientId)

      if (error) throw error

      // Update local state
      setProfile(p => ({
        ...p!,
        [section]: value,
      }))

      setToastMessage(`✅ Saved to ${section}`)
      setToastType('success')
      setTimeout(() => setToastMessage(null), 3000)
    } catch (err) {
      console.error('Failed to save proposal:', err)
      setToastMessage('Failed to save proposal')
      setToastType('error')
      setTimeout(() => setToastMessage(null), 3000)
      throw err
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={20} className="text-[#444] animate-spin" />
      </div>
    )

  if (!profile?.setup_complete) {
    return <WizardMode profile={profile} clientId={clientId} onComplete={() => setProfile({ ...profile!, setup_complete: true })} />
  }

  const { checks, total } = completeness(profile, pillars)

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: '👤' },
    { id: 'audience', label: 'Audiencia', icon: '🎯' },
    { id: 'content', label: 'Contenido', icon: '📝' },
    { id: 'memory', label: 'Memoria', icon: '🧠' },
    { id: 'ai-assistant', label: 'AI Assistant', icon: '🤖' },
    { id: 'sources', label: 'Fuentes', icon: '📚' },
    { id: 'resources', label: 'Recursos', icon: '📌' },
    { id: 'versions', label: 'Historial', icon: '⏱️' },
  ]

  return (
    <div className="px-8 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Brain size={22} className="text-violet-400" />
            Brand Brain
          </h1>
          <p className="text-[#555] mt-1 text-sm">Memoria institucional de tu empresa. Evoluciona con lo que aprendes.</p>
        </div>
      </div>

      {/* Brand chip + completeness */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border border-white/15 bg-white/8 font-medium text-white">
          <span>🧠</span>
          {profile.brand_name}
          <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-full ml-1', total >= 80 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400')}>
            {total}%
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-[#1A1A1A]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'px-4 py-3 text-xs font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.id ? 'text-white border-violet-500' : 'text-[#666] border-transparent hover:text-[#888]'
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <TabContent
            tab={activeTab}
            profile={profile}
            pillars={pillars}
            learnings={learnings}
            sources={sources}
            clientId={clientId}
            onProposalSave={handleProposalSave}
          />
        </div>

        {/* Right sidebar — Stats */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-xs font-medium text-white mb-4">Completeness</h3>
            <div className="space-y-2.5">
              {checks.map((check) => (
                <div key={check.label} className="flex items-center gap-3">
                  {check.ok ? <CheckCircle size={12} className="text-emerald-400 shrink-0" /> : <AlertCircle size={12} className="text-[#333] shrink-0" />}
                  <span className={clsx('text-[11px] flex-1', check.ok ? 'text-[#888]' : 'text-[#444]')}>{check.label}</span>
                  <span className={clsx('text-[10px] w-6 text-right', check.ok ? 'text-[#555]' : 'text-[#333]')}>{check.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card px-4 py-3">
            <p className="text-[11px] text-[#555] mb-1">Learnings</p>
            <p className="text-xl font-semibold text-blue-400">{learnings.length}</p>
          </div>

          <div className="card px-4 py-3">
            <p className="text-[11px] text-[#555] mb-1">Pillars active</p>
            <p className="text-xl font-semibold text-violet-400">{pillars.filter((p) => p.is_active).length}</p>
          </div>

          <div className="card px-4 py-3">
            <p className="text-[11px] text-[#555] mb-1">Sources</p>
            <p className="text-xl font-semibold text-emerald-400">{sources.filter((s) => s.is_active).length}</p>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={clsx(
            'fixed bottom-4 right-4 px-4 py-3 rounded-lg text-sm font-medium text-white transition-all duration-300',
            toastType === 'success' ? 'bg-emerald-500' : 'bg-red-500'
          )}
        >
          {toastMessage}
        </div>
      )}
    </div>
  )
}
