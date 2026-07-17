'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'

export interface ActiveClient {
  id: string
  name: string
  slug: string
}

interface ClientContextValue {
  activeClient: ActiveClient | null
  setActiveClient: (c: ActiveClient) => void
}

const ClientContext = createContext<ClientContextValue>({
  activeClient: null,
  setActiveClient: () => {},
})

const STORAGE_KEY = 'mira_active_client'

// Client name mappings — avoids RLS issues by not querying the table
const CLIENT_NAMES: Record<string, { name: string; slug: string }> = {
  'e664873b-034d-48cd-9a45-8631672ef375': { name: 'Dadybox', slug: 'dadybox' },
  'c375bb80-b0d1-4923-a73a-ac96a3ce7799': { name: 'Salsa Burgers', slug: 'salsa-burgers' },
  '160d5a90-0da7-4db1-a1fb-9c29ea57a736': { name: 'Discoolver', slug: 'discoolver' },
  'cef0a1b7-aabb-4239-a5a8-28ece0d1819b': { name: 'Startup Factory', slug: 'startup-factory' },
  'a1c3e5f7-b9d1-4a2b-c3e5-f7a9b1d3e5f7': { name: 'NC Global Assets', slug: 'nc-global-assets' },
  'b2d4f6a8-c0e2-4b3c-d4f6-a8b2c4e6f8a0': { name: 'LIDAR Home', slug: 'lidar-home' },
  'c3e5f7b9-d1f3-4c4d-e5f7-b9c3d5e7f9b1': { name: 'CERO Agency', slug: 'cero-agency' },
}

export function ClientProvider({ children }: { children: ReactNode }) {
  const [activeClient, setActiveClientState] = useState<ActiveClient | null>(null)

  useEffect(() => {
    async function initializeClient() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        // Get client_id from user metadata
        const clientId = user.user_metadata?.client_id as string | undefined

        if (clientId && CLIENT_NAMES[clientId]) {
          const { name, slug } = CLIENT_NAMES[clientId]
          const client: ActiveClient = { id: clientId, name, slug }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(client))
          setActiveClientState(client)
          console.log('✅ Loaded client:', name)
          return
        }

        // Fallback to localStorage if no client_id
        try {
          const raw = localStorage.getItem(STORAGE_KEY)
          if (raw) setActiveClientState(JSON.parse(raw))
        } catch {}
      } catch (error) {
        console.error('Client context error:', error)
      }
    }

    initializeClient()
  }, [])

  function setActiveClient(c: ActiveClient) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c))
    setActiveClientState(c)
  }

  return (
    <ClientContext.Provider value={{ activeClient, setActiveClient }}>
      {children}
    </ClientContext.Provider>
  )
}

export function useActiveClient() {
  return useContext(ClientContext)
}

export function getStoredClientId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ActiveClient).id : null
  } catch {
    return null
  }
}
