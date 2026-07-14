'use client'
import { DEPARTMENT_TOOLS, getNextUnlockSuggestion, calculateDepartmentToolScore, type DepartmentSlug, type ToolType } from '@/lib/department-tools'
import { Plus, Zap, Lock } from 'lucide-react'
import { clsx } from 'clsx'

interface ToolsPanelProps {
  department: DepartmentSlug
  connectedTools: ToolType[]
  accentColor: string
  onConnectTool?: (toolId: ToolType) => void
  departmentAgents?: string[] // agents currently active in this department
}

export default function ToolsPanel({
  department,
  connectedTools,
  accentColor,
  onConnectTool,
  departmentAgents = [],
}: ToolsPanelProps) {
  const toolScore = calculateDepartmentToolScore(department, connectedTools)
  const nextSuggestion = getNextUnlockSuggestion(department, connectedTools)
  const allTools = Object.values(DEPARTMENT_TOOLS).filter(t =>
    t.departments.includes(department)
  )

  const connectedToolsData = connectedTools
    .map(id => DEPARTMENT_TOOLS[id])
    .filter(Boolean)
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, 'nice-to-have': 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

  const availableTools = allTools.filter(t => !connectedTools.includes(t.id))

  return (
    <div className="w-80 bg-[#0D0D0D] border-l border-[#1E1E1E] overflow-y-auto space-y-6 p-4">
      {/* Header */}
      <div className="sticky top-0 bg-[#0D0D0D] pb-4">
        <h3 className="text-sm font-bold text-white mb-2">🔗 Integrations</h3>
        <div className="space-y-2">
          <div className="text-xs text-[#666]">Tool Adoption</div>
          <div className="w-full bg-[#1E1E1E] rounded h-2 overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${toolScore}%`, backgroundColor: accentColor }}
            />
          </div>
          <div className="text-xs text-[#999]">
            {connectedTools.length} of {allTools.length} tools connected
          </div>
        </div>
      </div>

      {/* Connected Tools */}
      {connectedToolsData.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-[#666] uppercase">Active Tools</div>
          <div className="space-y-2">
            {connectedToolsData.map(tool => (
                <div
                  key={tool.id}
                  className="card p-3 border border-[#1E1E1E] space-y-2"
                  style={{
                    borderColor: `${accentColor}40`,
                    backgroundColor: `${accentColor}10`,
                  }}
                >
                  {/* Tool Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{tool.emoji}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-white">{tool.name}</div>
                        <div className="text-xs text-[#666]">{tool.category}</div>
                      </div>
                    </div>
                    <span className="text-xs text-[#10B981] flex-shrink-0">✓</span>
                  </div>

                  {/* Agents Using Tool */}
                  {tool.agentsUnlocked.length > 0 && (
                    <div className="pt-2 border-t border-[#1E1E1E]">
                      <div className="text-xs text-[#999] mb-1">Agents Unlocked</div>
                      <div className="flex flex-wrap gap-1">
                        {tool.agentsUnlocked.map(agent => (
                          <span
                            key={agent}
                            className="px-2 py-0.5 text-xs rounded capitalize"
                            style={{
                              backgroundColor: `${accentColor}30`,
                              color: accentColor,
                            }}
                          >
                            {agent}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Tools */}
      {availableTools.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-[#666] uppercase">Available</div>
          <div className="space-y-2">
            {availableTools.map(tool => (
              <button
                key={tool.id}
                onClick={() => onConnectTool?.(tool.id)}
                className={clsx(
                  'w-full card p-3 border transition-all text-left space-y-2',
                  tool.priority === 'critical' || tool === nextSuggestion
                    ? 'border-[#F59E0B] bg-[#F59E0B]10'
                    : 'border-[#1E1E1E] hover:border-[#333]'
                )}
              >
                {/* Tool Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{tool.emoji}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-white">{tool.name}</div>
                      <div className="text-xs text-[#666]">{tool.category}</div>
                    </div>
                  </div>
                  {tool === nextSuggestion && (
                    <Zap size={14} className="text-[#F59E0B] flex-shrink-0" />
                  )}
                </div>

                {/* Description & Agents */}
                <div className="space-y-2 pt-1 border-t border-[#1E1E1E]">
                  <p className="text-xs text-[#999]">{tool.description}</p>
                  {tool.agentsUnlocked.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs text-[#666]">
                        🔓 Unlocks {tool.agentsUnlocked.length} agent{tool.agentsUnlocked.length !== 1 ? 's' : ''}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {tool.agentsUnlocked.map(agent => (
                          <span
                            key={agent}
                            className="px-2 py-0.5 text-xs rounded capitalize bg-[#1E1E1E] text-[#999]"
                          >
                            {agent}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Connect Button */}
                <div className="pt-1 flex items-center gap-1 text-xs" style={{ color: accentColor }}>
                  <Plus size={12} />
                  Connect
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Next Suggestion */}
      {nextSuggestion && (
        <div className="p-3 rounded border-l-4" style={{ borderLeftColor: '#F59E0B', backgroundColor: '#F59E0B10' }}>
          <div className="text-xs font-semibold text-[#F59E0B] mb-2 flex items-center gap-1">
            <Zap size={12} />
            Next Unlock
          </div>
          <div className="text-xs text-white font-medium mb-1">{nextSuggestion.name}</div>
          <div className="text-xs text-[#999] mb-2">{nextSuggestion.description}</div>
          <button
            onClick={() => onConnectTool?.(nextSuggestion.id)}
            className="w-full px-2 py-1.5 text-xs rounded font-medium"
            style={{
              backgroundColor: '#F59E0B',
              color: '#000',
            }}
          >
            Connect Now
          </button>
        </div>
      )}

      {/* All Connected Badge */}
      {availableTools.length === 0 && connectedToolsData.length > 0 && (
        <div className="p-3 rounded text-center space-y-2">
          <Lock size={20} className="mx-auto" style={{ color: accentColor }} />
          <div className="text-sm font-semibold text-white">All Tools Connected! 🎉</div>
          <div className="text-xs text-[#666]">Department is fully optimized</div>
        </div>
      )}
    </div>
  )
}
