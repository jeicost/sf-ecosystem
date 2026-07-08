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
  '714a028e-a16d-428c-b8a9-3338f56f0a9c': { name: 'Salsa Burgers', slug: 'salsa-burgers' },
  '160d5a90-0da7-4db1-a1fb-9c29ea57a736': { name: 'Discoolver', slug: 'discoolver' },
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
