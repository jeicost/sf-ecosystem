'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { AGENT_METADATA } from '@/lib/agent-meta'
import { TOOLKIT_TOOLS } from '@/lib/toolkit-tools'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'
import StatCard from './stat-card'
import ClientCard from './client-card'

interface ClientRow {
  id: string
  name: string
  slug: string
  icp: string | null
  onboarding_status: string | null
  logo_url: string | null
  primary_color: string | null
  created_at: string
  status?: string
}

interface DeliverableStats {
  [clientId: string]: {
    count: number
    tools: string[]
  }
}

export default function AdminClientsOverview() {
  const { locale } = useLocaleContext()
  const [clients, setClients] = useState<ClientRow[]>([])
  const [deliverableStats, setDeliverableStats] = useState<DeliverableStats>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const db = createClient()

      // Fetch clients
      const { data: clientsData, error: clientsError } = await db
        .from('clients')
        .select('id,name,slug,icp,onboarding_status,logo_url,primary_color,created_at,status')
        .order('name')

      if (clientsError) {
        console.error('Error fetching clients:', clientsError)
      } else if (clientsData) {
        setClients(clientsData)
      }

      // Fetch deliverables stats: count + distinct tools per client
      const { data: genData, error: genError } = await db
        .from('generation_queue')
        .select('client_id, tool_slug')
        .eq('status', 'completed')

      if (genError) {
        console.error('Error fetching generations:', genError)
      } else if (genData) {
        const stats: DeliverableStats = {}
        genData.forEach((row: any) => {
          if (!stats[row.client_id]) {
            stats[row.client_id] = { count: 0, tools: [] }
          }
          stats[row.client_id].count += 1
          if (!stats[row.client_id].tools.includes(row.tool_slug)) {
            stats[row.client_id].tools.push(row.tool_slug)
          }
        })
        setDeliverableStats(stats)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  const onboardingCompletedCount = clients.filter(
    c => c.onboarding_status === 'completed' || c.onboarding_status === 'onboarded'
  ).length

  const totalDeliverables = Object.values(deliverableStats).reduce((sum, stat) => sum + stat.count, 0)

  return (
    <>
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: 'rgba(139,92,246,0.6)', letterSpacing: '0.12em' }}>
          {t('admin.greeting', locale)}
        </p>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-ink tracking-tight mb-1">{t('admin.section-label', locale)}</h1>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Unified management of every client and their progress in MIRA
            </p>
          </div>
          <Link href="/toolkit"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
            <Plus size={14} />
            Generate deliverable
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Active Clients" value={clients.length} />
        <StatCard label="Deliverables Generated" value={totalDeliverables} />
        <StatCard label="Available Agents" value={Object.keys(AGENT_METADATA).length} />
        <StatCard label="AI Tools" value={TOOLKIT_TOOLS.length} />
      </div>

      {loading ? (
        <div className="text-center py-8 text-ink-secondary">Loading clients...</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-8 text-ink-secondary">No clients configured yet</div>
      ) : (
        <>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-ink">Active Clients</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {clients.map(client => {
              const stats = deliverableStats[client.id]
              return (
                <ClientCard
                  key={client.id}
                  id={client.id}
                  name={client.name}
                  slug={client.slug}
                  logoUrl={client.logo_url}
                  primaryColor={client.primary_color}
                  icp={client.icp}
                  status={client.status}
                  onboardingStatus={client.onboarding_status || 'In progress'}
                  createdAt={client.created_at}
                  deliverableCount={stats?.count || 0}
                  toolsUsed={stats?.tools || []}
                />
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
