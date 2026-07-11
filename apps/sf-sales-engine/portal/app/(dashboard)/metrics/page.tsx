'use client'
import { useEffect, useState } from 'react'
import { type Lead } from '@/lib/supabase'

export default function MetricsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/leads')
      const data = await res.json()
      setLeads(Array.isArray(data) ? data : [])
      setLoading(false)
    }
    load()
  }, [])

  const byStage = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.stage] = (acc[l.stage] ?? 0) + 1
    return acc
  }, {})

  const bySector = leads.reduce<Record<string, number>>((acc, l) => {
    const sector = l.industry?.split('/')[0].trim() ?? 'Desconocido'
    acc[sector] = (acc[sector] ?? 0) + 1
    return acc
  }, {})

  const topSectors = Object.entries(bySector).sort((a, b) => b[1] - a[1]).slice(0, 6)

  const avgScore = leads.length
    ? Math.round(leads.reduce((s, l) => s + (l.hot_score ?? 0), 0) / leads.length)
    : 0

  const STAGES = ['prospected','contacted','replied','qualified','proposal','won','lost']
  const STAGE_LABELS: Record<string,string> = {
    prospected:'Prospectado', contacted:'Contactado', replied:'Respondió',
    qualified:'Calificado', proposal:'Propuesta', won:'Cerrado', lost:'Perdido'
  }

  return (
    <div className="px-8 py-7">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Métricas</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-dim)' }}>
          Resumen del pipeline · SF interno · Venture Builders España
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total leads', value: leads.length, color: 'var(--text)' },
          { label: 'Score medio', value: avgScore, color: 'var(--accent)' },
          { label: 'Hot (≥75)', value: leads.filter(l => (l.hot_score ?? 0) >= 75).length, color: 'var(--red)' },
          { label: 'Contactados', value: leads.filter(l => l.stage !== 'prospected').length, color: 'var(--green)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card px-5 py-4">
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-dim)' }}>{label}</p>
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Pipeline funnel */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Pipeline por etapa</h2>
          <div className="space-y-3">
            {STAGES.filter(s => byStage[s]).map(stage => {
              const count = byStage[stage] ?? 0
              const pct = Math.round((count / leads.length) * 100)
              return (
                <div key={stage}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: 'var(--text-dim)' }}>{STAGE_LABELS[stage]}</span>
                    <span className="font-medium text-white">{count}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--border)' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: 3,
                      background: stage === 'won' ? 'var(--green)' : stage === 'lost' ? 'var(--red)' : 'var(--accent)',
                      transition: 'width 0.5s'
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top sectores */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Top sectores</h2>
          <div className="space-y-3">
            {topSectors.map(([sector, count]) => {
              const pct = Math.round((count / leads.length) * 100)
              return (
                <div key={sector}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="truncate" style={{ color: 'var(--text-dim)', maxWidth: '70%' }}>{sector}</span>
                    <span className="font-medium text-white">{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--border)' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: 3,
                      background: 'var(--blue)', transition: 'width 0.5s'
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8 text-sm" style={{ color: 'var(--text-dim)' }}>Cargando métricas...</div>
      )}
    </div>
  )
}
