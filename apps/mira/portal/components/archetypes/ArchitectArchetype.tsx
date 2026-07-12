'use client'
import { useState } from 'react'
import { ChevronRight, Check, Lock, Lightbulb, BookOpen } from 'lucide-react'
import { clsx } from 'clsx'

interface ArchitectStep {
  id: string
  number: number
  title: string
  description: string
  isCompleted: boolean
  content?: string
}

interface ArchitectTemplate {
  id: string
  name: string
  emoji: string
  description: string
  stepCount: number
  duration: string
}

interface ArchitectArchetypeProps {
  agentColor: string
  agentEmoji: string
  agentName: string
  templates?: ArchitectTemplate[]
  steps?: ArchitectStep[]
  selectedTemplate?: string
  onSelectTemplate?: (templateId: string) => void
  onStepComplete?: (stepId: string) => void
  onSaveBlueprint?: (blueprint: any) => void
  isLoading?: boolean
}

const DEFAULT_TEMPLATES: ArchitectTemplate[] = [
  {
    id: 'gtm-90',
    name: '90-Day GTM',
    emoji: '🚀',
    description: 'Go-to-market launch plan for new product or market',
    stepCount: 5,
    duration: '3-4 hours',
  },
  {
    id: 'product-launch',
    name: 'Product Launch',
    emoji: '🎯',
    description: 'Complete product launch sequence with phases',
    stepCount: 4,
    duration: '2-3 hours',
  },
  {
    id: 'rebranding',
    name: 'Rebranding Campaign',
    emoji: '✨',
    description: 'Strategic rebranding rollout plan',
    stepCount: 4,
    duration: '2-3 hours',
  },
  {
    id: 'partnership',
    name: 'Partnership Strategy',
    emoji: '🤝',
    description: 'Strategic partnership identification and execution',
    stepCount: 5,
    duration: '3-4 hours',
  },
]

const DEFAULT_STEPS: ArchitectStep[] = [
  {
    id: '1',
    number: 1,
    title: 'Define Target Market',
    description: 'Identify ICP, market size, competitive landscape',
    isCompleted: true,
    content: 'SaaS companies 10-100 employees in EU/US, €2M-10M ARR...',
  },
  {
    id: '2',
    number: 2,
    title: 'Positioning & Messaging',
    description: 'Craft core value proposition and messaging pillars',
    isCompleted: true,
    content: '3 key messages: Speed + Cost + Reliability',
  },
  {
    id: '3',
    number: 3,
    title: 'Channel Strategy',
    description: 'Select primary channels and tactics',
    isCompleted: false,
    content: 'Primary: LinkedIn + paid search. Secondary: partnerships',
  },
  {
    id: '4',
    number: 4,
    title: 'Launch Timeline',
    description: 'Map out weekly milestones and activities',
    isCompleted: false,
  },
  {
    id: '5',
    number: 5,
    title: 'Success Metrics',
    description: 'Define KPIs and measurement framework',
    isCompleted: false,
  },
]

