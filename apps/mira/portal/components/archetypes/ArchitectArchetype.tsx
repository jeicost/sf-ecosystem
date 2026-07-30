'use client'
import { useState } from 'react'
import { ChevronRight, Check, ClipboardList } from 'lucide-react'
import { clsx } from 'clsx'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import type { ArchitectTemplate, ArchitectData } from '@/lib/architect-data'

interface ArchitectArchetypeProps {
  agentColor: string
  status?: 'loading' | 'ready' | 'empty' | 'error'
  errorMessage?: string
  data?: ArchitectData
}

export default function ArchitectArchetype({ agentColor, status = 'ready', errorMessage, data }: ArchitectArchetypeProps) {
  const { locale } = useLocaleContext()
  const templates = data?.templates ?? []
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(templates[0]?.id)
  const [currentStepId, setCurrentStepId] = useState<string | null>(null)

  if (status === 'loading') {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 rounded-lg bg-surface" />
        <div className="h-48 rounded-lg bg-surface" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="card p-6 text-center border border-dashed border-line">
        <div className="text-sm text-ink font-medium">{t('agent.workspace.error-title', locale)}</div>
        <div className="text-xs text-ink-tertiary mt-1">{errorMessage || t('agent.workspace.error-desc', locale)}</div>
      </div>
    )
  }

  if (status === 'empty' || templates.length === 0) {
    return (
      <div className="card p-6 text-center border border-dashed border-line">
        <ClipboardList size={24} className="mx-auto text-ink-tertiary mb-2" />
        <div className="text-sm text-ink font-medium">{t('archetype.architect.empty-title', locale)}</div>
        <div className="text-xs text-ink-tertiary mt-1">{t('archetype.architect.empty-desc', locale)}</div>
      </div>
    )
  }

  const selectedTemplate: ArchitectTemplate | undefined = templates.find((tpl) => tpl.id === selectedTemplateId) ?? templates[0]
  const steps = selectedTemplate?.steps ?? []
  const completedCount = steps.filter((s) => s.isCompleted).length
  const progressPercent = steps.length > 0 ? (completedCount / steps.length) * 100 : 0

  return (
    <div className="space-y-8">
      {templates.length > 1 && (
        <div className="space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: agentColor }}>
            📋 {t('archetype.architect.select-template', locale)}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => {
                  setSelectedTemplateId(tpl.id)
                  setCurrentStepId(null)
                }}
                className={clsx(
                  'card p-4 text-left transition-all border',
                  selectedTemplateId === tpl.id ? 'border-line bg-surface-hover' : 'border-transparent hover:bg-surface'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-ink mb-1">
                      <span className="text-lg mr-2">{tpl.emoji}</span>
                      {tpl.name}
                    </div>
                    {tpl.description && <div className="text-xs text-ink-secondary mb-2">{tpl.description}</div>}
                    <div className="text-xs text-ink-tertiary">
                      📌 {tpl.steps.length} {tpl.steps.length === 1 ? t('archetype.architect.step', locale).toLowerCase() : t('archetype.architect.steps-plural', locale)}
                    </div>
                  </div>
                  {selectedTemplateId === tpl.id && <Check size={18} style={{ color: agentColor }} className="flex-shrink-0 mt-1" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedTemplate && (
        <>
          {steps.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: agentColor }}>
                  ⚡ {t('archetype.architect.progress', locale)}
                </div>
                <div className="text-sm font-semibold text-ink">
                  {t('archetype.architect.complete-of', locale)
                    .replace('{completed}', String(completedCount))
                    .replace('{total}', String(steps.length))}
                </div>
              </div>
              <div className="w-full bg-surface-hover rounded h-3 overflow-hidden">
                <div className="h-full transition-all duration-300" style={{ width: `${progressPercent}%`, backgroundColor: agentColor }} />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: agentColor }}>
              🔨 {t('archetype.architect.build', locale)}
            </div>

            <div className="space-y-3">
              {steps.map((step) => {
                const isSelected = currentStepId === step.id
                return (
                  <div key={step.id} className="card p-4 space-y-2">
                    <button
                      onClick={() => setCurrentStepId(isSelected ? null : step.id)}
                      className="w-full text-left flex items-start justify-between hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className={clsx(
                            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white',
                            !step.isCompleted && 'bg-line'
                          )}
                          style={step.isCompleted ? { backgroundColor: agentColor } : undefined}
                        >
                          {step.isCompleted ? <Check size={16} /> : step.number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-ink text-sm">{step.title}</div>
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className={clsx('flex-shrink-0 mt-1 transition-transform', isSelected && 'rotate-90')}
                        style={{ color: agentColor }}
                      />
                    </button>

                    {isSelected && step.description && (
                      <div className="border-t border-line pt-3 mt-3">
                        <div className="text-sm text-ink leading-relaxed">{step.description}</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {selectedTemplate.reportUrl && (
            <a
              href={selectedTemplate.reportUrl}
              className="block text-center w-full py-3 rounded-lg font-medium text-sm text-white transition-all"
              style={{ backgroundColor: agentColor }}
            >
              {t('archetype.architect.view-full-report', locale)}
            </a>
          )}
        </>
      )}
    </div>
  )
}
