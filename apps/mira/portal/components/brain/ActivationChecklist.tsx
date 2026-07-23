'use client'

import { useEffect, useState } from 'react'
import { Circle, ChevronDown, ChevronUp } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'

interface ChecklistStep {
  id: string
  label: string
  hint: string
  tabLabel: string
  done: boolean
}

function buildSteps(brandData: Record<string, any>, pillars: any[], documents: any[]): ChecklistStep[] {
  return [
    {
      id: 'identity',
      label: 'Define brand identity',
      hint: 'Add your brand name and mission statement',
      tabLabel: 'Brand Identity',
      done: Boolean(brandData.identity?.name?.trim() && brandData.identity?.mission?.trim()),
    },
    {
      id: 'audience',
      label: 'Describe your audience',
      hint: 'Add at least one audience segment',
      tabLabel: 'Audience & Market',
      done: Array.isArray(brandData.audiences) && brandData.audiences.length > 0,
    },
    {
      id: 'voice_visual',
      label: 'Set voice & visual identity',
      hint: 'Add a brand archetype or a voice principle',
      tabLabel: 'Voice & Visual',
      done: Boolean(
        (brandData.voice_archetypes || []).some((a: string) => a?.trim()) ||
        (brandData.voice_principles || []).length > 0
      ),
    },
    {
      id: 'content_strategy',
      label: 'Add content pillars',
      hint: 'Define at least one content pillar',
      tabLabel: 'Content Strategy',
      done: pillars.length > 0,
    },
    {
      id: 'business_ops',
      label: 'Explain your business model',
      hint: 'Revenue streams, pricing, customer types',
      tabLabel: 'Business & Ops',
      done: Boolean(brandData.business_model?.trim()),
    },
    {
      id: 'documents',
      label: 'Upload a brand document',
      hint: 'Lets AI auto-suggest your Brand Brain fields',
      tabLabel: 'Documents',
      done: documents.length > 0,
    },
  ]
}

function goToTab(tabLabel: string) {
  if (typeof document === 'undefined') return
  const root = document.getElementById('brand-brain-editor') || document
  const button = Array.from(root.querySelectorAll('button')).find((b) => b.textContent?.includes(tabLabel))
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
        setSteps(buildSteps(brandData, profileJson.pillars || [], docsJson.data || []))
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
                onClick={() => goToTab(step.tabLabel)}
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