export default function ArchitectArchetype({
  agentColor,
  agentEmoji,
  agentName,
  templates = DEFAULT_TEMPLATES,
  steps = DEFAULT_STEPS,
  selectedTemplate,
  onSelectTemplate,
  onStepComplete,
  onSaveBlueprint,
  isLoading = false,
}: ArchitectArchetypeProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(selectedTemplate || templates[0].id)
  const [currentStepId, setCurrentStepId] = useState<string | null>(steps[0].id)
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [stepContent, setStepContent] = useState<Record<string, string>>(
    steps.reduce((acc, step) => ({ ...acc, [step.id]: step.content || '' }), {})
  )
  const [lockedId, setLockedId] = useState<string | null>(null)

  const selectedTemplateData = templates.find(t => t.id === selectedTemplateId)
  const currentStep = steps.find(s => s.id === currentStepId)
  const completedCount = steps.filter(s => s.isCompleted).length
  const progressPercent = (completedCount / steps.length) * 100

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId)
    onSelectTemplate?.(templateId)
  }

  const handleStepComplete = (stepId: string) => {
    onStepComplete?.(stepId)
  }

  const handleSaveBlueprint = () => {
    setLockedId('blueprint')
    onSaveBlueprint?.({
      templateId: selectedTemplateId,
      steps: steps.map(s => ({
        ...s,
        content: stepContent[s.id] || s.content,
      })),
    })
    setTimeout(() => setLockedId(null), 1500)
  }

  return (
    <div className="space-y-8">
      {/* Template Selector */}
      <div className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: agentColor }}>
          📋 Select Blueprint Template
        </div>

        <div className="grid grid-cols-2 gap-3">
          {templates.map(template => (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template.id)}
              className={clsx(
                'card p-4 text-left transition-all border',
                selectedTemplateId === template.id
                  ? 'border-[#1E1E1E] bg-[#1E1E1E]'
                  : 'border-transparent hover:bg-[#0D0D0D]'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-white mb-1">
                    <span className="text-lg mr-2">{template.emoji}</span>
                    {template.name}
                  </div>
                  <div className="text-xs text-[#999] mb-2">{template.description}</div>
                  <div className="flex gap-2 text-xs text-[#666]">
                    <span>📌 {template.stepCount} steps</span>
                    <span>⏱️ {template.duration}</span>
                  </div>
                </div>
                {selectedTemplateId === template.id && (
                  <Check size={18} style={{ color: agentColor }} className="flex-shrink-0 mt-1" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      {selectedTemplateData && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: agentColor }}>
              ⚡ Progress
            </div>
            <div className="text-sm font-semibold text-white">
              {completedCount} of {steps.length} complete
            </div>
          </div>
          <div className="w-full bg-[#1E1E1E] rounded h-3 overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${progressPercent}%`, backgroundColor: agentColor }}
            />
          </div>
        </div>
      )}

      {/* Step-by-Step Builder */}
      {selectedTemplateData && (
        <div className="space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: agentColor }}>
            🔨 Build Your Blueprint
          </div>

          <div className="space-y-3">
            {steps.map((step, idx) => {
              const isSelected = currentStepId === step.id
              const isEditing = editingStepId === step.id

              return (
                <div key={step.id} className="card p-4 space-y-2">
                  {/* Step Header */}
                  <button
                    onClick={() => setCurrentStepId(step.id)}
                    className="w-full text-left flex items-start justify-between hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
                        style={{
                          backgroundColor: step.isCompleted ? agentColor : '#444',
                        }}
                      >
                        {step.isCompleted ? <Check size={16} /> : step.number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-sm">{step.title}</div>
                        <div className="text-xs text-[#999]">{step.description}</div>
                      </div>
                    </div>
                    {isSelected && <ChevronRight size={16} style={{ color: agentColor }} className="flex-shrink-0 mt-1" />}
                  </button>

                  {/* Step Content - Expanded */}
                  {isSelected && (
                    <div className="border-t border-[#1E1E1E] pt-3 mt-3 space-y-3">
                      {isEditing ? (
                        <textarea
                          value={stepContent[step.id] || ''}
                          onChange={e => setStepContent({ ...stepContent, [step.id]: e.target.value })}
                          className="w-full bg-[#0D0D0D] text-white text-sm leading-relaxed p-3 rounded border border-[#1E1E1E] focus:border-[#333] focus:outline-none resize-none"
                          rows={4}
                          placeholder="Write your plan details here..."
                        />
                      ) : (
                        <div className="relative group cursor-text" onClick={() => setEditingStepId(step.id)}>
                          <div className="text-sm text-white/90 leading-relaxed p-2 rounded hover:bg-[#0D0D0D]/50 transition-colors min-h-[60px]">
                            {stepContent[step.id] ? (
                              stepContent[step.id]
                            ) : (
                              <span className="text-[#666]">Click to add details...</span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        {isEditing && (
                          <button
                            onClick={() => setEditingStepId(null)}
                            className="px-3 py-1.5 text-xs rounded bg-[#1E1E1E] hover:bg-[#2E2E2E] text-[#999]"
                          >
                            Done
                          </button>
                        )}
                        {!step.isCompleted && (
                          <button
                            onClick={() => handleStepComplete(step.id)}
                            className="px-3 py-1.5 text-xs rounded font-medium flex items-center gap-1 transition-all"
                            style={{
                              backgroundColor: `${agentColor}20`,
                              color: agentColor,
                              border: `1px solid ${agentColor}40`,
                            }}
                          >
                            <Check size={12} />
                            Mark Complete
                          </button>
                        )}
                        {step.isCompleted && (
                          <button
                            disabled
                            className="px-3 py-1.5 text-xs rounded font-medium flex items-center gap-1"
                            style={{
                              backgroundColor: `${agentColor}30`,
                              color: agentColor,
                            }}
                          >
                            <Check size={12} />
                            Completed
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Save Blueprint Action */}
      {selectedTemplateData && (
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: agentColor }}>
            ✅ Lock Blueprint
          </div>

          <button
            onClick={handleSaveBlueprint}
            disabled={isLoading}
            className="w-full py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
            style={{
              backgroundColor: agentColor,
              color: 'white',
              opacity: isLoading || lockedId ? 0.7 : 1,
              transform: lockedId ? 'scale(0.98)' : 'scale(1)',
            }}
          >
            <Lock size={16} />
            {lockedId === 'blueprint' ? 'Blueprint Locked ✓' : 'Save & Lock Blueprint'}
          </button>

          <div className="p-3 rounded bg-[#0D0D0D] border border-[#1E1E1E]">
            <div className="flex gap-2 items-start text-xs text-[#999]">
              <Lightbulb size={14} className="flex-shrink-0 mt-0.5" />
              <div>
                When locked, this blueprint becomes your strategic reference. You can still edit individual steps,
                but the overall structure is committed.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
