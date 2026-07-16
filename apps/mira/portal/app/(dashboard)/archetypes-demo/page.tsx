'use client'
import { useState } from 'react'
import AgentArchetypeWrapper from '@/components/archetypes/AgentArchetypeWrapper'
import ToolsPanel from '@/components/archetypes/ToolsPanel'
import { type ToolType } from '@/lib/department-tools'

const DEMO_AGENTS = [
  {
    id: 'alex',
    name: 'Alex',
    archetype: 'ORACLE',
    color: '#EC4899',
    emoji: '✨',
    description: 'Copywriter — generates content variants',
  },
  {
    id: 'vera',
    name: 'Vera',
    archetype: 'ANALYST',
    color: '#8B5CF6',
    emoji: '📊',
    description: 'Lead scorer — evaluates and ranks leads',
  },
  {
    id: 'rex',
    name: 'Rex',
    archetype: 'EXPLORER',
    color: '#06B6D4',
    emoji: '🔍',
    description: 'Lead scout — discovers new opportunities',
  },
  {
    id: 'marco',
    name: 'Marco',
    archetype: 'ARCHITECT',
    color: '#F59E0B',
    emoji: '🎯',
    description: 'Strategist — builds plans step-by-step',
  },
  {
    id: 'pulse',
    name: 'Pulse',
    archetype: 'SENTINEL',
    color: '#10B981',
    emoji: '📡',
    description: 'Monitor — tracks alerts and metrics',
  },
  {
    id: 'zoe',
    name: 'Zoe',
    archetype: 'STUDIO',
    color: '#EC4899',
    emoji: '🎨',
    description: 'Designer — creates visual content',
  },
]

export default function ArchetypesDemoPage() {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('alex')
  const [connectedTools, setConnectedTools] = useState<ToolType[]>(['canva'])
  const selectedAgent = DEMO_AGENTS.find(a => a.id === selectedAgentId)

  const handleConnectTool = (toolId: ToolType) => {
    setConnectedTools(prev => [...prev, toolId])
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Agent Archetype System</h1>
        <p className="text-[#999]">
          5 interactive workflow patterns powering all 30 agents. Each archetype provides a tailored interface
          optimized for different types of agent work.
        </p>
      </div>

      {/* Agent Selector */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#666]">
          Select Agent to Preview
        </div>
        <div className="grid grid-cols-5 gap-2">
          {DEMO_AGENTS.map(agent => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              className={`card p-4 text-left transition-all border ${
                selectedAgentId === agent.id
                  ? 'border-[#1E1E1E] bg-[#1E1E1E]'
                  : 'border-transparent hover:bg-[#0D0D0D]'
              }`}
            >
              <div className="text-2xl mb-2">{agent.emoji}</div>
              <div className="font-semibold text-sm text-white">{agent.name}</div>
              <div className="text-xs text-[#666] mt-1">{agent.archetype}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Agent Info */}
      {selectedAgent && (
        <div className="card p-6 border-l-4" style={{ borderLeftColor: selectedAgent.color }}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{selectedAgent.emoji}</span>
            <div>
              <h2 className="text-xl font-bold text-white">{selectedAgent.name}</h2>
              <p className="text-sm text-[#999]">{selectedAgent.description}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#1E1E1E]">
            <div className="inline-block px-3 py-1 rounded text-xs font-medium text-white" style={{ backgroundColor: `${selectedAgent.color}30` }}>
              {selectedAgent.archetype} Archetype
            </div>
          </div>
        </div>
      )}

      {/* Archetype Preview */}
      {selectedAgent && (
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: selectedAgent.color }}>
            🎬 Live Preview
          </div>
          <div className="flex gap-0">
            <div className="flex-1 card p-6 rounded-r-none">
              <AgentArchetypeWrapper
                agentId={selectedAgent.id}
                agentName={selectedAgent.name}
                agentColor={selectedAgent.color}
                agentEmoji={selectedAgent.emoji}
                connectedTools={connectedTools}
              />
            </div>
            {/* Tools Panel Sidebar */}
            {selectedAgent.archetype === 'STUDIO' && (
              <ToolsPanel
                department="marketing"
                connectedTools={connectedTools}
                accentColor={selectedAgent.color}
                onConnectTool={handleConnectTool}
                departmentAgents={[selectedAgent.id]}
              />
            )}
          </div>
        </div>
      )}

      {/* System Overview */}
      <div className="space-y-4 border-t border-[#1E1E1E] pt-8">
        <h2 className="text-lg font-bold text-white">System Architecture</h2>

        <div className="grid grid-cols-6 gap-3">
          {DEMO_AGENTS.map(agent => (
            <div key={agent.id} className="card p-4 text-center">
              <div className="text-2xl mb-2">{agent.emoji}</div>
              <div className="font-semibold text-sm text-white">{agent.name}</div>
              <div className="text-xs text-[#666] mt-2">{agent.archetype}</div>
              <div className="text-xs text-[#555] mt-2 leading-tight">
                {agent.archetype === 'ORACLE' && 'Carousel\nVariants'}
                {agent.archetype === 'ANALYST' && 'Dashboard\nResults'}
                {agent.archetype === 'EXPLORER' && 'Filter\nDiscovery'}
                {agent.archetype === 'ARCHITECT' && 'Step\nBuilder'}
                {agent.archetype === 'SENTINEL' && 'Alert\nFeed'}
                {agent.archetype === 'STUDIO' && 'Canvas\nProjects'}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded bg-[#0D0D0D] border border-[#1E1E1E]">
            <h3 className="font-semibold text-white mb-2 text-sm">Coverage</h3>
            <ul className="text-xs text-[#999] space-y-1">
              <li>✓ 30+ agents mapped to 6 archetypes</li>
              <li>✓ Per-agent customizations via ARCHETYPE_CUSTOMIZATIONS</li>
              <li>✓ AgentArchetypeWrapper routes automatically</li>
              <li>✓ Color theming + props passthrough</li>
              <li>✓ Tools panel for gamification + unlock progression</li>
            </ul>
          </div>

          <div className="p-4 rounded bg-[#0D0D0D] border border-[#1E1E1E]">
            <h3 className="font-semibold text-white mb-2 text-sm">Next Steps</h3>
            <ul className="text-xs text-[#999] space-y-1">
              <li>→ Integrate into /agent/[role] page</li>
              <li>→ Create agent_configs table schema</li>
              <li>→ Build POST /api/setup endpoint</li>
              <li>→ Test with real agent data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
