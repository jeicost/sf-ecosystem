'use client'

import { useEffect, useState } from 'react'
import { Download, Filter, Loader2 } from 'lucide-react'
import ClientPortalHeader from '@/components/client-portal-header'
import { getClientDeliveries } from '@/lib/client-portal-service'
import { createClient } from '@/lib/supabase'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'
import { safeLookupOr } from '@/lib/safe-lookup'

// Bug real encontrado 2026-07-30: este mapa solo cubría 3 de los 4+ valores
// reales de generation_queue.status (CHECK: queued/processing/completed/
// failed, más la propia traducción completed->delivered de la API) --
// cualquier entrega en queued/processing/failed rompía la página entera
// (StatusConfig undefined, .bg sobre undefined). Ahora cubre los reales +
// un fallback seguro para cualquier valor futuro no previsto.
const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  delivered: { bg: 'rgba(16,185,129,0.1)', text: '#4ade80', label: 'portal.entregas.status-delivered' },
  'in-review': { bg: 'rgba(249,115,22,0.1)', text: '#fb923c', label: 'portal.entregas.status-in-review' },
  generated: { bg: 'rgba(59,130,246,0.1)', text: '#60a5fa', label: 'portal.entregas.status-generated' },
  queued: { bg: 'rgba(148,163,184,0.1)', text: '#94a3b8', label: 'portal.entregas.status-queued' },
  processing: { bg: 'rgba(250,204,21,0.1)', text: '#facc15', label: 'portal.entregas.status-processing' },
  failed: { bg: 'rgba(239,68,68,0.1)', text: '#f87171', label: 'portal.entregas.status-failed' },
}
const DEFAULT_STATUS_COLOR = STATUS_COLORS.generated

export default function EntregasPage() {
  const { locale } = useLocaleContext()
  const [filter, setFilter] = useState<'all' | 'delivered' | 'in-review'>('all')
  const [entregas, setEntregas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = createClient()
        const { data: { user } } = await db.auth.getUser()
        if (!user) return

        const meta = user.user_metadata || {}
        let clientId = meta.client_id

        if (!clientId) {
          const { data: access } = await db
            .from('mira_project_access')
            .select('project_id')
            .eq('user_id', user.id)
            .limit(1)
            .single()
          clientId = access?.project_id
        }

        if (clientId) {
          const data = await getClientDeliveries(clientId)
          setEntregas(data)
        }
      } catch (error) {
        console.error('Failed to fetch entregas:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filtered = filter === 'all' ? entregas : entregas.filter(e => e.status === filter)

  return (
    <div className="px-8 py-8 max-w-6xl">
      <ClientPortalHeader
        title={t('portal.entregas.title', locale)}
        subtitle={t('portal.entregas.subtitle', locale)}
        icon="📦"
      />

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        <Filter size={14} style={{ color: 'var(--text-tertiary)' }} />
        <div className="flex gap-2">
          {['all', 'delivered', 'in-review'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{
                background: filter === f ? 'rgba(139,92,246,0.2)' : 'var(--bg-surface)',
                color: filter === f ? '#a78bfa' : 'var(--text-tertiary)',
                border: filter === f ? '1px solid rgba(139,92,246,0.3)' : '1px solid var(--border)',
              }}
            >
              {f === 'all' ? t('portal.entregas.filter-all', locale) : f === 'delivered' ? t('portal.entregas.filter-delivered', locale) : t('portal.entregas.filter-in-review', locale)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={16} className="animate-spin text-ink-muted" />
          </div>
        ) : filtered.length > 0 ? (
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider font-semibold text-left text-ink-tertiary">
                  {t('portal.entregas.col-date', locale)}
                </th>
                <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider font-semibold text-ink-tertiary">
                  {t('portal.entregas.col-tool', locale)}
                </th>
                <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider font-semibold text-ink-tertiary">
                  {t('portal.entregas.col-status', locale)}
                </th>
                <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider font-semibold text-ink-tertiary">
                  {t('portal.entregas.col-size', locale)}
                </th>
                <th className="text-right py-3 px-4 text-[11px] uppercase tracking-wider font-semibold text-ink-tertiary">
                  {t('portal.entregas.col-action', locale)}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(entrega => {
                const statusConfig = safeLookupOr(STATUS_COLORS, entrega.status, DEFAULT_STATUS_COLOR)
                return (
                  <tr key={entrega.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td className="py-3 px-4 text-[13px] text-ink">
                      {new Date(entrega.date).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-[13px] text-ink font-medium">{entrega.tool}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: statusConfig.bg, color: statusConfig.text }}>
                        {t(statusConfig.label, locale)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[13px] text-ink-tertiary">
                      {entrega.size}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {entrega.status === 'delivered' && (
                        <button className="inline-flex items-center gap-1 text-[12px] px-3 py-1 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
                          <Download size={12} />
                          {t('portal.entregas.download', locale)}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-ink-muted">
            <p className="text-sm">{t('portal.entregas.empty', locale)}</p>
          </div>
        )}
      </div>
    </div>
  )
}
