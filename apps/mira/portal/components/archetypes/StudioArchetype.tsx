'use client'
import { useState } from 'react'
import { Plus, Edit, Eye, Download, Lock, Film, Palette, Zap } from 'lucide-react'
import { clsx } from 'clsx'

interface DesignProject {
  id: string
  name: string
  type: 'post' | 'video' | 'thumbnail'
  tool: 'canva' | 'figma' | 'custom'
  status: 'draft' | 'review' | 'approved' | 'exported'
  updatedAt: string
  dimensions?: string
  preview?: string
}

interface StudioArchetypeProps {
  agentColor: string
  agentEmoji: string
  agentName: string
  projects?: DesignProject[]
  onCreateProject?: (type: 'post' | 'video' | 'thumbnail') => void
  onEditProject?: (projectId: string) => void
  onApproveProject?: (projectId: string) => void
  onExportProject?: (projectId: string) => void
  connectedTools?: string[]
}

const DEFAULT_PROJECTS: DesignProject[] = [
  {
    id: '1',
    name: 'May Campaign Social Post',
    type: 'post',
    tool: 'canva',
    status: 'approved',
    updatedAt: '2 hours ago',
    dimensions: '1080 × 1350',
  },
  {
    id: '2',
    name: 'Product Launch Teaser',
    type: 'video',
    tool: 'canva',
    status: 'review',
    updatedAt: '30 min ago',
    dimensions: '1920 × 1080',
  },
  {
    id: '3',
    name: 'YouTube Thumbnail Draft',
    type: 'thumbnail',
    tool: 'figma',
    status: 'draft',
    updatedAt: '1 day ago',
    dimensions: '1280 × 720',
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft':
      return { bg: '#64748B30', border: '#64748B', icon: '#64748B', emoji: '✏️' }
    case 'review':
      return { bg: '#F59E0B30', border: '#F59E0B', icon: '#F59E0B', emoji: '👁️' }
    case 'approved':
      return { bg: '#10B98130', border: '#10B981', icon: '#10B981', emoji: '✅' }
    case 'exported':
      return { bg: '#3B82F630', border: '#3B82F6', icon: '#3B82F6', emoji: '📦' }
    default:
      return { bg: '#1E1E1E', border: '#444', icon: '#999', emoji: '•' }
  }
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
  agentEmoji,
  agentName,
  projects = DEFAULT_PROJECTS,
  onCreateProject,
  onEditProject,
  onApproveProject,
  onExportProject,
  connectedTools = ['canva'],
}: StudioArchetypeProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id || null)
  const [lockedId, setLockedId] = useState<string | null>(null)

  const selectedProject = projects.find(p => p.id === selectedProjectId)

  const handleApprove = (projectId: string) => {
    onApproveProject?.(projectId)
    setLockedId(projectId)
    setTimeout(() => setLockedId(null), 1500)
  }

  const handleExport = (projectId: string) => {
    onExportProject?.(projectId)
    setLockedId(projectId)
    setTimeout(() => setLockedId(null), 1500)
  }

  return (
    <div className="space-y-8">
      {/* Canvas/Project Selector */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: agentColor }}>
            🎨 Your Canvas
          </div>
          <button
            onClick={() => onCreateProject?.('post')}
            className="px-3 py-1.5 text-xs rounded font-medium flex items-center gap-1 transition-all"
            style={{
              backgroundColor: `${agentColor}20`,
              color: agentColor,
              border: `1px solid ${agentColor}40`,
            }}
          >
            <Plus size={14} />
            New Project
          </button>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-3 gap-3">
          {projects.map(project => {
            const isSelected = selectedProjectId === project.id
            const statusColor = getStatusColor(project.status)

            return (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className={clsx(
                  'card p-3 text-left transition-all border',
                  isSelected
                    ? 'border-[#1E1E1E] bg-[#1E1E1E]'
                    : 'border-transparent hover:bg-[#0D0D0D]'
                )}
              >
                {/* Project Preview */}
                <div className="mb-2 w-full h-24 bg-gradient-to-br from-[#1E1E1E] to-[#0D0D0D] rounded border border-[#1E1E1E] flex items-center justify-center">
                  <span className="text-4xl">{getProjectTypeIcon(project.type)}</span>
                </div>

                {/* Project Info */}
                <div className="space-y-2">
                  <div className="flex items-start gap-1">
                    <span className="text-sm font-medium text-white flex-1 line-clamp-2">{project.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#666]">{getToolEmoji(project.tool)}</span>
                    <span className="text-xs text-[#666]">{project.dimensions}</span>
                  </div>

                  <div
                    className="px-2 py-1 rounded text-xs font-medium w-fit"
                    style={{ backgroundColor: statusColor.bg, color: statusColor.icon }}
                  >
                    {statusColor.emoji} {project.status}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Editing Area */}
      {selectedProject && (
        <div className="space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: agentColor }}>
            ✏️ Edit & Review
          </div>

          <div className="card p-6 space-y-6 border border-[#1E1E1E]">
            {/* Canvas Preview */}
            <div className="space-y-3">
              <div className="text-sm font-semibold text-white">{selectedProject.name}</div>
              <div className="w-full bg-gradient-to-br from-[#1E1E1E] to-[#0D0D0D] rounded border-2 border-dashed border-[#333] flex items-center justify-center p-12">
                <div className="text-center space-y-3">
                  <div className="text-5xl">{getProjectTypeIcon(selectedProject.type)}</div>
                  <div className="text-sm text-[#666]">{selectedProject.dimensions}</div>
                  <button
                    onClick={() => onEditProject?.(selectedProject.id)}
                    className="mt-4 px-4 py-2 rounded font-medium text-sm transition-all flex items-center gap-2 mx-auto"
                    style={{
                      backgroundColor: `${agentColor}20`,
                      color: agentColor,
                      border: `1px solid ${agentColor}40`,
                    }}
                  >
                    <Edit size={14} />
                    Open in {selectedProject.tool === 'canva' ? 'Canva' : 'Figma'}
                  </button>
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-[#0D0D0D] rounded space-y-1">
                <div className="text-xs text-[#666]">Type</div>
                <div className="text-sm font-medium text-white capitalize">{selectedProject.type}</div>
              </div>
              <div className="p-3 bg-[#0D0D0D] rounded space-y-1">
                <div className="text-xs text-[#666]">Tool</div>
                <div className="text-sm font-medium text-white capitalize">{getToolEmoji(selectedProject.tool)} {selectedProject.tool}</div>
              </div>
              <div className="p-3 bg-[#0D0D0D] rounded space-y-1">
                <div className="text-xs text-[#666]">Status</div>
                <div className="text-sm font-medium text-white capitalize">{selectedProject.status}</div>
              </div>
              <div className="p-3 bg-[#0D0D0D] rounded space-y-1">
                <div className="text-xs text-[#666]">Updated</div>
                <div className="text-sm font-medium text-white">{selectedProject.updatedAt}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-[#1E1E1E] pt-4 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: agentColor }}>
                Actions
              </div>

              <div className="flex gap-2 flex-wrap">
                {selectedProject.status === 'draft' && (
                  <>
                    <button
                      onClick={() => onEditProject?.(selectedProject.id)}
                      className="px-3 py-2 text-xs rounded font-medium flex items-center gap-1 transition-all flex-1"
                      style={{
                        backgroundColor: `${agentColor}20`,
                        color: agentColor,
                        border: `1px solid ${agentColor}40`,
                      }}
                    >
                      <Edit size={14} />
                      Continue Editing
                    </button>
                    <button
                      onClick={() => handleApprove(selectedProject.id)}
                      className="px-3 py-2 text-xs rounded font-medium flex items-center gap-1 transition-all flex-1"
                      style={{
                        backgroundColor: `${agentColor}20`,
                        color: agentColor,
                        border: `1px solid ${agentColor}40`,
                      }}
                    >
                      <Eye size={14} />
                      Submit for Review
                    </button>
                  </>
                )}

                {selectedProject.status === 'review' && (
                  <>
                    <button
                      onClick={() => handleApprove(selectedProject.id)}
                      className="px-3 py-2 text-xs rounded font-medium flex items-center gap-1 transition-all flex-1"
                      style={{
                        backgroundColor: `#10B98120`,
                        color: '#10B981',
                        border: `1px solid #10B98140`,
                      }}
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => onEditProject?.(selectedProject.id)}
                      className="px-3 py-2 text-xs rounded font-medium flex items-center gap-1 transition-all flex-1"
                      style={{
                        backgroundColor: `#F59E0B20`,
                        color: '#F59E0B',
                        border: `1px solid #F59E0B40`,
                      }}
                    >
                      📝 Request Changes
                    </button>
                  </>
                )}

                {selectedProject.status === 'approved' && (
                  <button
                    onClick={() => handleExport(selectedProject.id)}
                    disabled={lockedId === selectedProject.id}
                    className="px-3 py-2 text-xs rounded font-medium flex items-center gap-1 transition-all flex-1"
                    style={{
                      backgroundColor: agentColor,
                      color: 'white',
                      opacity: lockedId === selectedProject.id ? 0.7 : 1,
                      transform: lockedId === selectedProject.id ? 'scale(0.98)' : 'scale(1)',
                    }}
                  >
                    <Download size={14} />
                    {lockedId === selectedProject.id ? 'Exported ✓' : 'Export for Posting'}
                  </button>
                )}

                {selectedProject.status === 'exported' && (
                  <button disabled className="px-3 py-2 text-xs rounded font-medium flex items-center gap-1 flex-1"
                    style={{
                      backgroundColor: '#3B82F630',
                      color: '#3B82F6',
                    }}
                  >
                    <Lock size={14} />
                    Ready to Post
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connected Tools */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: agentColor }}>
          🔗 Connected Tools
        </div>

        <div className="space-y-2">
          {connectedTools.length === 0 ? (
            <div className="card p-4 text-center">
              <Palette size={24} className="mx-auto text-[#666] mb-2" />
              <div className="text-sm text-white font-medium">No Tools Connected</div>
              <div className="text-xs text-[#666] mt-1">Connect Canva, Figma, or other design tools to unlock features</div>
            </div>
          ) : (
            connectedTools.map(tool => (
              <div key={tool} className="card p-3 border border-[#1E1E1E] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getToolEmoji(tool)}</span>
                  <div>
                    <div className="text-sm font-medium text-white capitalize">{tool}</div>
                    <div className="text-xs text-[#666]">Connected</div>
                  </div>
                </div>
                <span className="text-xs text-[#10B981]">✓ Active</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Workflow Guide */}
      <div className="p-4 rounded bg-[#0D0D0D] border border-[#1E1E1E] space-y-2">
        <div className="flex gap-2 items-start text-xs text-[#999]">
          <Zap size={14} className="flex-shrink-0 mt-0.5" style={{ color: agentColor }} />
          <div>
            <div className="font-medium text-white mb-1">Studio Workflow</div>
            <ul className="space-y-1 text-[#999]">
              <li>✏️ <strong>Draft:</strong> Create & edit your design</li>
              <li>👁️ <strong>Review:</strong> Submit for approval</li>
              <li>✅ <strong>Approved:</strong> Ready to export</li>
              <li>📦 <strong>Exported:</strong> Download & post</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
