'use client'
import { useEffect, useState, useCallback } from 'react'
import { Loader2, RefreshCw, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Lead } from '@/lib/types'
import { useActiveClient } from '@/lib/client-context'
import { HOT_SCORE_THRESHOLD, WARM_SCORE_THRESHOLD } from '@/lib/constants'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import { scoreLabel } from '@/lib/score-utils'
import { clsx } from 'clsx'

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>—</span>
  const { emoji, color } = scoreLabel(score)
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: `${color}20`, color }}>
      {emoji} {score}
    </span>
  )
}

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-sm font-semibold text-ink w-8 text-right">{value}</span>
    </div>
  )
}

interface ChatMessage { role: 'user' | 'vera'; content: string }

export default function ScoringPage() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id
  const { locale } = useLocaleContext()

  const [allLeads, setAllLeads] = useState<Lead[]>([])
  const [topLeads, setTopLeads] = useState<Lead[]>([])
  const [loading, setLoading]   = useState(true)
  const [rescoring, setRescoring] = useState<string | null>(null)

  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatLoading, setChatLoading]   = useState(false)

  const fetchLeads = useCallback(() => {
    const db = createClient()
    const cols = 'id,company_name,title,industry,geography,hot_score'
    Promise.all([
      db.from('leads').select(cols).eq('client_id', clientId),
      db.from('leads').select(cols).eq('client_id', clientId).order('hot_score', { ascending: false }).limit(10),
    ]).then(([{ data: all }, { data: top }]) => {
      if (all) setAllLeads(all as Lead[])
      if (top) setTopLeads(top as Lead[])
      setLoading(false)
    })
  }, [clientId])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  async function rescoreLead(lead: Lead) {
    setRescoring(lead.id)
    try {
      const res = await fetch('/api/comercial/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, clientId }),
      })
      const data = await res.json()
      if (data.score !== undefined) {
        setTopLeads(prev => prev.map(l => l.id === lead.id ? { ...l, hot_score: data.score } : l))
        setAllLeads(prev => prev.map(l => l.id === lead.id ? { ...l, hot_score: data.score } : l))
      }
    } finally {
      setRescoring(null)
    }
  }

  async function sendChat() {
    const msg = chatInput.trim()
    if (!msg || chatLoading) return
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: msg }])
    setChatLoading(true)

    const context = `Tengo ${allLeads.length} leads. Hot: ${hot.length}, Warm: ${warm.length}, Cold: ${cold.length}. Top lead: ${topLeads[0]?.company_name ?? 'ninguno'} (score ${topLeads[0]?.hot_score ?? '—'}).`
    const fullMessage = `${context}\n\nPregunta del equipo: ${msg}`

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'icp-scorer', message: fullMessage, includeBrandBrain: true, locale }),
      })
      if (!res.body) throw new Error('no stream')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let veraReply = ''
      setChatMessages(prev => [...prev, { role: 'vera', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        veraReply += decoder.decode(value, { stream: true })
        setChatMessages(prev => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'vera', content: veraReply }
          return copy
        })
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'vera', content: 'Error al conectar con Vera.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const hot  = allLeads.filter(l => (l.hot_score ?? 0) >= HOT_SCORE_THRESHOLD)
  const warm = allLeads.filter(l => (l.hot_score ?? 0) >= WARM_SCORE_THRESHOLD && (l.hot_score ?? 0) < HOT_SCORE_THRESHOLD)
  const cold = allLeads.filter(l => (l.hot_score ?? 0) < WARM_SCORE_THRESHOLD)
  const total = allLeads.length
  const hotPct  = total > 0 ? Math.round((hot.length  / total) * 100) : 0
  const warmPct = total > 0 ? Math.round((warm.length / total) * 100) : 0
  const coldPct = total > 0 ? Math.round((cold.length / total) * 100) : 0

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
    </div>
  )

  return (
    <div className="px-8 py-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🎯</span>
            <h1 className="text-2xl font-semibold text-ink">Vera — Score Distribution</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('comercial.scoring.distribution-desc', locale)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {/* LEFT — Stats + Table */}
        <div className="col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total',        value: total,       color: 'var(--text-secondary)' },
              { label: 'Hot (≥75)',    value: hot.length,  color: '#EF4444' },
              { label: 'Warm (50-74)', value: warm.length, color: '#F59E0B' },
              { label: 'Cold (<50)',   value: cold.length, color: '#3B82F6' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card px-4 py-3">
                <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
                <p className="text-2xl font-semibold" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Distribution */}
          <div className="card p-6">
            <h2 className="text-sm font-medium text-ink mb-5">{t('comercial.scoring.distribution', locale)}</h2>
            <div className="space-y-4">
              {[
                { label: '🔥 Hot (≥75)', value: hot.length, pct: hotPct, color: '#EF4444' },
                { label: '🟡 Warm (50-74)', value: warm.length, pct: warmPct, color: '#F59E0B' },
                { label: '🔵 Cold (<50)', value: cold.length, pct: coldPct, color: '#3B82F6' },
              ].map(({ label, value, pct, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-[11px] mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <span>{label}</span><span>{pct}%</span>
                  </div>
                  <ScoreBar value={value} max={total} color={color} />
                </div>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4" style={{ borderBottomColor: 'var(--border-subtle)', borderBottomWidth: '1px' }}>
              <h2 className="text-sm font-medium text-ink">Top {topLeads.length} por score</h2>
            </div>
            {topLeads.length === 0 ? (
              <div className="py-12 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                No hay leads aún. Usa Rex para descubrir leads.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottomColor: 'var(--border-subtle)', borderBottomWidth: '1px' }}>
                    {['Empresa', 'Cargo', 'Industria', 'Score', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topLeads.map(lead => (
                    <tr key={lead.id} className="hover:bg-surface transition-colors group" style={{ borderBottomColor: 'var(--bg-page)', borderBottomWidth: '1px' }}>
                      <td className="px-5 py-3 text-sm text-ink font-medium">{lead.company_name ?? '—'}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{lead.title ?? '—'}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{lead.industry ?? '—'}</td>
                      <td className="px-5 py-3"><ScoreBadge score={lead.hot_score} /></td>
                      <td className="px-5 py-3">
                        <button onClick={() => rescoreLead(lead)} disabled={rescoring === lead.id}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] hover:text-ink transition-all" style={{ color: 'var(--text-tertiary)' }}>
                          {rescoring === lead.id
                            ? <Loader2 size={10} className="animate-spin" />
                            : <RefreshCw size={10} />}
                          Re-score
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT — Vera chat */}
        <div className="flex flex-col">
          <div className="card flex flex-col h-[600px]">
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottomColor: 'var(--border-subtle)', borderBottomWidth: '1px' }}>
              <span className="text-base">🎯</span>
              <div>
                <p className="text-[12px] font-semibold text-ink">Vera</p>
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{t('comercial.scoring.scorer-live', locale)}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {chatMessages.length === 0 && (
                <div className="text-center pt-8">
                  <p className="text-[11px] mb-4" style={{ color: 'var(--text-tertiary)' }}>Pregúntame sobre el pipeline</p>
                  {['¿Cuáles son nuestros leads más prometedores?', '¿Qué industrias tienen mejor score?', '¿Cómo mejorar la calidad del pipeline?'].map(q => (
                    <button key={q} onClick={() => { setChatInput(q); }}
                      className="block w-full text-left px-3 py-2 mb-1.5 rounded-lg text-[11px] hover:text-ink hover:bg-surface-hover transition-all" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)', borderWidth: '1px' }}>
                      {q}
                    </button>
                  ))}
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={clsx(
                    'max-w-[90%] px-3 py-2 rounded-xl text-[12px] leading-relaxed',
                    msg.role === 'user'
                      ? 'text-ink'
                      : 'text-ink'
                  )}>
                    {msg.content || <Loader2 size={10} className="animate-spin text-ink-muted" />}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="px-3 py-3" style={{ borderTopColor: 'var(--border-subtle)', borderTopWidth: '1px' }}>
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                  placeholder="Pregunta a Vera..."
                  className="flex-1 rounded-lg px-3 py-2 text-[12px] text-ink focus:outline-none transition-colors" style={{ background: 'var(--bg-page)', borderColor: 'var(--border-subtle)', borderWidth: '1px', color: 'var(--text-primary)' }}
                />
                <button onClick={sendChat} disabled={!chatInput.trim() || chatLoading}
                  className="p-2 rounded-lg bg-[#EF4444]/15 text-[#f87171] hover:bg-[#EF4444]/25 disabled:opacity-30 transition-all">
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
