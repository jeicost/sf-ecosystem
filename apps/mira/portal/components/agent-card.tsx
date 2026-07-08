'use client'
import Link from 'next/link'
import type { Agent, AgentStatus } from '@/lib/agents'

interface AgentCardProps {
  agent: Agent
  status?: AgentStatus
  lastTask?: string | null
  step?: number
  produces?: string
  href?: string
}

const STATUS_CONFIG: Record<AgentStatus, { dot: string; label: string; animate: boolean }> = {
  idle:      { dot: 'rgba(255,255,255,0.2)', label: 'Ready',   animate: false },
  working:   { dot: '#4ade80',              label: 'Working',  animate: true  },
  waiting:   { dot: '#fbbf24',              label: 'Pending',  animate: true  },
  completed: { dot: '#60a5fa',              label: 'Done',     animate: false },
}

export default function AgentCard({
  agent,
  status = 'idle',
  lastTask,
  step,
  produces,
  href,
}: AgentCardProps) {
  const c = agent.color
  const s = STATUS_CONFIG[status]

  return (
    <Link
      href={href ?? `/agent/${agent.id}`}
      className="group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.01]"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = `${c}40`
        el.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${c}20`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'rgba(255,255,255,0.09)'
        el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.2)'
      }}
    >
      {/* Top color line */}
      <div
        className="h-px w-full transition-opacity duration-300 opacity-50 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent 5%, ${c}cc 50%, transparent 95%)` }}
      />

      <div className="p-5 flex flex-col flex-1">

        {/* Row 1: step + status */}
        <div className="flex items-center justify-between mb-4">
          {step !== undefined ? (
            <span
              className="text-[10px] font-bold font-mono tracking-wider"
              style={{ color: `${c}80` }}
            >
              {String(step).padStart(2, '0')}
            </span>
          ) : <span />}

          <div className="flex items-center gap-1.5">
            <div
              className={`w-1.5 h-1.5 rounded-full ${s.animate ? 'animate-pulse' : ''}`}
              style={{ background: s.dot }}
            />
            <span className="text-[9px] font-medium" style={{ color: s.dot }}>
              {s.label}
            </span>
          </div>
        </div>

        {/* Avatar + name */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform duration-200 group-hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${c}30, ${c}10)`,
              border: `1px solid ${c}30`,
              boxShadow: `0 4px 16px ${c}15`,
            }}
          >
            {agent.emoji}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-[15px] leading-tight">{agent.name}</h3>
            <p className="text-[11px] mt-0.5 font-medium" style={{ color: c }}>{agent.role}</p>
          </div>
        </div>

        {/* Tagline */}
        <p
          className="text-[11px] leading-relaxed italic flex-1 mb-4"
          style={{ color: 'rgba(255,255,255,0.38)' }}
        >
          &ldquo;{agent.tagline}&rdquo;
        </p>

        {/* Produces chip */}
        {produces && (
          <div
            className="flex items-center justify-between px-3 py-2 rounded-lg mb-3"
            style={{
              background: `${c}0d`,
              border: `1px solid ${c}22`,
            }}
          >
            <span
              className="text-[9px] uppercase tracking-widest font-semibold"
              style={{ color: 'rgba(255,255,255,0.28)' }}
            >
              Produces
            </span>
            <span
              className="text-[10px] font-semibold"
              style={{ color: c }}
            >
              {produces} →
            </span>
          </div>
        )}

        {/* Bottom: last task + CTA */}
        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          {lastTask ? (
            <span
              className="text-[10px] truncate max-w-[60%]"
              style={{ color: 'rgba(255,255,255,0.28)' }}
            >
              {lastTask}
            </span>
          ) : (
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Ready to start
            </span>
          )}
          <span
            className="text-[11px] font-semibold transition-opacity duration-150 opacity-50 group-hover:opacity-100"
            style={{ color: c }}
          >
            Talk →
          </span>
        </div>
      </div>
    </Link>
  )
}
