'use client'

import { useEffect, useState } from 'react'
import { ClientCard } from './ClientCard'
import { createClient } from '@/lib/supabase'

interface Client {
  id: string
  name: string
  slug: string
  created_at: string
}

export function ClientsGrid() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    try {
      const db = createClient()

      // Get current user
      const { data: { user } } = await db.auth.getUser()
      if (!user) {
        setError('Not authenticated')
        return
      }

      // Get user's accessible clients
      const { data: access } = await db
        .from('mira_project_access')
        .select('project_id')
        .eq('user_id', user.id)

      if (!access || access.length === 0) {
        setClients([])
        setLoading(false)
        return
      }

      const projectIds = access.map(a => a.project_id)

      // Get client details
      const { data: clients, error: err } = await db
        .from('clients')
        .select('id, name, slug, created_at')
        .in('id', projectIds)
        .order('created_at', { ascending: false })

      if (err) throw err

      setClients(clients || [])
    } catch (err) {
      console.error('Error fetching clients:', err)
      setError(err instanceof Error ? err.message : 'Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-80 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">
          <strong>Error:</strong> {error}
        </p>
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
        <p className="text-yellow-800 mb-4">
          No clients found. You may not have access to any clients yet.
        </p>
        <p className="text-sm text-yellow-600">
          Contact your administrator to get access.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Summary */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>👥 {clients.length} Client{clients.length !== 1 ? 's' : ''}</strong>
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <ClientCard
            key={client.id}
            id={client.id}
            name={client.name}
            slug={client.slug}
            status="active"
            createdAt={client.created_at}
          />
        ))}
      </div>
    </div>
  )
}
