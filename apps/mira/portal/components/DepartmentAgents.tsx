'use client'

import Link from 'next/link'
import {
  COMERCIAL_DEPT_AGENTS,
  MARKETING_DEPT_AGENTS,
  ESTRATEGIA_DEPT_AGENTS,
  OPERACIONES_DEPT_AGENTS,
  INNOVACION_DEPT_AGENTS,
  FINANZAS_DEPT_AGENTS,
} from '@/lib/agent-meta'

const DEPT_AGENTS = {
  comercial: COMERCIAL_DEPT_AGENTS,
  marketing: MARKETING_DEPT_AGENTS,
  estrategia: ESTRATEGIA_DEPT_AGENTS,
  operaciones: OPERACIONES_DEPT_AGENTS,
  innovacion: INNOVACION_DEPT_AGENTS,
  finanzas: FINANZAS_DEPT_AGENTS,
}

interface DepartmentAgentsProps {
  department?: 'comercial' | 'marketing' | 'estrategia' | 'operaciones' | 'innovacion' | 'finanzas'
}

export default function DepartmentAgents({ department = 'comercial' }: DepartmentAgentsProps) {
  const agents = DEPT_AGENTS[department]

  if (agents.length === 0) return null

  return (
    <div className="mt-12">
      <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
        Mi Equipo
      </p>
      <div className="grid grid-cols-2 gap-3">
        {agents.map(agent => (
          <Link key={agent.id} href={`/agent/${agent.id}`} className="card px-4 py-3 hover:bg-white/8 transition-all cursor-pointer">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-lg">{agent.emoji}</span>
              <div>
                <p className="text-xs font-medium text-white">{agent.name}</p>
                <p className="text-[10px]" style={{ color: agent.color }}>Hablar →</p>
              </div>
            </div>
            <p className="text-[10px] text-[#666]">{agent.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
