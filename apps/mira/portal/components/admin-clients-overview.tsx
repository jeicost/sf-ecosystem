'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ALL_AGENTS } from '@/lib/agents'
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
}

export default function AdminClientsOverview() {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClients = async () => {
      const db = createClient()
      const { data, error } = await db
        .from('clients')
        .select('id,name,slug,icp,onboarding_status,logo_url,primary_color,created_at')
        .order('name')

      if (error) {
        console.error('Error fetching clients:', error)
      } else if (data) {
        setClients(data)
      }
      setLoading(false)
    }

    fetchClients()
  }, [])

  const onboardingCompletedCount = clients.filter(
    c => c.onboarding_status === 'completed' || c.onboarding_status === 'onboarded'
  ).length

  return (
    <>
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(139,92,246,0.8)', letterSpacing: '0.12em' }}>
          Super Admin
        </p>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Clientes y Operaciones</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Gestión unificada de todos los clientes y su progreso en MIRA
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard label="Clientes Activos" value={clients.length} />
        <StatCard label="Onboarding Completado" value={onboardingCompletedCount} />
        <StatCard label="Agentes Disponibles" value={ALL_AGENTS.length} />
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-400">Cargando clientes...</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-8 text-slate-400">No hay clientes configurados aún</div>
      ) : (
        <>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white">Clientes Activos</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {clients.map(client => (
              <ClientCard
                key={client.id}
                id={client.id}
                name={client.name}
                slug={client.slug}
                logoUrl={client.logo_url}
                primaryColor={client.primary_color}
                onboardingStatus={client.onboarding_status || 'En progreso'}
                createdAt={client.created_at}
              />
            ))}
          </div>
        </>
      )}
    </>
  )
}
