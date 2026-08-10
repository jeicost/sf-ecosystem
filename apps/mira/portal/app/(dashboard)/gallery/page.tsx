'use client'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Loader2, Eye } from 'lucide-react'
import { TOOLKIT_TOOLS } from '@/lib/toolkit-tools'
import { useActiveClient } from '@/lib/client-context'

interface Generation {
  id: string
  tool_slug: string
  status: string
  created_at: string
  result_data?: Record<string, any>
}

// Create lookup from TOOLKIT_TOOLS
const TOOLS_INFO: Record<string, { icon: string; color: string; name: string }> = Object.fromEntries(
  TOOLKIT_TOOLS.map(tool => [tool.slug, { icon: tool.icon, color: tool.color, name: tool.name }])
)

export default function GalleryPage() {
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const { activeClient } = useActiveClient()

  // Filtro de cliente EXPLÍCITO: la consulta original leía la cola entera y
  // delegaba el aislamiento por completo a RLS (auditoría 2026-08-10).
  const fetchGenerations = useCallback(async (clientId: string) => {
    try {
      const client = createClient()
      const { data } = await client
        .from('generation_queue')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(100)
      setGenerations(data || [])
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeClient?.id) fetchGenerations(activeClient.id)
  }, [activeClient?.id, fetchGenerations])

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" size={24} /></div>

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Gallery</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {generations.map((gen) => {
          const info = TOOLS_INFO[gen.tool_slug] || { icon: '⚡', color: '#9CA3AF', name: gen.tool_slug }
          // Imagen del resultado: primero el asset persistido en Storage
          // (image_path via /api/assets), con fallback a la URL efímera.
          const imagePath = gen.result_data?.image_path as string | undefined
          const imageUrl = gen.result_data?.image_url as string | undefined
          const imageSrc = imagePath ? '/api/assets?path=' + encodeURIComponent(imagePath) : imageUrl
          return (
            <Link key={gen.id} href={`/toolkit/report/${gen.id}`}>
              <div className="card p-6 hover:bg-surface-hover cursor-pointer h-full" style={{ borderLeft: `4px solid ${info.color}` }}>
                {imageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageSrc} alt={info.name} loading="lazy"
                    className="mb-3 h-36 w-full rounded-lg object-cover" />
                ) : (
                  <div className="text-4xl mb-3">{info.icon}</div>
                )}
                <h3 className="font-semibold text-ink mb-2">{info.name}</h3>
                <p className="text-xs text-ink-secondary">{new Date(gen.created_at).toLocaleDateString()}</p>
                <div className="mt-4 flex gap-2"><Eye size={16} className="text-blue-400" /> <span className="text-xs text-blue-400">View</span></div>
              </div>
            </Link>
          )
        })}
      </div>
      {generations.length === 0 && <p className="text-center text-ink-secondary py-12">No generations yet</p>}
    </div>
  )
}
