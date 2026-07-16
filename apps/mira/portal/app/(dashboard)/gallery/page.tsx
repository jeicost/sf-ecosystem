'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Loader2, Eye } from 'lucide-react'
import { TOOLKIT_TOOLS } from '@/lib/toolkit-tools'

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

  useEffect(() => {
    fetchGenerations()
  }, [])

  const fetchGenerations = async () => {
    try {
      const client = createClient()
      const { data } = await client.from('generation_queue').select('*').eq('status', 'completed').order('created_at', { ascending: false }).limit(100)
      setGenerations(data || [])
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" size={24} /></div>

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Gallery</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {generations.map((gen) => {
          const info = TOOLS_INFO[gen.tool_slug] || { icon: '⚡', color: '#9CA3AF', name: gen.tool_slug }
          return (
            <Link key={gen.id} href={`/toolkit/${gen.tool_slug}?result=${gen.id}`}>
              <div className="card p-6 hover:bg-white/10 cursor-pointer h-full" style={{ borderLeft: `4px solid ${info.color}` }}>
                <div className="text-4xl mb-3">{info.icon}</div>
                <h3 className="font-semibold text-white mb-2">{info.name}</h3>
                <p className="text-xs text-gray-400">{new Date(gen.created_at).toLocaleDateString()}</p>
                <div className="mt-4 flex gap-2"><Eye size={16} className="text-blue-400" /> <span className="text-xs text-blue-400">View</span></div>
              </div>
            </Link>
          )
        })}
      </div>
      {generations.length === 0 && <p className="text-center text-gray-400 py-12">No generations yet</p>}
    </div>
  )
}
