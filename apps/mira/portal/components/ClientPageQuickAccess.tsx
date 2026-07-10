'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Folder, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { CLIENT_ID } from '@/lib/constants'

interface ClientInfo {
  id: string
  name: string
  slug: string
  logo_url?: string
}

export default function ClientPageQuickAccess() {
  const [client, setClient] = useState<ClientInfo | null>(null)
  const [reportCount, setReportCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClientInfo = async () => {
      const db = createClient()

      // Get current client
      const { data: clientData } = await db
        .from('clients')
        .select('id, name, slug, logo_url')
        .eq('id', CLIENT_ID)
        .single()

      if (clientData) {
        setClient(clientData)

        // Count reports/deliverables
        const { count } = await db
          .from('deliverables')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', CLIENT_ID)

        setReportCount(count || 0)
      }

      setLoading(false)
    }

    fetchClientInfo()
  }, [])

  if (loading || !client) {
    return (
      <div className="card px-6 py-4 animate-pulse bg-white/3 h-24" />
    )
  }

  const clientPageUrl = `/resources?client=${client.slug}`

  return (
    <Link href={clientPageUrl}>
      <div className="card px-6 py-4 hover:bg-white/8 transition-all cursor-pointer group">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex-shrink-0">
              {client.logo_url ? (
                <img
                  src={client.logo_url}
                  alt={client.name}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-sm font-bold text-white">
                  {client.name[0]}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#888] uppercase tracking-wider mb-1">
                Client Page
              </p>
              <h3 className="text-sm font-semibold text-white">{client.name}</h3>
              <p className="text-xs text-[#666] mt-1">
                {reportCount} deliverable{reportCount !== 1 ? 's' : ''} created
              </p>
            </div>
          </div>
          <ArrowRight
            size={16}
            className="text-[#555] group-hover:text-blue-400 transition-colors flex-shrink-0 mt-1"
          />
        </div>
      </div>
    </Link>
  )
}
