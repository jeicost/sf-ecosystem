'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, Check, AlertCircle, Upload } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import BrandBrainSuggestions from './BrandBrainSuggestions'
import DriveFoldersPanel from './DriveFoldersPanel'
import BrandBrainIndexView from './BrandBrainIndexView'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'

// Tipo canónico compartido (lib/brand-data.ts) — antes vivía duplicado aquí.
import { normalizeVocab, normalizeFlopped, type BrandData, type VocabEntry } from '@/lib/brand-data'

// Parsers línea-a-estructura con el separador 🔹 (mismo UX que voice_principles)
function parseVocabLines(v: string): VocabEntry[] {
  return v.split('\n').filter((l) => l.trim()).map((line) => {
    const [phrase, why] = line.split('🔹').map((s) => s.trim())
    return why ? { phrase, why } : { phrase }
  })
}
function vocabToLines(list?: Array<string | VocabEntry>): string {
  return normalizeVocab(list).map((e) => (e.why ? `${e.phrase} 🔹 ${e.why}` : e.phrase)).join('\n')
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

type TabType = 'brand_identity' | 'audience_market' | 'voice_visual' | 'content_strategy' | 'business_ops' | 'documents' | 'index'

/**
 * Las columnas planas de `brand_profiles` (mission, tone_of_voice, values,
 * proposition) son anteriores al jsonb `brand_data` y siguen llenas: son las
 * que escriben el onboarding, los seeds y las rutas de IA antiguas. Este
 * editor, en cambio, pinta SOLO `brand_data.*` — así que su contenido llevaba
 * tiempo siendo invisible en pantalla aunque sí llegara a los prompts.
 *
 * Medido en producción el 2026-08-06: los 6 clientes tenían `tone_of_voice`,
 * `values` y `proposition` con texto real sin un solo widget que los mostrara.
 * En Salsa eso dejaba la pestaña de Voz en blanco teniendo un tono de voz
 * escrito ("Confiado, irreverente y obsesivo... nunca dice 'delicious'"), que
 * es exactamente el "el brain está casi vacío" que reportó el CEO.
 *
 * Al cargar se vuelca la columna plana al hueco de `brand_data` equivalente
 * SOLO si ese hueco está vacío (nunca pisa lo que el usuario ya editó). Al
 * guardar, el PUT vuelve a sincronizar las columnas planas, así que la
 * migración se consolida sola en cuanto alguien pulsa Guardar.
 */
function hydrateLegacyColumns(data: BrandProfile): BrandProfile {
  const bd: BrandData = { ...(data.brand_data ?? {}) }
  const flatText = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

  const legacyTone = flatText(data.tone_of_voice)
  if (legacyTone && !flatText(bd.tone_and_voice?.summary)) {
    bd.tone_and_voice = { ...bd.tone_and_voice, summary: legacyTone }
  }

  const legacyValues = Array.isArray(data.values) ? data.values.filter((v) => typeof v === 'string' && v.trim()) : []
  const currentValues = Array.isArray(bd.values) ? bd.values : []
  if (legacyValues.length && !currentValues.length) bd.values = legacyValues

  const legacyProposition = flatText((data as { proposition?: unknown }).proposition)
  if (legacyProposition && !flatText(bd.value_proposition)) bd.value_proposition = legacyProposition

  const legacyMission = flatText(data.mission)
  if (legacyMission && !flatText(bd.identity?.mission)) {
    bd.identity = { ...bd.identity, mission: legacyMission }
  }

  return { ...data, brand_data: bd }
}

/**
 * Claves de `brand_data` que este editor pinta con un widget propio. Todo lo
 * que quede fuera se muestra en el bloque de rescate del final de la pestaña
 * Index, para que no se pueda volver a repetir el caso de tener conocimiento
 * guardado y no verlo por ningún lado (Salsa tenía aquí `competitors`,
 * `benchmarks`, `targets_2026` y `differentiator`; otros clientes,
 * `course_curriculum` o `pending_items`).
 */
const PAINTED_BRAND_DATA_KEYS = new Set([
  'audiences', 'banned_phrases', 'business_model', 'channels', 'channels_to_avoid',
  'competitive_positioning', 'constraints', 'editorial_rhythm', 'go_to_market',
  'hero_features', 'identity', 'languages', 'offer', 'open_questions', 'qa_rules',
  'strategy_roadmap', 'tone_and_voice', 'value_proposition', 'values', 'visual_identity',
  'voice_archetypes', 'voice_principles', 'voice_vocabulary', 'what_flopped', 'what_it_is',
])

function hasContent(value: unknown): boolean {
  if (value == null) return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value as object).length > 0
  return String(value).trim().length > 0
}

// Audience items arrive in several real shapes depending on who wrote them:
// this editor's own textarea ({segment, need, message}), the seed data
// ({name, segment, pain_point, percent...}), or AI write paths (e.g.
// {age, segment} from document analysis / onboarding chat). Rendering must
// never hand React a raw object -- a `{a.need || a}` fallback here crashed
// the whole /brand-brain page (React #31) for every client whose audiences
// lacked that key, i.e. all of them.
function audienceField(a: any, keys: string[]): string {
  if (typeof a === 'string') return a
  if (!a || typeof a !== 'object') return a == null ? '' : String(a)
  for (const k of keys) {
    if (typeof a[k] === 'string' && a[k]) return a[k]
    if (typeof a[k] === 'number') return String(a[k])
  }
  return ''
}

function audienceFallback(a: any): string {
  if (typeof a === 'string') return a
  if (!a || typeof a !== 'object') return a == null ? '' : String(a)
  return Object.values(a)
    .filter((v): v is string | number => typeof v === 'string' || typeof v === 'number')
    .map(String)
    .join(' · ')
}

