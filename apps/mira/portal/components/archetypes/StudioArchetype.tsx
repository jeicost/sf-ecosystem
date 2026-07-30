'use client'
import { useState } from 'react'
import { Palette, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import { useToolConnections } from '@/lib/hooks/useToolConnections'

// NOTE: this is the "Studio" chat-interface archetype (one of MIRA's 6 agent
// Workspace layouts, lib/agent-archetypes.ts). It is UNRELATED to the future
// "Estudio Visual" product described in docs/VISUAL_GENERATION_INTEGRATION.md
// (the governed visual-production pipeline, still gated behind
// feat/visual-production-foundation) -- same name in Spanish, different
// things. Don't conflate the two.

export interface DesignProject {
  id: string
  name: string
  type: 'post' | 'video' | 'thumbnail'
  tool: 'canva' | 'figma' | 'custom'
  status: 'approved'
  updatedAt: string
  preview?: string
}

interface StudioArchetypeProps {
  agentColor: string
  clientId?: string
  status?: 'loading' | 'ready' | 'empty' | 'error'
  errorMessage?: string
  projects?: DesignProject[]
}

const getProjectTypeIcon = (type: string) => {
  switch (type) {
    case 'post':
      return '📸'
    case 'video':
      return '🎬'
    case 'thumbnail':
      return '🖼️'
    default:
      return '🎨'
  }
}

const getToolEmoji = (tool: string) => {
  switch (tool) {
    case 'canva':
      return '🎨'
    case 'figma':
      return '🖌️'
    default:
      return '⚙️'
  }
}

export default function StudioArchetype({
  agentColor,
  clientId = '',
  status = 'ready',
  errorMessage,
  projects = [],
}: StudioArchetypeProps) {
  const { locale } = useLocaleContext()
  const { connectedTools } = useToolConnections(clientId)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id || null)

  if (status === 'loading') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-pulse">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 rounded-lg bg-surface" />
        ))}
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

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: agentColor }}>
          🎨 {t('archetype.studio.your-canvas', locale)}
        </div>

        {projects.length === 0 ? (
          <div className="card p-6 text-center border border-dashed border-line">
            <Palette size={24} className="mx-auto text-ink-tertiary mb-2" />
            <div className="text-sm text-ink font-medium">{t('archetype.studio.empty-title', locale)}</div>
            <div className="text-xs text-ink-tertiary mt-1">{t('archetype.studio.empty-desc', locale)}</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {projects.map((project) => {
              const isSelected = selectedProjectId === project.id
              return (
                <button
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className={clsx(
                    'card p-3 text-left transition-all border',
                    isSelected ? 'border-line bg-surface-hover' : 'border-transparent hover:bg-surface'
                  )}
                >
                  <div className="mb-2 w-full h-24 bg-gradient-to-br from-surface-hover to-surface rounded border border-line flex items-center justify-center overflow-hidden">
                    {project.preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={project.preview} alt={project.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">{getProjectTypeIcon(project.type)}</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-ink line-clamp-2 block">{project.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-ink-tertiary">{getToolEmoji(project.tool)}</span>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium w-fit"
                        style={{ backgroundColor: '#10B98130', color: '#10B981' }}
                      >
                        ✅ {t('archetype.studio.status', locale)}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {selectedProject && (
        <div className="space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: agentColor }}>
            ✏️ {t('archetype.studio.edit-review', locale)}
          </div>

          <div className="card p-6 space-y-6 border border-line">
            <div className="space-y-3">
              <div className="text-sm font-semibold text-ink">{selectedProject.name}</div>
              {selectedProject.preview ? (
                <div className="w-full rounded border border-line overflow-hidden flex items-center justify-center bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedProject.preview} alt={selectedProject.name} className="max-h-96 w-auto object-contain" />
                </div>
              ) : (
                <div className="w-full bg-gradient-to-br from-surface-hover to-surface rounded border-2 border-dashed border-line flex items-center justify-center p-12">
                  <span className="text-5xl">{getProjectTypeIcon(selectedProject.type)}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-surface rounded space-y-1">
                <div className="text-xs text-ink-tertiary">{t('archetype.studio.type', locale)}</div>
                <div className="text-sm font-medium text-ink capitalize">{selectedProject.type}</div>
              </div>
              <div className="p-3 bg-surface rounded space-y-1">
                <div className="text-xs text-ink-tertiary">{t('archetype.studio.updated', locale)}</div>
                <div className="text-sm font-medium text-ink">{selectedProject.updatedAt}</div>
              </div>
            </div>

            <div className="border-t border-line pt-4 flex gap-2 flex-wrap">
              {selectedProject.preview && (
                <a
                  href={selectedProject.preview}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 text-xs rounded font-medium flex items-center gap-1 transition-all"
                  style={{ backgroundColor: `${agentColor}20`, color: agentColor, border: `1px solid ${agentColor}40` }}
                >
                  <ExternalLink size={14} />
                  {t('archetype.studio.open-image', locale)}
                </a>
              )}
              <a
                href="/approvals"
                className="px-3 py-2 text-xs rounded font-medium text-white transition-all"
                style={{ backgroundColor: agentColor }}
              >
                {t('archetype.studio.view-in-approvals', locale)}
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: agentColor }}>
          🔗 {t('archetype.studio.connected-tools', locale)}
        </div>

        <div className="space-y-2">
          {connectedTools.length === 0 ? (
            <div className="card p-4 text-center">
              <Palette size={24} className="mx-auto text-ink-tertiary mb-2" />
              <div className="text-sm text-ink font-medium">{t('archetype.studio.no-tools', locale)}</div>
              <div className="text-xs text-ink-tertiary mt-1">{t('archetype.studio.no-tools-desc', locale)}</div>
            </div>
          ) : (
            connectedTools.map((tool) => (
              <div key={tool} className="card p-3 border border-line flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getToolEmoji(tool)}</span>
                  <div className="text-sm font-medium text-ink capitalize">{tool}</div>
                </div>
                <span className="text-xs text-[#10B981]">✓ {t('archetype.studio.connected', locale)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
