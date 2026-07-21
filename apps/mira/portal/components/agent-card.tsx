'use client'
import Link from 'next/link'
import type { AgentMetadata, AgentStatus } from '@/lib/agent-meta'

interface AgentCardProps {
  agent: AgentMetadata
  status?: AgentStatus
  lastTask?: string | null
  step?: number
  produces?: string
  href?: string
}

const STATUS_CONFIG: Record<AgentStatus, { dot: string; label: string; animate: boolean }> = {
  idle:       { dot: '#6b7280',               label: 'Ready',      animate: false },
  active:     { dot: '#10b981',               label: 'Active',     animate: true  },
  pending:    { dot: '#f59e0b',               label: 'Pending',    animate: true  },
  processing: { dot: '#3b82f6',               label: 'Processing', animate: true  },
  complete:   { dot: '#10b981',               label: 'Done',       animate: false },
  inactive:   { dot: '#374151',               label: 'Inactive',   animate: false },
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
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = `${c}40`
        el.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${c}20`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'var(--border)'
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
            <h3 className="font-semibold text-ink text-[15px] leading-tight">{agent.name}</h3>
            <p className="text-[11px] mt-0.5 font-medium" style={{ color: c }}>{agent.description}</p>
          </div>
        </div>

        {/* Tagline */}
        <p
          className="text-[11px] leading-relaxed italic flex-1 mb-4 text-ink-tertiary"
        >
          &ldquo;{agent.description}&rdquo;
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
              className="text-[9px] uppercase tracking-widest font-semibold text-ink-muted"
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
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          {lastTask ? (
            <span
              className="text-[10px] truncate max-w-[60%] text-ink-muted"
            >
              {lastTask}
            </span>
          ) : (
            <span className="text-[10px] text-ink-muted">
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
