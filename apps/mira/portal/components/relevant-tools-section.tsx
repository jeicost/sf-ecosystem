import Link from 'next/link'
import { getToolsForDepartment } from '@/lib/toolkit-tools'

interface RelevantToolsSectionProps {
  department: string
  limit?: number
}

export default function RelevantToolsSection({ department, limit = 3 }: RelevantToolsSectionProps) {
  const tools = getToolsForDepartment(department, limit)

  if (tools.length === 0) return null

  return (
    <div className="mt-8 pt-8 border-t border-[#1a1a1a]">
      <p className="text-[11px] uppercase tracking-widest font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
        Relevant Toolkit Tools
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            href={tool.href}
            className="card px-4 py-3 transition-all hover:scale-[1.02] group"
            style={{
              borderColor: 'rgba(255,255,255,0.08)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${tool.color}40` }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{tool.icon}</span>
              <p className="text-xs font-medium text-white group-hover:text-white transition-colors">{tool.name}</p>
            </div>
            <p className="text-[10px] text-[#666] mb-2">{tool.description.substring(0, 60)}...</p>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-[#555]">{tool.time}</span>
              <span className="text-[10px] font-medium group-hover:translate-x-1 transition-transform" style={{ color: tool.color }}>
                Open →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
