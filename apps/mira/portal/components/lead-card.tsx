'use client'
import { useState } from 'react'
import { ChevronRight, Copy, Check } from 'lucide-react'
import type { Lead, LeadStage } from '@/lib/types'
import { scoreLabel } from '@/lib/score-utils'
import { clsx } from 'clsx'

const STAGE_ORDER: LeadStage[] = [
  'prospected', 'contacted', 'replied', 'qualified',
  'proposal', 'negotiation', 'won', 'lost',
]

interface LeadCardProps {
  lead: Lead
  onStageChange?: (id: string, stage: LeadStage) => void
  onClick?: (lead: Lead) => void
}

export default function LeadCard({ lead, onStageChange, onClick }: LeadCardProps) {
  const score = scoreLabel(lead.hot_score)
  const displayName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'No name'
  const [advancing, setAdvancing] = useState(false)
  const [copied, setCopied] = useState(false)

  const currentIdx = STAGE_ORDER.indexOf(lead.stage)
  const nextStage = currentIdx < STAGE_ORDER.length - 1 ? STAGE_ORDER[currentIdx + 1] : null

  async function advanceStage(e: React.MouseEvent) {
    e.stopPropagation()
    if (!nextStage || !onStageChange || advancing) return
    setAdvancing(true)
    try {
      await fetch(`/api/comercial/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: nextStage }),
      })
      onStageChange(lead.id, nextStage)
    } finally {
      setAdvancing(false)
    }
  }

  async function copyIcebreaker(e: React.MouseEvent) {
    e.stopPropagation()
    if (!lead.icebreaker_used) return
    await navigator.clipboard.writeText(lead.icebreaker_used)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div
      onClick={() => onClick?.(lead)}
      className={clsx(
        'card p-3 transition-all cursor-pointer group',
        onClick && 'hover:border-line',
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-ink font-medium truncate">{lead.company_name ?? '—'}</p>
          <p className="text-[11px] text-ink-muted truncate mt-0.5">{displayName}</p>
        </div>
        <div
          className="ml-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0"
          style={{ background: `${score.color}20`, color: score.color }}
        >
          <span>{score.emoji}</span>
          {lead.hot_score !== null && <span>{lead.hot_score}</span>}
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {lead.title && (
          <span className="text-[10px] text-ink-muted bg-surface px-1.5 py-0.5 rounded truncate max-w-full">
            {lead.title}
          </span>
        )}
        {lead.industry && (
          <span className="text-[10px] text-ink-muted bg-surface px-1.5 py-0.5 rounded truncate">
            {lead.industry}
          </span>
        )}
        {lead.geography && (
          <span className="text-[10px] text-ink-muted px-1 py-0.5 rounded">
            📍 {lead.geography}
          </span>
        )}
      </div>

      {lead.trigger_event && (
        <p className="text-[10px] text-ink-muted mt-2 line-clamp-1 italic">
          {lead.trigger_event}
        </p>
      )}

      {/* Actions row */}
      {(nextStage || lead.icebreaker_used) && (
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-line-subtle opacity-0 group-hover:opacity-100 transition-opacity">
          {lead.icebreaker_used && (
            <button
              onClick={copyIcebreaker}
              title="Copy icebreaker"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] text-ink-muted hover:text-ink hover:bg-surface-hover transition-all"
            >
              {copied ? <Check size={9} className="text-green-400" /> : <Copy size={9} />}
              {copied ? 'Copied' : 'Icebreaker'}
            </button>
          )}
          {nextStage && onStageChange && (
            <button
              onClick={advanceStage}
              disabled={advancing}
              title={`Move to ${nextStage}`}
              className="ml-auto flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] text-ink-muted hover:text-ink hover:bg-surface-hover transition-all"
            >
              {advancing ? '...' : <><ChevronRight size={9} /><span className="capitalize">{nextStage}</span></>}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
