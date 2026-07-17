import Link from 'next/link'
import { DEPARTMENT_METADATA, type DepartmentInfo } from '@/lib/department-meta'

type CurrentDept = 'marketing' | 'comercial' | 'strategy' | 'operations' | 'finanzas'

interface OtherTeamsFooterProps {
  currentDept: CurrentDept
}

export default function OtherTeamsFooter({ currentDept }: OtherTeamsFooterProps) {
  // Filter out current department, get remaining 5
  const otherDepts = Object.values(DEPARTMENT_METADATA)
    .filter((dept) => dept.id !== currentDept)
    .slice(0, 5)

  // Calculate total agents (sum of all counts except current)
  const totalAgents = Object.values(DEPARTMENT_METADATA).reduce((acc, dept) => {
    if (dept.id !== currentDept) return acc + dept.count
    return acc
  }, 0)

  return (
    <div className="mt-10">
      <p className="text-[11px] uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
        Other available teams — <span className="text-white normal-case">{totalAgents} agents total</span>
      </p>
      <div className="grid grid-cols-5 gap-3">
        {otherDepts.map((dept) => (
          <Link
            key={dept.href}
            href={dept.href}
            className="card px-4 py-3 transition-all group hover:scale-[1.02]"
            style={{
              borderColor: 'rgba(255,255,255,0.09)',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.borderColor = `${dept.color}40`
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.09)'
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{dept.icon}</span>
              <p className="text-xs text-white font-medium">{dept.name}</p>
            </div>
            <p className="text-[10px] text-[#555] mt-0.5">{dept.description}</p>
            <p className="text-[10px] mt-1.5 font-medium" style={{ color: `${dept.color}90` }}>
              {dept.count} agents · Active →
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
