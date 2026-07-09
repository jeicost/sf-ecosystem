'use client'

import { useState } from 'react'
import { Download, Filter } from 'lucide-react'
import ClientPortalHeader from '@/components/client-portal-header'

const ENTREGAS = [
  { id: 1, date: '2026-07-09', tool: 'Brand Briefing', status: 'delivered', size: '2.4 MB' },
  { id: 2, date: '2026-07-08', tool: 'SEO Audit', status: 'delivered', size: '1.8 MB' },
  { id: 3, date: '2026-07-07', tool: 'Content Pack', status: 'delivered', size: '5.2 MB' },
  { id: 4, date: '2026-07-06', tool: 'Marketing Audit', status: 'in-review', size: '3.1 MB' },
  { id: 5, date: '2026-07-05', tool: 'Action Plan 90d', status: 'delivered', size: '1.9 MB' },
  { id: 6, date: '2026-07-04', tool: 'Investor Deck', status: 'delivered', size: '4.7 MB' },
]

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  delivered: { bg: 'rgba(16,185,129,0.1)', text: '#4ade80', label: 'Entregado' },
  'in-review': { bg: 'rgba(249,115,22,0.1)', text: '#fb923c', label: 'En Revisión' },
  generated: { bg: 'rgba(59,130,246,0.1)', text: '#60a5fa', label: 'Generado' },
}

export default function EntregasPage() {
  const [filter, setFilter] = useState<'all' | 'delivered' | 'in-review'>('all')

  const filtered = filter === 'all' ? ENTREGAS : ENTREGAS.filter(e => e.status === filter)

  return (
    <div className="px-8 py-8 max-w-6xl">
      <ClientPortalHeader
        title="Mis Entregas"
        subtitle="Historial completo de deliverables generados"
        icon="📦"
      />

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        <Filter size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
        <div className="flex gap-2">
          {['all', 'delivered', 'in-review'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{
                background: filter === f ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)',
                color: filter === f ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                border: filter === f ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {f === 'all' ? 'Todas' : f === 'delivered' ? 'Entregadas' : 'En Revisión'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider font-semibold text-left" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Fecha
              </th>
              <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Herramienta
              </th>
              <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Estado
              </th>
              <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Tamaño
              </th>
              <th className="text-right py-3 px-4 text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Acción
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(entrega => {
              const statusConfig = STATUS_COLORS[entrega.status]
              return (
                <tr key={entrega.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td className="py-3 px-4 text-[13px] text-white">
                    {new Date(entrega.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-4 text-[13px] text-white font-medium">{entrega.tool}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: statusConfig.bg, color: statusConfig.text }}>
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {entrega.size}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {entrega.status === 'delivered' && (
                      <button className="inline-flex items-center gap-1 text-[12px] px-3 py-1 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
                        <Download size={12} />
                        Descargar
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
