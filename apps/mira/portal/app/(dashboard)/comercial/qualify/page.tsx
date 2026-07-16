'use client'
import { useEffect, useState } from 'react'
import { Loader2, Send, Copy, Check, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Lead } from '@/lib/types'
import { useActiveClient } from '@/lib/client-context'
import { CLIENT_ID } from '@/lib/constants'
import { clsx } from 'clsx'

const CLASS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  interested:     { label: 'Interesado',       color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  not_now:        { label: 'No ahora',          color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  not_interested: { label: 'No interesado',     color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  referral:       { label: 'Deriva a otro',     color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
}

export default function QualifyPage() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id ?? CLIENT_ID

  const [leads, setLeads]           = useState<Lead[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [replyText, setReplyText]   = useState('')
  const [output, setOutput]         = useState('')
  const [analyzing, setAnalyzing]   = useState(false)
  const [copied, setCopied]         = useState(false)
  const [loadingLeads, setLoadingLeads] = useState(true)

  useEffect(() => {
    createClient()
      .from('leads')
      .select('id,company_name,first_name,last_name,title,hot_score,stage')
      .eq('client_id', clientId)
      .not('stage', 'in', '("won","lost","prospected")')
      .order('hot_score', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setLeads(data as Lead[])
        setLoadingLeads(false)
      })
  }, [clientId])

  // Extract parsed fields from streamed JSON
  const parsed = (() => {
    if (!output) return null
    try {
      const cleaned = output.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
      return JSON.parse(cleaned)
    } catch { return null }
  })()

  const isJson = output.trim().startsWith('{')

  async function analyze() {
    if (!replyText.trim() || analyzing) return
    setAnalyzing(true)
    setOutput('')

    try {
      const res = await fetch('/api/comercial/qualify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: selectedId || null, replyText }),
      })
      if (!res.body) throw new Error('no stream')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setOutput(full)
      }
    } catch {
      setOutput('Error al analizar. Inténtalo de nuevo.')
    } finally {
      setAnalyzing(false)
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const cls = parsed?.classification ? CLASS_LABEL[parsed.classification] : null

  return (
    <div className="px-8 py-8 max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">💬</span>
          <h1 className="text-2xl font-semibold text-white">Quinn — Qualify</h1>
        </div>
        <p className="text-[#555] text-sm">Analiza respuestas de outreach con BANT y genera el follow-up perfecto.</p>
      </div>

      {/* Lead selector */}
      <div className="card p-5 mb-4">
        <label className="block text-[11px] text-[#555] uppercase tracking-wider mb-2">
          Lead (opcional — enriquece el análisis)
        </label>
        {loadingLeads ? (
          <div className="flex items-center gap-2 text-[#444] text-sm">
            <Loader2 size={12} className="animate-spin" /> Cargando leads...
          </div>
        ) : (
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none appearance-none">
            <option value="">— Sin lead específico —</option>
            {leads.map(l => (
              <option key={l.id} value={l.id}>
                {l.company_name ?? 'Sin empresa'} — {[l.first_name, l.last_name].filter(Boolean).join(' ') || 'Sin nombre'}
                {l.title ? ` (${l.title})` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Reply input */}
      <div className="card p-5 mb-4">
        <label className="block text-[11px] text-[#555] uppercase tracking-wider mb-2">
          Respuesta recibida <span className="text-[#EF4444]">*</span>
        </label>
        <textarea
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
          placeholder="Pega aquí el mensaje que recibiste del prospect..."
          rows={5}
          className="w-full bg-transparent text-sm text-white placeholder-[#333] outline-none resize-none leading-relaxed"
        />
      </div>

      <button onClick={analyze} disabled={!replyText.trim() || analyzing}
        className={clsx(
          'w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all mb-6',
          replyText.trim() && !analyzing
            ? 'bg-[#22C55E]/15 text-[#4ade80] hover:bg-[#22C55E]/25 border border-[#22C55E]/25'
            : 'bg-[#111] text-[#444] border border-[#1a1a1a] cursor-not-allowed'
        )}>
        {analyzing
          ? <><Loader2 size={15} className="animate-spin" /> Quinn analizando...</>
          : <><Send size={15} /> Analizar con Quinn</>}
      </button>

      {/* Output */}
      {output && (
        <div className="space-y-3">
          {parsed && cls ? (
            <>
              {/* Classification + BANT */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-lg text-sm font-semibold"
                      style={{ background: cls.bg, color: cls.color, border: `1px solid ${cls.color}25` }}>
                      {cls.label}
                    </div>
                    {parsed.bant_score !== undefined && (
                      <div className="px-2.5 py-1 rounded-lg text-[11px] text-[#666] bg-[#111] border border-[#1a1a1a]">
                        BANT {parsed.bant_score}/4
                      </div>
                    )}
                  </div>
                  <MessageSquare size={14} className="text-[#333]" />
                </div>

                {/* BANT breakdown */}
                {parsed.bant_budget && (
                  <div className="grid grid-cols-4 gap-2">
                    {(['budget', 'authority', 'need', 'timeline'] as const).map(k => {
                      const val = parsed[`bant_${k}`]
                      return (
                        <div key={k} className="text-center">
                          <p className="text-[9px] uppercase tracking-wider text-[#444] mb-1">{k}</p>
                          <div className={clsx(
                            'text-[11px] font-semibold px-2 py-1 rounded',
                            val === 'yes' ? 'text-green-400 bg-green-400/10' : val === 'no' ? 'text-red-400 bg-red-400/10' : 'text-[#555] bg-[#111]'
                          )}>
                            {val === 'yes' ? '✓' : val === 'no' ? '✗' : '?'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Next move */}
              {parsed.next_move && (
                <div className="card p-4">
                  <p className="text-[10px] text-[#444] uppercase tracking-wider mb-2">Siguiente movimiento</p>
                  <p className="text-sm text-white">{parsed.next_move}</p>
                </div>
              )}

              {/* Suggested reply */}
              {parsed.suggested_reply && (
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-[#444] uppercase tracking-wider">Mensaje sugerido</p>
                    <button onClick={() => copy(parsed.suggested_reply)}
                      className="flex items-center gap-1 text-[10px] text-[#555] hover:text-white transition-all">
                      {copied ? <><Check size={10} className="text-green-400" /> Copiado</> : <><Copy size={10} /> Copiar</>}
                    </button>
                  </div>
                  <p className="text-sm text-[#ddd] leading-relaxed bg-[#0A0A0A] rounded-lg p-3 border border-[#141414]">
                    {parsed.suggested_reply}
                  </p>
                </div>
              )}

              {/* Buying signals */}
              {parsed.buying_signals?.length > 0 && (
                <div className="card p-4">
                  <p className="text-[10px] text-[#444] uppercase tracking-wider mb-2">Señales de compra detectadas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(parsed.buying_signals as string[]).map(s => (
                      <span key={s} className="text-[11px] px-2 py-1 rounded-full bg-green-400/8 text-green-400 border border-green-400/15">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card p-5">
              <pre className="text-sm text-[#ddd] leading-relaxed whitespace-pre-wrap font-sans">{output}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
