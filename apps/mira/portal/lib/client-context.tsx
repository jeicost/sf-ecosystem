'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'

export interface ActiveClient {
  id: string
  name: string
  slug: string
  logoUrl?: string | null
  primaryColor?: string | null
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

// Fallback name mappings for when the clients row is not readable (RLS edge cases)
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

        // Fuente de verdad: los grants del usuario (multi-empresa).
        // Prioridad: cliente guardado si sigue con acceso → metadata.client_id
        // si tiene grant → primer cliente con grant. Super admin: el guardado
        // (puede moverse por todos) o ninguno (aterriza en /admin).
        const res = await fetch('/api/me/clients')
        const json = res.ok ? await res.json() : { clients: [], super_admin: false }
        const granted: Array<{ id: string; name: string; slug: string; logo_url: string | null; primary_color: string | null }> =
          Array.isArray(json?.clients) ? json.clients : []
        const isSuperAdmin = Boolean(json?.super_admin)

        const toActive = (row: (typeof granted)[number]): ActiveClient => ({
          id: row.id,
          name: row.name || CLIENT_NAMES[row.id]?.name || 'Cliente',
          slug: row.slug || CLIENT_NAMES[row.id]?.slug || row.id,
          logoUrl: row.logo_url || null,
          primaryColor: row.primary_color || null,
        })

        let stored: ActiveClient | null = null
        try {
          const raw = localStorage.getItem(STORAGE_KEY)
          if (raw) stored = JSON.parse(raw)
        } catch {}

        if (stored) {
          const match = granted.find((c) => c.id === stored!.id)
          if (match) {
            setActiveClient(toActive(match))
            return
          }
          if (isSuperAdmin) {
            setActiveClientState(stored)
            return
          }
          // Perdió el acceso al cliente guardado: límpialo y sigue.
          localStorage.removeItem(STORAGE_KEY)
        }

        const metaClientId = user.user_metadata?.client_id as string | undefined
        const metaMatch = metaClientId ? granted.find((c) => c.id === metaClientId) : undefined
        if (metaMatch) {
          setActiveClient(toActive(metaMatch))
          return
        }

        if (!isSuperAdmin && granted.length > 0) {
          setActiveClient(toActive(granted[0]))
        }
        // Super admin sin selección: sin cliente activo (verá /admin).
      } catch (error) {
        console.error('Client context error:', error)
      }
    }

    initializeClient()
  }, [])

  // Expose the client brand color as a CSS variable for white-label accents
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (activeClient?.primaryColor) {
      document.documentElement.style.setProperty('--client-primary', activeClient.primaryColor)
    } else {
      document.documentElement.style.removeProperty('--client-primary')
    }
  }, [activeClient?.primaryColor])

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
