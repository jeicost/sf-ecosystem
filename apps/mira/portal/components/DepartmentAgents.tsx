'use client'

import { ALL_AGENTS } from '@/lib/agents'

export default function DepartmentAgents() {

  // Note: Agent schema doesn't have package field, showing first 4 agents for all departments
  const agents = ALL_AGENTS.slice(0, 4)

  if (agents.length === 0) return null

  return (
    <div className="mt-12">
      <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
        Mi Equipo
      </p>
      <div className="grid grid-cols-2 gap-3">
        {agents.map(agent => (
          <div key={agent.name} className="card px-4 py-3 hover:bg-white/8 transition-all">
            <p className="text-xs font-medium text-white">{agent.name}</p>
            <p className="text-[10px] text-[#666] mt-1">{agent.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
