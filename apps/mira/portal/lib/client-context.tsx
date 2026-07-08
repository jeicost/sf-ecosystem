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
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        // PRIORITY 1: Always use user metadata if available
        if (user.user_metadata?.client_id) {
          try {
            const { data: client, error } = await supabase
              .from('clients')
              .select('id,name,slug')
              .eq('id', user.user_metadata.client_id)
              .single()

            if (client) {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(client))
              setActiveClientState(client)
              return
            }

            if (error) {
              console.error('Failed to load client by ID:', error.message)
            }
          } catch (e) {
            console.error('Client query error:', e)
          }
        }

        // PRIORITY 2: Try client_slug
        if (user.user_metadata?.client_slug) {
          try {
            const { data: client, error } = await supabase
              .from('clients')
              .select('id,name,slug')
              .eq('slug', user.user_metadata.client_slug)
              .single()

            if (client) {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(client))
              setActiveClientState(client)
              return
            }

            if (error) {
              console.error('Failed to load client by slug:', error.message)
            }
          } catch (e) {
            console.error('Client slug query error:', e)
          }
        }

        // PRIORITY 3: Only use localStorage as absolute last resort, and ONLY if user has NO metadata
        if (!user.user_metadata?.client_id && !user.user_metadata?.client_slug) {
          try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (raw) setActiveClientState(JSON.parse(raw))
          } catch {}
        }
      } catch (error) {
        console.error('Client context init error:', error)
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
  } catch { return null }
}