export default function BrandBrainEditor() {
  const { activeClient } = useActiveClient()
  const { locale } = useLocaleContext()
  const [profile, setProfile] = useState<BrandProfile | null>(null)
  const [pillars, setPillars] = useState<any[]>([])
  // Proponedor de pilares con IA. El endpoint existía desde el 11-ago y NINGÚN
  // componente lo llamaba — mientras 4 clientes en producción seguían con cero
  // pilares y el motor de contenido devolviéndoles 404. El flujo respeta el
  // diseño del endpoint: propone, el humano revisa/edita aquí mismo, y solo
  // Save escribe.
  const [proposing, setProposing] = useState(false)
  const [proposeMsg, setProposeMsg] = useState<string | null>(null)

  const proposePillars = async () => {
    if (!activeClient?.id || proposing) return
    setProposing(true)
    setProposeMsg(null)
    try {
      const res = await fetch('/api/content-engine/pillars/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: activeClient.id }),
      })
      const data = await res.json()
      if (!res.ok) { setProposeMsg(data.error || 'Could not propose pillars'); return }
      const existing = new Set((pillars || []).map((x: any) => (x.pillar_name || '').trim().toLowerCase()))
      const fresh = (data.pillars || []).filter(
        (x: any) => x.pillar_name && !existing.has(x.pillar_name.trim().toLowerCase())
      )
      if (fresh.length === 0) { setProposeMsg('No new pillars proposed — the current set already covers the Brain.'); return }
      setPillars([...(pillars || []), ...fresh])
      setProposeMsg(`${fresh.length} pillar${fresh.length > 1 ? 's' : ''} proposed — review, edit and Save to apply.`)
    } catch {
      setProposeMsg('Network error while proposing pillars')
    } finally {
      setProposing(false)
    }
  }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [relearning, setRelearning] = useState(false)
  const [relearnMsg, setRelearnMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('brand_identity')

  // Deep-link ?tab= (lo usan los links "Completar en Brand Brain" del semáforo
  // de Business Reports). window.location en efecto — sin exigir Suspense.
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab') as TabType | null
    if (tab && ['brand_identity', 'audience_market', 'voice_visual', 'content_strategy', 'business_ops', 'documents', 'index'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [])
  const [documents, setDocuments] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<Record<string, any> | null>(null)
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)

  // Sube el logo vía /api/brand-assets/logo (bucket brand-assets privado,
  // misma convención logos/{clientId} que el onboarding), lo fija en
  // brand_data como URL de proxy firmado y espeja clients.logo_url.
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeClient?.id || !profile) return
    setLogoUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('clientId', activeClient.id)
      form.append('file', file)
      const res = await fetch('/api/brand-assets/logo', { method: 'POST', body: form })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.path) throw new Error(data?.error || `Logo upload failed (${res.status})`)
      const url = `/api/brand-assets?path=${encodeURIComponent(data.path)}&v=${Date.now()}`

      setProfile({
        ...profile,
        brand_data: {
          ...profile.brand_data,
          visual_identity: {
            ...(profile.brand_data?.visual_identity as any),
            logo: { ...(profile.brand_data?.visual_identity as any)?.logo, primary_url: url },
          },
        },
      })
      // Espejo a clients.logo_url (server-side, service role)
      await fetch('/api/brand-brain/logo-mirror', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: activeClient.id, url }),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logo upload failed')
    } finally {
      setLogoUploading(false)
      e.target.value = ''
    }
  }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const url = new URL('/api/brand-brain', window.location.origin)
        if (activeClient?.id) url.searchParams.set('clientId', activeClient.id)
        const res = await fetch(url)
        if (!res.ok) throw new Error(t('bb.fetch-failed', locale))
        const { data, pillars: fetchedPillars } = await res.json()
        setPillars(fetchedPillars || [])
        setProfile(data ? hydrateLegacyColumns(data) : {
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
        setError(err instanceof Error ? err.message : t('bb.unknown-error', locale))
      } finally {
        setLoading(false)
      }
    }

    if (activeClient?.id) fetchProfile()
    else setLoading(false) // sin cliente activo: no dejar loading infinito
  }, [activeClient?.id])

  const handleRelearn = async () => {
    if (!activeClient?.id) return
    setRelearning(true)
    setRelearnMsg(null)
    try {
      const res = await fetch('/api/brain/relearn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: activeClient.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) throw new Error(data.error || 'The re-read failed')

      if (data.changes > 0 || data.contradictions > 0) {
        setRelearnMsg({
          ok: true,
          text: `Read ${data.documentsRead} document${data.documentsRead === 1 ? '' : 's'}. ${data.changes} change${data.changes === 1 ? '' : 's'} and ${data.contradictions} conflict${data.contradictions === 1 ? '' : 's'} are waiting for you at the top of this page.`,
        })
      } else {
        setRelearnMsg({
          ok: true,
          text: data.reason || `Read ${data.documentsRead} documents — nothing new to add.`,
        })
      }
    } catch (err) {
      setRelearnMsg({ ok: false, text: err instanceof Error ? err.message : 'The re-read failed' })
    } finally {
      setRelearning(false)
    }
  }

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
        throw new Error(errorData.error || t('bb.save-failed', locale))
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('bb.unknown-error', locale))
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
        throw new Error(errorData.error || t('bb.upload-failed', locale))
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
      setError(err instanceof Error ? err.message : t('bb.unknown-error', locale))
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
        throw new Error(errorData.error || t('bb.analysis-failed', locale))
      }

      const { suggestedUpdates } = await res.json()
      setSuggestions(suggestedUpdates)

      // Update document status in list using functional updater to avoid race condition
      setDocuments(prev =>
        prev.map((doc) =>
          doc.id === documentId ? { ...doc, analysis_status: 'completed' } : doc
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : t('bb.analysis-failed', locale))
      // Update status to failed using functional updater
      setDocuments(prev =>
        prev.map((doc) =>
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

      // Intelligent merge: deep merge for objects, smart merge for arrays
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          const existingValue = newBrandData[key as keyof BrandData]

          // Deep merge for nested objects
          if (typeof value === 'object' && !Array.isArray(value) && typeof existingValue === 'object' && !Array.isArray(existingValue)) {
            newBrandData[key as keyof BrandData] = { ...existingValue, ...value }
          }
          // Smart merge for arrays: append new items (avoid duplicates by key field)
          else if (Array.isArray(value) && Array.isArray(existingValue)) {
            const merged = [...existingValue]
            value.forEach((newItem: any) => {
              // Check if item already exists by comparing full object
              const exists = merged.some(existing => JSON.stringify(existing) === JSON.stringify(newItem))
              if (!exists) {
                merged.push(newItem)
              }
            })
            newBrandData[key as keyof BrandData] = merged as any
          }
          // Direct assignment for primitives and other cases.
          //
          // Guarda real: si el modelo propone un STRING para una sección que
          // ya es un OBJETO, la asignación directa machacaba el objeto entero.
          // El caso concreto es visual_identity — el prompt de
          // analyze-document lo pide como texto libre mientras el editor lo
          // guarda como { colors, typography, logo, status }: aplicar esa
          // sugerencia borraba colores, tipografía y logo de un plumazo.
          // Se conserva el objeto y el texto propuesto entra como nota.
          else if (
            typeof value === 'string' &&
            existingValue && typeof existingValue === 'object' && !Array.isArray(existingValue)
          ) {
            newBrandData[key as keyof BrandData] = { ...existingValue, notes: value } as any
          }
          else {
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
        throw new Error(errorData.error || t('bb.save-failed', locale))
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('bb.unknown-error', locale))
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
          <p className="text-red-400">{t('bb.load-failed', locale)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(168,85,247,0.8)', letterSpacing: '0.12em' }}>
          {t('bb.eyebrow', locale)}
        </p>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Brand Brain</h1>
        <p className="text-sm mt-1 text-ink-tertiary">
          {t('bb.subtitle', locale)}
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="card p-4 border-red-500/20 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} style={{ color: '#EF4444' }} />
            <div>
              <p className="font-semibold text-red-400">{t('bb.error', locale)}</p>
              <p className="text-sm text-ink-secondary mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="card p-4 border-green-500/20 mb-6">
          <div className="flex items-start gap-3">
            <Check size={20} style={{ color: '#22C55E' }} />
            <div>
              <p className="font-semibold text-green-400">{t('bb.saved', locale)}</p>
              <p className="text-sm text-ink-secondary mt-1">{t('bb.saved-desc', locale)}</p>
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
      <div className="flex gap-1 mb-6 border-b border-line overflow-x-auto pb-2">
        {[
          { id: 'brand_identity', label: `🎯 ${t('bb.tab-identity', locale)}` },
          { id: 'audience_market', label: `👥 ${t('bb.tab-audience', locale)}` },
          { id: 'voice_visual', label: `💬 ${t('bb.tab-voice', locale)}` },
          { id: 'content_strategy', label: `📚 ${t('bb.tab-content', locale)}` },
          { id: 'business_ops', label: `💼 ${t('bb.tab-business', locale)}` },
          { id: 'documents', label: `📄 ${t('bb.tab-documents', locale)}` },
          { id: 'index', label: `🗂️ ${t('bb.tab-index', locale)}` },
        ].map((tab) => (
          <button
            key={tab.id}
            /* Identificador estable e independiente del idioma: el
               ActivationChecklist navegaba buscando el botón por su TEXTO en
               inglés ('Brand Identity'...), y como las pestañas se pintan con
               t(), en el locale por defecto decían 'Identidad de Marca' y el
               querySelector no encontraba nada — ningún paso del checklist
               navegaba a ninguna parte. */
            data-bb-tab={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-3 py-3 text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-ink border-b-2'
                : 'text-ink-secondary border-b-2 border-transparent hover:text-ink'
            }`}
            style={{
              borderBottomColor: activeTab === tab.id ? '#A855F7' : 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* P8: cada pestaña dice DÓNDE se usa lo que guardas en ella */}
      <p className="mb-4 text-[11px] text-ink-tertiary">
        {{
          brand_identity: '🧠 Identity → feeds EVERY report, agent and quick action as the source of truth. The website automatically powers SEO / Marketing / Brand Briefing.',
          audience_market: '🧠 Audience & market → report personas, per-audience tone for content, and sales scoring (ICP).',
          voice_visual: '🧠 Voice & visual → the we-say / we-never-say vocabulary and its reasons govern ALL copy; colours and typography go straight into generated images and document themes.',
          content_strategy: '🧠 Pillars & cadence → the backbone of the Monthly Content System, the content engine and the content quick actions.',
          business_ops: '🧠 Business & offer → hero items with prices, promo mechanics, constraints and channels feed reports, the monthly system and sales proposals. One of the MOST used sections.',
          documents: '🧠 Documents → stored in the client library, and every agent and report reads them (unified knowledge index).',
          index: '🧠 Index → where each section came from (chat, Drive, document, manual edit) and which contradictions are still open — they never resolve themselves, a human reviews them here.',
        }[activeTab] || ''}
      </p>

      {/* Tab Content - 11 Fields */}
      <div className="card p-6 mb-6 space-y-4">
        {activeTab === 'brand_identity' && (
          <div className="space-y-6">
            <div className="border-b border-line pb-4">
              <h3 className="text-sm font-medium text-ink mb-4">Core Identity</h3>
              <TextInput label="Brand Name" value={profile.brand_data?.identity?.name || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, identity: { ...profile.brand_data?.identity, name: v } } })} placeholder="e.g., Discoolver" />
              <TextInput label="Website" value={profile.brand_data?.identity?.website_url || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, identity: { ...profile.brand_data?.identity, website_url: v } } })} placeholder="https://www.yourbrand.com" />
              <p className="text-xs text-ink-tertiary -mt-2 mb-3">The canonical business website — reports (SEO, Marketing, Brand Briefing) use it automatically unless another one is given.</p>
              <TextInput label="Tagline" value={profile.brand_data?.identity?.tagline || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, identity: { ...profile.brand_data?.identity, tagline: v } } })} placeholder="Short, memorable phrase" />
              <TextInput label="One-Liner" value={profile.brand_data?.identity?.one_liner || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, identity: { ...profile.brand_data?.identity, one_liner: v } } })} placeholder="What does your brand do?" />
            </div>
            <div className="border-b border-line pb-4">
              <h3 className="text-sm font-medium text-ink mb-4">Mission & Vision</h3>
              <TextareaInput label="Mission" value={profile.brand_data?.identity?.mission || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, identity: { ...profile.brand_data?.identity, mission: v } } })} placeholder="Your mission and purpose" />
              <TextareaInput label="Vision" value={profile.brand_data?.identity?.vision || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, identity: { ...profile.brand_data?.identity, vision: v } } })} placeholder="Your long-term vision" />
            </div>
            {/* Valores — vivían solo en la columna plana `values`, sin widget:
                los 6 clientes los tenían escritos y sin forma de verlos. */}
            <div className="border-b border-line pb-4">
              <h3 className="text-sm font-medium text-ink mb-4">Brand Values</h3>
              <label className="block text-xs text-ink-secondary mb-2">One per line</label>
              <TextareaInput
                value={(Array.isArray(profile.brand_data?.values) ? profile.brand_data.values : [])
                  .filter((v): v is string => typeof v === 'string')
                  .join('\n')}
                onChange={(v) => setProfile({
                  ...profile,
                  brand_data: {
                    ...profile.brand_data,
                    values: v.split('\n').map((s) => s.trim()).filter(Boolean),
                  }
                })}
                placeholder={'Ingredient obsession\nQuality over volume\nDelivery reliability'}
              />
            </div>
            <div className="border-b border-line pb-4">
              <h3 className="text-sm font-medium text-ink mb-4">What Your Brand Is</h3>
              <label className="block text-xs text-ink-secondary mb-2">(5-7 simultaneous things)</label>
              <TextareaInput value={profile.brand_data?.what_it_is || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, what_it_is: v } })} placeholder="1. Curated discovery platform&#10;2. Influencer-powered marketplace&#10;3. AI-assisted city explorer&#10;..." />
              <p className="text-xs text-ink-tertiary mt-2">Separate each item with a line break</p>
            </div>
            <div className="border-b border-line pb-4">
              <h3 className="text-sm font-medium text-ink mb-4">Value & Positioning</h3>
              <TextareaInput label="Value Proposition" value={profile.brand_data?.value_proposition || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, value_proposition: v } })} placeholder="Problems you solve + emotional promise + time/money saved" />
              <TextInput label="Enemy" value={profile.brand_data?.identity?.enemy || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, identity: { ...profile.brand_data?.identity, enemy: v } } })} placeholder="What do you compete against? (mindset, competitor, problem)" />
              <TextInput label="Signature Ritual" value={profile.brand_data?.identity?.signature_ritual || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, identity: { ...profile.brand_data?.identity, signature_ritual: v } } })} placeholder="The signature ritual or experience — often the most ownable asset (e.g. putting on the glove)" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-ink mb-4">Hero Features</h3>
              <p className="text-xs text-ink-secondary mb-4">Three differentiators that lead your narrative</p>
              <TextInput label="Feature 1" value={profile.brand_data?.hero_features?.feature_1 || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, hero_features: { ...profile.brand_data?.hero_features, feature_1: v } } })} />
              <TextInput label="Feature 2" value={profile.brand_data?.hero_features?.feature_2 || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, hero_features: { ...profile.brand_data?.hero_features, feature_2: v } } })} />
              <TextInput label="Feature 3" value={profile.brand_data?.hero_features?.feature_3 || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, hero_features: { ...profile.brand_data?.hero_features, feature_3: v } } })} />
            </div>
          </div>
        )}

        {activeTab === 'audience_market' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-ink mb-3">Primary Audiences (6 Segments)</h3>
              <p className="text-xs text-ink-secondary mb-4">Format: Segment 🔹 Need 🔹 Key Message (one per line)</p>
              <TextareaInput
                value={(profile.brand_data?.audiences || []).map((a: any) =>
                  typeof a === 'string'
                    ? a
                    : `${audienceField(a, ['segment', 'name'])} 🔹 ${audienceField(a, ['need', 'pain_point'])} 🔹 ${audienceField(a, ['message'])}`
                ).join('\n')}
                onChange={(v) => setProfile({
                  ...profile,
                  brand_data: {
                    ...profile.brand_data,
                    audiences: v.split('\n').filter(l => l.trim()).map(line => {
                      const [segment, need, message] = line.split('🔹').map(s => s.trim())
                      return { segment, need, message }
                    })
                  }
                })}
                placeholder="Emerging e-commerce 🔹 Tidy up operations 🔹 Validate and grow without the mess&#10;Growing e-commerce 🔹 Handle volume 🔹 Campaigns without chaos&#10;..."
              />
              <div className="border-t border-line pt-4 mt-4">
                <h4 className="text-xs font-semibold text-ink-secondary mb-3">Preview:</h4>
                <div className="space-y-2 text-xs">
                  {(profile.brand_data?.audiences || []).map((a: any, i: number) => {
                    const title = audienceField(a, ['name', 'segment']) || audienceFallback(a)
                    const need = audienceField(a, ['need', 'pain_point'])
                    const message = audienceField(a, ['message'])
                    return (
                      <div key={i} className="bg-surface p-3 rounded border border-line">
                        <div className="font-medium text-ink">{title}</div>
                        {need && <div className="text-ink-secondary text-xs mt-1">{need}</div>}
                        {message && <div className="text-purple-300 text-xs mt-1">{message}</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="border-t border-line pt-6">
              <h3 className="text-sm font-medium text-ink mb-3">Competitive Positioning</h3>
              <TextareaInput value={profile.brand_data?.competitive_positioning || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, competitive_positioning: v } })} placeholder="Who are competitors, what makes you unique, market opportunities" />
            </div>

            {/* Open questions — las contradicciones afloran en el informe,
                nunca se resuelven en silencio. Ahí está el valor. */}
            <div className="border-t border-line pt-6">
              <h3 className="text-sm font-medium text-ink mb-1">Open Questions</h3>
              <p className="text-xs text-ink-secondary mb-2">Known contradictions, undecided calls, things you suspect are broken (one per line). Reports surface them with a recommendation instead of resolving them silently.</p>
              <TextareaInput
                value={[
                  ...(profile.brand_data?.open_questions?.contradictions || []),
                  ...(profile.brand_data?.open_questions?.undecided || []),
                  ...(profile.brand_data?.open_questions?.suspected_broken || []),
                ].join('\n')}
                onChange={(v) => setProfile({
                  ...profile,
                  brand_data: {
                    ...profile.brand_data,
                    open_questions: { contradictions: v.split('\n').map((s) => s.trim()).filter(Boolean) }
                  }
                })}
                placeholder={'The deck says a June launch and the ops summary says March\nNobody has decided whether the handle is @brand.city or @brand_city'}
              />
            </div>
          </div>
        )}

        {activeTab === 'business_ops' && (
          <div className="space-y-6">
            <TextareaInput label="Business Model" value={profile.brand_data?.business_model || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, business_model: v } })} placeholder="Revenue streams, pricing tiers, customer types (B2C/B2B/B2B2C)" />

            {/* Offer — copy anclado a un SKU real vence a copy anclado a un adjetivo */}
            <div className="border-b border-line pb-4">
              <h3 className="text-sm font-medium text-ink mb-1">Offer</h3>
              <p className="text-xs text-ink-secondary mb-3">Hero items: 3 maximum — never sell more than three things at once. With real prices.</p>
              {[0, 1, 2].map((i) => {
                const item = profile.brand_data?.offer?.hero_items?.[i]
                const update = (patch: Partial<{ name: string; price: string; note: string }>) => {
                  const items = [...(profile.brand_data?.offer?.hero_items || [])]
                  while (items.length <= i) items.push({ name: '' })
                  items[i] = { ...items[i], ...patch }
                  setProfile({ ...profile, brand_data: { ...profile.brand_data, offer: { ...profile.brand_data?.offer, hero_items: items.filter((h) => h.name || h.price || h.note) } } })
                }
                return (
                  <div key={i} className="grid grid-cols-[2fr_1fr_2fr] gap-2 mb-2">
                    <input type="text" value={item?.name || ''} onChange={(e) => update({ name: e.target.value })} placeholder={`Hero item ${i + 1}`} className="px-3 py-2 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-xs" />
                    <input type="text" value={item?.price || ''} onChange={(e) => update({ price: e.target.value })} placeholder="Price" className="px-3 py-2 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-xs" />
                    <input type="text" value={item?.note || ''} onChange={(e) => update({ note: e.target.value })} placeholder="Note (hero ingredient, angle…)" className="px-3 py-2 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-xs" />
                  </div>
                )
              })}
              <TextareaInput label="Full offer (note)" value={profile.brand_data?.offer?.full_list_note || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, offer: { ...profile.brand_data?.offer, full_list_note: v } } })} placeholder="Where the full menu/catalogue lives, price ranges…" />
              <TextInput label="Promo mechanics" value={profile.brand_data?.offer?.promo_mechanics || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, offer: { ...profile.brand_data?.offer, promo_mechanics: v } } })} placeholder="Code, discount, channels, whether it is time-boxed" />
              <TextInput label="Where to buy" value={(profile.brand_data?.offer?.purchase_channels || []).join(', ')} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, offer: { ...profile.brand_data?.offer, purchase_channels: v.split(',').map((s) => s.trim()).filter(Boolean) } } })} placeholder="web, Grab, marketplace, local... (comma-separated)" />
            </div>

            {/* Channels — un canal sin trabajo asignado es un canal que se abandona */}
            <div className="border-b border-line pb-4">
              <h3 className="text-sm font-medium text-ink mb-1">Channels</h3>
              <p className="text-xs text-ink-secondary mb-2">Format: channel 🔹 job 🔹 owner (one per line)</p>
              <TextareaInput
                value={(profile.brand_data?.channels || []).map((c) => [c.channel, c.job, c.owner].filter(Boolean).join(' 🔹 ')).join('\n')}
                onChange={(v) => setProfile({
                  ...profile,
                  brand_data: {
                    ...profile.brand_data,
                    channels: v.split('\n').filter((l) => l.trim()).map((line) => {
                      const [channel, job, owner] = line.split('🔹').map((s) => s.trim())
                      return { channel, job: job || undefined, owner: owner || undefined }
                    })
                  }
                })}
                placeholder={'Instagram 🔹 craving and brand 🔹 Natalia\nLinkedIn 🔹 B2B and authority 🔹 Carlos'}
              />
              <label className="block text-xs font-medium text-ink-secondary mb-2 mt-3">Channels to AVOID (channel 🔹 why)</label>
              <TextareaInput
                value={(profile.brand_data?.channels_to_avoid || []).map((c) => `${c.channel} 🔹 ${c.why}`).join('\n')}
                onChange={(v) => setProfile({
                  ...profile,
                  brand_data: {
                    ...profile.brand_data,
                    channels_to_avoid: v.split('\n').filter((l) => l.trim()).map((line) => {
                      const [channel, why] = line.split('🔹').map((s) => s.trim())
                      return { channel, why: why || '' }
                    })
                  }
                })}
                placeholder={'X/Twitter 🔹 the audience is not there and it steals focus'}
              />
            </div>

            {/* Constraints — lo que salva de un cease-and-desist */}
            <div className="border-b border-line pb-4">
              <h3 className="text-sm font-medium text-ink mb-3">Constraints & Rules</h3>
              <TextareaInput label="Legal / IP" value={profile.brand_data?.constraints?.legal_ip || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, constraints: { ...profile.brand_data?.constraints, legal_ip: v } } })} placeholder="Likeness, copyright, comparative advertising..." />
              <TextareaInput label="Category rules" value={profile.brand_data?.constraints?.category_rules || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, constraints: { ...profile.brand_data?.constraints, category_rules: v } } })} placeholder="Health, alcohol or financial claims..." />
              <TextareaInput label="Self-imposed" value={profile.brand_data?.constraints?.self_imposed || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, constraints: { ...profile.brand_data?.constraints, self_imposed: v } } })} placeholder="No permanent discounts, no stock imagery..." />
              <TextInput label="Sequencing rule" value={profile.brand_data?.constraints?.sequencing_rule || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, constraints: { ...profile.brand_data?.constraints, sequencing_rule: v } } })} placeholder="e.g. community → content → monetisation → B2B" />
            </div>

            {/* What flopped — la teoría del fracaso vale más que el fracaso */}
            <div className="border-b border-line pb-4">
              <h3 className="text-sm font-medium text-ink mb-1">What Flopped</h3>
              <p className="text-xs text-ink-secondary mb-2">Format: format/series 🔹 theory of why it did not work</p>
              <TextareaInput
                value={normalizeFlopped(profile.brand_data?.what_flopped).map((f) => (f.theory ? `${f.format} 🔹 ${f.theory}` : f.format)).join('\n')}
                onChange={(v) => setProfile({
                  ...profile,
                  brand_data: {
                    ...profile.brand_data,
                    what_flopped: v.split('\n').filter((l) => l.trim()).map((line) => {
                      const [format, theory] = line.split('🔹').map((s) => s.trim())
                      return { format, theory: theory || undefined }
                    })
                  }
                })}
                placeholder={'Generic memes 🔹 no connection to the product, empty engagement'}
              />
            </div>
          </div>
        )}

        {activeTab === 'voice_visual' && (
          <div className="space-y-6">
            {/* Tono de voz en prosa — es lo que escriben el onboarding y los
                seeds en la columna plana `tone_of_voice`, y hasta ahora no
                tenía ningún widget: la pestaña salía vacía con el tono escrito.
                Ver hydrateLegacyColumns(). */}
            <div className="border-b border-line pb-4">
              <h3 className="text-sm font-medium text-ink mb-3">Tone of Voice</h3>
              <p className="text-xs text-ink-secondary mb-3">
                How the brand sounds, in your own words. The agents read this on every generation.
              </p>
              <TextareaInput
                value={profile.brand_data?.tone_and_voice?.summary || ''}
                onChange={(v) => setProfile({
                  ...profile,
                  brand_data: {
                    ...profile.brand_data,
                    tone_and_voice: { ...profile.brand_data?.tone_and_voice, summary: v }
                  }
                })}
                placeholder="Confident, irreverent and obsessive. Speaks in the imperative. Never asks permission."
              />
            </div>

            {/* Archetypes */}
            <div className="border-b border-line pb-4">
              <h3 className="text-sm font-medium text-ink mb-3">Brand Archetypes</h3>
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
                placeholder="e.g., The Expert Ally"
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
                placeholder="e.g., The Operations Wizard"
              />
            </div>

            {/* Banned Phrases — alimentan la línea "Frases prohibidas" de TODOS los prompts */}
            <div className="border-b border-line pb-4">
              <h3 className="text-sm font-medium text-ink mb-3">{t('bb.banned-phrases', locale)}</h3>
              <p className="text-xs text-ink-secondary mb-3">{t('bb.banned-phrases-hint', locale)}</p>
              <TextareaInput
                value={(profile.brand_data?.banned_phrases || []).join('\n')}
                onChange={(v) => setProfile({
                  ...profile,
                  brand_data: {
                    ...profile.brand_data,
                    banned_phrases: v.split('\n').map(s => s.trim()).filter(Boolean)
                  }
                })}
                placeholder={'"revolutionary"\n"the best on the market"\n"synergy"'}
              />
            </div>

            {/* Voice Principles */}
            <div className="border-b border-line pb-4">
              <h3 className="text-sm font-medium text-ink mb-3">5 Voice Principles</h3>
              <p className="text-xs text-ink-secondary mb-3">Format: Principle 🔹 Example (one per line)</p>
              <TextareaInput
                value={(profile.brand_data?.voice_principles || []).map((p: any) => `${p.name} 🔹 ${p.example}`).join('\n')}
                onChange={(v) => setProfile({
                  ...profile,
                  brand_data: {
                    ...profile.brand_data,
                    voice_principles: v.split('\n').filter(l => l.trim()).map(line => {
                      const [name, example] = line.split('🔹').map(s => s.trim())
                      return { name, example }
                    })
                  }
                })}
                placeholder="Clear 🔹 Control stock, orders and returns from a single panel.&#10;Practical 🔹 If your inventory is not up to date, your marketing sells problems.&#10;..."
              />
            </div>

            {/* Vocabulary */}
            <div className="border-b border-line pb-4">
              <h3 className="text-sm font-medium text-ink mb-3">Vocabulary Rules</h3>
              <p className="text-xs text-ink-secondary mb-2">Format: phrase 🔹 why (one per line). The why is the lesson — a rule without a reason gets ignored.</p>
              <label className="block text-xs font-medium text-ink-secondary mb-2">✅ We say (and why)</label>
              <TextareaInput
                value={vocabToLines(profile.brand_data?.voice_vocabulary?.do)}
                onChange={(v) => setProfile({
                  ...profile,
                  brand_data: {
                    ...profile.brand_data,
                    voice_vocabulary: {
                      ...profile.brand_data?.voice_vocabulary,
                      do: parseVocabLines(v)
                    }
                  }
                })}
                placeholder={'stock under control 🔹 concrete and operational, it is what the client buys\nfrictionless orders 🔹 promises the outcome, not the technology'}
              />
              <label className="block text-xs font-medium text-ink-secondary mb-2 mt-4">❌ We never say (and why)</label>
              <TextareaInput
                value={vocabToLines(profile.brand_data?.voice_vocabulary?.dont)}
                onChange={(v) => setProfile({
                  ...profile,
                  brand_data: {
                    ...profile.brand_data,
                    voice_vocabulary: {
                      ...profile.brand_data?.voice_vocabulary,
                      dont: parseVocabLines(v)
                    }
                  }
                })}
                placeholder={'revolutionary 🔹 everyone says it, it does not differentiate\nbest on the market 🔹 unproven claim, costs credibility'}
              />
            </div>

            {/* Golden rule — la frase que permite a cualquiera autoevaluarse */}
            <div className="border-b border-line pb-4">
              <h3 className="text-sm font-medium text-ink mb-3">Golden Rule</h3>
              <TextInput
                value={profile.brand_data?.tone_and_voice?.golden_rule || ''}
                onChange={(v) => setProfile({
                  ...profile,
                  brand_data: {
                    ...profile.brand_data,
                    tone_and_voice: { ...profile.brand_data?.tone_and_voice, golden_rule: v }
                  }
                })}
                placeholder={'"If {generic competitor} could post it, it is not {brand} enough."'}
              />
            </div>

            {/* Languages — el manual y las captions suelen ir en idiomas distintos */}
            <div className="border-b border-line pb-4">
              <h3 className="text-sm font-medium text-ink mb-3">Languages</h3>
              <div className="grid grid-cols-2 gap-4">
                <TextInput label="Manual / documents" value={profile.brand_data?.languages?.manual || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, languages: { ...profile.brand_data?.languages, manual: v } } })} placeholder="ES / EN" />
                <TextInput label="Captions / content" value={profile.brand_data?.languages?.captions || ''} onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, languages: { ...profile.brand_data?.languages, captions: v } } })} placeholder="market language (e.g. TH, ES)" />
              </div>
              <label className="block text-xs font-medium text-ink-secondary mb-2 mt-3">Per channel (channel: language, one per line)</label>
              <TextareaInput
                value={Object.entries(profile.brand_data?.languages?.per_channel || {}).map(([c, l]) => `${c}: ${l}`).join('\n')}
                onChange={(v) => {
                  const per_channel: Record<string, string> = {}
                  v.split('\n').forEach((line) => {
                    const idx = line.indexOf(':')
                    if (idx > 0) per_channel[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
                  })
                  setProfile({ ...profile, brand_data: { ...profile.brand_data, languages: { ...profile.brand_data?.languages, per_channel } } })
                }}
                placeholder={'Instagram: TH + EN\nLinkedIn: EN'}
              />
            </div>

            {/* Status Badge */}
            <div className="border-b border-line pb-4">
              <div className="flex items-center gap-3">
                <label className="block text-sm font-medium text-ink">Visual Status:</label>
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
                  className="px-4 py-2 bg-surface border border-line rounded-lg text-ink text-sm focus:border-purple-500 focus:outline-none"
                >
                  <option value="confirmed">✅ Confirmed (Client approved)</option>
                  <option value="proposed">⏳ Proposed (Pending decision)</option>
                  <option value="missing">❌ Missing (Not documented)</option>
                </select>
              </div>
            </div>

            {/* Logo — alimenta la generación de imágenes y los documentos.
                Antes no existía forma de subirlo: logo.primary_url estaba
                vacío en TODOS los clientes. */}
            <div className="border-b border-line pb-4">
              <h3 className="text-sm font-medium text-ink mb-3">{t('bb.logo', locale)}</h3>
              <div className="flex items-center gap-4">
                {(profile.brand_data?.visual_identity as any)?.logo?.primary_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={(profile.brand_data?.visual_identity as any).logo.primary_url}
                    alt="logo"
                    className="w-16 h-16 rounded-lg object-contain bg-surface border border-line p-1"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-surface border border-dashed border-line flex items-center justify-center text-ink-tertiary text-[10px] text-center px-1">
                    {t('bb.logo-empty', locale)}
                  </div>
                )}
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-ink bg-surface hover:bg-surface-hover transition-colors cursor-pointer">
                  {logoUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  {t('bb.logo-upload', locale)}
                  <input
                    type="file"
                    hidden
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleLogoUpload}
                    disabled={logoUploading}
                  />
                </label>
              </div>
            </div>

            {/* Colors Section */}
            <div className="border-b border-line pb-4">
              <h3 className="text-sm font-medium text-ink mb-4">Colors</h3>
              <div className="grid grid-cols-2 gap-4">
                {['primary', 'secondary', 'accent', 'neutral'].map((colorRole) => (
                  <div key={colorRole}>
                    <label className="block text-xs font-medium text-ink-secondary mb-2 capitalize">{colorRole}</label>
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
                          className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary focus:border-purple-500 focus:outline-none text-xs"
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
                        className="w-12 h-10 rounded cursor-pointer border border-line"
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
            <div className="border-b border-line pb-4">
              <h3 className="text-sm font-medium text-ink mb-4">Typography</h3>
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
            <div className="border-b border-line pb-4">
              <h3 className="text-sm font-medium text-ink mb-4">Logo</h3>
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
            <div className="border-b border-line pb-4">
              <h3 className="text-sm font-medium text-ink mb-4">Imagery & Aesthetic</h3>
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
            <div>
              <h3 className="text-sm font-medium text-ink mb-4">Brand Mascot / Character</h3>
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


        {activeTab === 'content_strategy' && (
          <div className="space-y-6">
            {/* Strategy & Roadmap */}
            <div className="border-b border-line pb-4">
              <h3 className="text-sm font-medium text-ink mb-3">Strategy & Roadmap</h3>
              <TextareaInput
                value={profile.brand_data?.strategy_roadmap || ''}
                onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, strategy_roadmap: v } })}
                placeholder="90-day plan, growth model, strategic principles, key milestones"
              />
            </div>

            {/* Go-to-Market Channels */}
            <div className="border-b border-line pb-4">
              <h3 className="text-sm font-medium text-ink mb-3">Go-to-Market & Channels</h3>
              <TextareaInput
                value={profile.brand_data?.go_to_market || ''}
                onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, go_to_market: v } })}
                placeholder="How you reach customers, main channels (Instagram, LinkedIn, Events, etc.), tactics"
              />
            </div>

            {/* Content Pillars — tarjetas editables (P8: fuera el formato 🔹) */}
            <div className="border-b border-line pb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-ink">Content pillars</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={proposePillars}
                    disabled={proposing}
                    className="text-xs px-3 py-1.5 rounded-lg bg-surface-hover text-ink hover:opacity-80 transition-colors disabled:opacity-60"
                    title="Proposes pillars from this client's Brain. Nothing is saved until you review and hit Save."
                  >
                    {proposing ? 'Proposing…' : '✦ Propose with AI'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPillars([...(pillars || []), { pillar_name: '', description: '', claim: '', themes: [], examples: [] }])}
                    className="text-xs px-3 py-1.5 rounded-lg bg-surface-hover text-ink hover:opacity-80 transition-colors"
                  >
                    + Add pillar
                  </button>
                </div>
              </div>
              <p className="text-xs text-ink-tertiary mb-3">Pillars feed the Monthly Content System, the content engine and the marketing quick actions. Each one: name, what it is, and its claim (the promise in one sentence).</p>
              {proposeMsg && <p className="text-xs mb-3 text-ink-secondary">{proposeMsg}</p>}
              <div className="space-y-3">
                {(pillars || []).map((p: any, i: number) => (
                  <div key={i} className="rounded-xl border border-line bg-surface p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        value={p.pillar_name || ''}
                        onChange={(e) => setPillars(pillars.map((x: any, j: number) => j === i ? { ...x, pillar_name: e.target.value } : x))}
                        placeholder="Pillar name (e.g. Sauce Science)"
                        className="flex-1 bg-page border border-line rounded-lg px-3 py-2 text-sm text-ink font-medium placeholder-ink-tertiary outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => setPillars(pillars.filter((_: any, j: number) => j !== i))}
                        className="text-xs px-2.5 py-2 rounded-lg text-red-400/80 hover:bg-red-500/10 transition-colors"
                        title="Delete pillar"
                      >
                        ✕
                      </button>
                    </div>
                    <input
                      value={p.description || ''}
                      onChange={(e) => setPillars(pillars.map((x: any, j: number) => j === i ? { ...x, description: e.target.value } : x))}
                      placeholder="What this pillar is (e.g. Education on sauces and process)"
                      className="w-full bg-page border border-line rounded-lg px-3 py-2 text-xs text-ink placeholder-ink-tertiary outline-none focus:border-purple-500"
                    />
                    <input
                      value={p.claim || ''}
                      onChange={(e) => setPillars(pillars.map((x: any, j: number) => j === i ? { ...x, claim: e.target.value } : x))}
                      placeholder="Claim — the promise in one sentence (e.g. No sauce without a story)"
                      className="w-full bg-page border border-line rounded-lg px-3 py-2 text-xs text-ink italic placeholder-ink-tertiary outline-none focus:border-purple-500"
                    />
                    <input
                      value={
                        Array.isArray(p.themes)
                          ? p.themes
                              .map((theme: unknown) =>
                                typeof theme === 'string'
                                  ? theme
                                  : (theme as { name?: string })?.name ?? ''
                              )
                              .filter(Boolean)
                              .join(', ')
                          : ''
                      }
                      onChange={(e) => setPillars(pillars.map((x: any, j: number) => j === i ? { ...x, themes: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) } : x))}
                      placeholder="Topics, comma-separated (optional)"
                      className="w-full bg-page border border-line rounded-lg px-3 py-2 text-xs text-ink-secondary placeholder-ink-tertiary outline-none focus:border-purple-500"
                    />
                  </div>
                ))}
                {(pillars || []).length === 0 && (
                  <p className="text-xs text-ink-tertiary">No pillars yet — add the first one or generate the system with the Monthly Content System.</p>
                )}
              </div>
            </div>

            {/* Editorial Rhythm */}
            <div className="border-b border-line pb-4">
              <h3 className="text-sm font-medium text-ink mb-3">Editorial Rhythm & Calendar</h3>
              <p className="text-xs text-ink-secondary mb-3">Weekly publishing rhythm, formats, and which pillar content for each day</p>
              <TextareaInput
                value={profile.brand_data?.editorial_rhythm || ''}
                onChange={(v) => setProfile({ ...profile, brand_data: { ...profile.brand_data, editorial_rhythm: v } })}
                placeholder="Mon/Tue: E-com Playbook (framework + checklist)&#10;Wed: Dadybox in Action (service, backstage)&#10;Thu/Fri: Logistics Radar (news, case study)&#10;Weekend: Magic Deliveries (creativity, reach)&#10;Principle: publish by function, not to fill a calendar."
              />
            </div>

            {/* QA Rules & Operations */}
            <div>
              <h3 className="text-sm font-medium text-ink mb-3">QA Rules & Content Operations</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-2">Base Formula (Problem → Solution → Benefit → Result → CTA)</label>
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
                  <label className="block text-xs font-medium text-ink-secondary mb-2">7-Point QA Checklist (one per line)</label>
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
                    placeholder="Does it add something useful or just fill the calendar?&#10;Is the problem framed from the client's view?&#10;Does it connect with control, margin, experience or scale?&#10;Is there a real lesson even if it is creative?&#10;Does the CTA match the funnel stage?&#10;Does the design respect colours, hierarchy and legibility?&#10;Are legal claims verified?"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-2">What to AVOID (comma-separated)</label>
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
                    placeholder="Posts with no takeaway, unproven claims, talking about magic without explaining, inconsistent visual styles, only talking about the brand..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            {/* Relectura completa. El sync de Drive solo mira los ficheros que
                han cambiado, así que sin esto la única forma de que el Brain
                reaprendiera de un documento ya sincronizado era editarlo en
                Drive para cambiarle el hash. Ver lib/brain-tools/relearn.ts. */}
            <div className="card p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[240px]">
                  <h3 className="text-sm font-medium text-ink mb-1">Re-read everything</h3>
                  <p className="text-xs text-ink-secondary">
                    Goes through every document already stored — Drive and uploads — and proposes what
                    the Brand Brain should learn, filling the fields that are still empty. Nothing is
                    written until you approve it.
                  </p>
                </div>
                <button
                  onClick={handleRelearn}
                  disabled={relearning || !activeClient?.id}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
                >
                  {relearning ? <><Loader2 size={14} className="animate-spin" /> Reading…</> : 'Re-read everything'}
                </button>
              </div>
              {relearnMsg && (
                <p className={`text-xs mt-3 ${relearnMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                  {relearnMsg.text}
                </p>
              )}
            </div>

            {activeClient?.id && <DriveFoldersPanel clientId={activeClient.id} />}

            <label className="block text-sm font-medium text-ink">Upload Brand Documents</label>
            <p className="text-xs text-ink-secondary">Upload brand books, handbooks, pitch decks, or strategy docs. Our AI will analyze and suggest updates to your Brand Brain fields.</p>

            <div className="border-2 border-dashed border-line rounded-lg p-6 text-center hover:border-purple-500/50 transition-colors">
              <input
                type="file"
                id="doc-upload"
                onChange={handleDocumentUpload}
                disabled={uploading}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
              />
              <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload size={24} className="text-ink-secondary" />
                <span className="text-sm text-ink-secondary">{uploading ? 'Uploading...' : 'Click to upload or drag files'}</span>
                <span className="text-xs text-ink-tertiary">PDF, DOC, DOCX, or TXT</span>
              </label>
            </div>

            {documents.length > 0 && (
              <div className="mt-6 space-y-2">
                <p className="text-sm font-medium text-ink">Uploaded Documents</p>
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-surface border border-line rounded text-sm">
                    <div className="flex-1">
                      <p className="text-ink-secondary">{doc.original_filename}</p>
                      <p className="text-xs text-ink-tertiary mt-1">{doc.document_type.replace(/_/g, ' ')}</p>
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

        {activeTab === 'index' && activeClient?.id && (
          <div className="space-y-6">
            <BrandBrainIndexView clientId={activeClient.id} />

            {/* Red de seguridad: todo lo que hay guardado en brand_data y NO
                tiene un widget propio en ninguna pestaña. Sin esto, un agente
                (o el sync de Drive) puede escribir conocimiento perfectamente
                válido en una clave nueva y quedarse invisible para siempre —
                que es justo lo que pasaba con `competitors`, `benchmarks`,
                `targets_2026` y `differentiator` en Salsa. */}
            {(() => {
              const extras = Object.entries(profile.brand_data ?? {})
                .filter(([key, value]) => !PAINTED_BRAND_DATA_KEYS.has(key) && hasContent(value))
              if (!extras.length) return null
              return (
                <div className="card p-4">
                  <h3 className="text-sm font-medium text-ink mb-1">Also stored in this Brain</h3>
                  <p className="text-xs text-ink-secondary mb-4">
                    Knowledge saved by an agent or by the Drive sync that has no dedicated field yet.
                    The agents already read it — this is here so you can see it.
                  </p>
                  <div className="space-y-3">
                    {extras.map(([key, value]) => (
                      <div key={key} className="rounded-lg border border-line bg-surface p-3">
                        <p className="text-xs font-medium text-ink mb-1.5">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </p>
                        <pre className="text-[11px] text-ink-secondary whitespace-pre-wrap break-words font-sans">
                          {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
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
      {label && <label className="block text-sm font-medium text-ink mb-2">{label}</label>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary focus:border-purple-500 focus:outline-none transition-colors text-sm"
      />
    </div>
  )
}

function TextareaInput({ label, value, onChange, placeholder }: { label?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-ink mb-2">{label}</label>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary focus:border-purple-500 focus:outline-none transition-colors h-32 resize-none text-sm"
      />
    </div>
  )
}
