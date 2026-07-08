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

export function ClientProvider({ children }: { children: ReactNode }) {
  const [activeClient, setActiveClientState] = useState<ActiveClient | null>(null)

  useEffect(() => {
    async function initializeClient() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // Always prioritize user metadata (logged-in user's client)
      if (user?.user_metadata?.client_id) {
        const { data: client } = await supabase
          .from('clients')
          .select('id,name,slug')
          .eq('id', user.user_metadata.client_id)
          .single()

        if (client) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(client))
          setActiveClientState(client)
          return
        }
      }

      // Fallback to localStorage only if not logged in
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) setActiveClientState(JSON.parse(raw))
      } catch {}
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
  } catch { return null }
}
