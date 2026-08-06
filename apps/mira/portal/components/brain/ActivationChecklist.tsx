'use client'

import { useEffect, useState } from 'react'
import { Circle, ChevronDown, ChevronUp } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'

interface ChecklistStep {
  id: string
  label: string
  hint: string
  /** id estable de la pestaña (data-bb-tab), NO su etiqueta traducida */
  tabId: string
  done: boolean
}

function buildSteps(
  brandData: Record<string, any>,
  pillars: any[],
  documents: any[],
  flat: { name?: string | null; mission?: string | null; tone_of_voice?: string | null } = {}
): ChecklistStep[] {
  return [
    {
      id: 'identity',
      label: 'Define brand identity',
      hint: 'Add your brand name and mission statement',
      tabId: 'brand_identity',
      // Acepta tanto brand_data.identity.* (lo que edita esta UI) como las
      // columnas planas name/mission (lo que rellena el alta por onboarding).
      // Antes solo miraba brand_data, así que un cliente dado de alta por el
      // wizard tenía este paso en rojo para siempre por mucho que su misión
      // estuviera puesta.
      done: Boolean(
        (brandData.identity?.name?.trim() || flat.name?.trim()) &&
        (brandData.identity?.mission?.trim() || flat.mission?.trim())
      ),
    },
    {
      id: 'audience',
      label: 'Describe your audience',
      hint: 'Add at least one audience segment',
      tabId: 'audience_market',
      done: Array.isArray(brandData.audiences) && brandData.audiences.length > 0,
    },
    {
      id: 'voice_visual',
      label: 'Set voice & visual identity',
      hint: 'Add a brand archetype, a voice principle or a tone of voice',
      tabId: 'voice_visual',
      // Se añade tone_of_voice: era el único de los tres que alguna vía
      // automática (onboarding, análisis de documento, cuestionario) llegaba a
      // rellenar, así que sin él este paso solo se podía completar a mano.
      done: Boolean(
        (brandData.voice_archetypes || []).some((a: string) => a?.trim()) ||
        (brandData.voice_principles || []).length > 0 ||
        brandData.tone_and_voice?.summary?.trim() ||
        flat.tone_of_voice?.trim()
      ),
    },
    {
      id: 'content_strategy',
      label: 'Add content pillars',
      hint: 'Define at least one content pillar',
      tabId: 'content_strategy',
      done: pillars.length > 0,
    },
    {
      id: 'business_ops',
      label: 'Explain your business model',
      hint: 'Revenue streams, pricing, customer types',
      tabId: 'business_ops',
      done: Boolean(brandData.business_model?.trim()),
    },
    {
      id: 'documents',
      label: 'Upload a brand document',
      hint: 'Feeds the agents and lets AI auto-suggest your Brand Brain fields',
      tabId: 'documents',
      done: documents.length > 0,
    },
  ]
}

function goToTab(tabId: string) {
  if (typeof document === 'undefined') return
  const root = document.getElementById('brand-brain-editor') || document
  // Selector por data-bb-tab (ver BrandBrainEditor): buscarlo por el texto del
  // botón solo funcionaba con el portal en inglés.
  const button = root.querySelector<HTMLButtonElement>(`button[data-bb-tab="${tabId}"]`)
  button?.click()
  button?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

export default function ActivationChecklist() {
  const { activeClient } = useActiveClient()
  const [steps, setSteps] = useState<ChecklistStep[] | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!activeClient?.id) {
        setSteps(null)
        return
      }

      try {
        const profileUrl = new URL('/api/brand-brain', window.location.origin)
        profileUrl.searchParams.set('clientId', activeClient.id)
        const docsUrl = new URL('/api/brand-brain/documents', window.location.origin)
        docsUrl.searchParams.set('clientId', activeClient.id)

        const [profileRes, docsRes] = await Promise.all([fetch(profileUrl), fetch(docsUrl)])
        const profileJson = profileRes.ok ? await profileRes.json() : { data: null, pillars: [] }
        const docsJson = docsRes.ok ? await docsRes.json() : { data: [] }

        if (cancelled) return

        const brandData = profileJson.data?.brand_data || {}
        // Columnas planas del perfil: son las que rellena el alta por
        // onboarding, y sin ellas el checklist marcaba como pendientes pasos
        // que ya estaban hechos.
        const flat = {
          name: profileJson.data?.name,
          mission: profileJson.data?.mission,
          tone_of_voice: profileJson.data?.tone_of_voice,
        }
        setSteps(buildSteps(brandData, profileJson.pillars || [], docsJson.data || [], flat))
      } catch {
        if (!cancelled) setSteps(null)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [activeClient?.id])

  if (!steps) return null

  const total = steps.length
  const doneCount = steps.filter((s) => s.done).length
  const percent = total ? Math.round((doneCount / total) * 100) : 0

  if (percent >= 100) return null

  const remaining = steps.filter((s) => !s.done)

  return (
    <div className="card p-5 mb-6">
      <button onClick={() => setCollapsed((c) => !c)} className="w-full flex items-center gap-4 text-left">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <p className="text-sm font-medium text-ink">Brand Brain activation</p>
            <span className="text-xs text-ink-tertiary">{doneCount}/{total} complete</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-hover overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${percent}%`, background: '#A855F7' }}
            />
          </div>
        </div>
        <span className="text-xs font-semibold text-ink-secondary shrink-0">{percent}%</span>
        {collapsed ? (
          <ChevronDown size={16} className="text-ink-tertiary shrink-0" />
        ) : (
          <ChevronUp size={16} className="text-ink-tertiary shrink-0" />
        )}
      </button>

      {!collapsed && (
        <ol className="mt-4 space-y-1">
          {remaining.map((step, i) => (
            <li key={step.id}>
              <button
                onClick={() => goToTab(step.tabId)}
                className="w-full flex items-start gap-3 text-left p-2 -mx-2 rounded-lg hover:bg-surface transition-colors"
              >
                <Circle size={16} className="text-ink-tertiary mt-0.5 shrink-0" />
                <span className="flex-1">
                  <span className="text-sm text-ink">{step.label}</span>
                  {i === 0 && (
                    <span
                      className="ml-2 text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded"
                      style={{ color: '#A855F7', background: 'rgba(168,85,247,0.12)' }}
                    >
                      Do this first
                    </span>
                  )}
                  <span className="block text-xs text-ink-tertiary mt-0.5">{step.hint}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
