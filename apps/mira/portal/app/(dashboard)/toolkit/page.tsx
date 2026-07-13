'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Loader2, CheckCircle, AlertCircle, Zap } from 'lucide-react'
import { TOOLKIT_TOOLS } from '@/lib/toolkit-tools'
import { useActiveClient } from '@/lib/client-context'
import { CLIENT_ID } from '@/lib/constants'

interface Generation {
  id: string
  tool_slug: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  created_at: string
  completed_at?: string
  result_data?: Record<string, any>
  error_message?: string
}

export default function ToolkitHub() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id ?? CLIENT_ID

  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch generations on mount
  useEffect(() => {
    fetchGenerations()

    // Poll for updates every 5 seconds if there are pending/processing items
    const interval = setInterval(() => {
      setGenerations((prev) => {
        const hasPending = prev.some((g) => g.status !== 'completed' && g.status !== 'failed')
        if (hasPending) {
          fetchGenerations()
        }
        return prev
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [clientId])

  const fetchGenerations = async () => {
    try {
      const client = createClient()
      const { data, error: dbError } = await client
        .from('generation_queue')
        .select('id, tool_slug, status, result_data, created_at, completed_at, error_message')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (dbError) {
        console.error('Supabase error:', dbError)
        setError(`Database error: ${dbError.message}`)
        setGenerations([])
      } else {
        setGenerations(data || [])
        setError(null)
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch generations')
      setGenerations([])
    } finally {
      setLoading(false)
    }
  }

  const getToolColor = (slug: string) => {
    const tool = TOOLKIT_TOOLS.find((t) => t.slug === slug)
    return tool?.color || '#9CA3AF'
  }

  const getToolIcon = (slug: string) => {
    const tool = TOOLKIT_TOOLS.find((t) => t.slug === slug)
    return tool?.icon || '⚡'
  }

  const getToolTitle = (slug: string) => {
    const tool = TOOLKIT_TOOLS.find((t) => t.slug === slug)
    return tool?.name || slug
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-400" />
      case 'processing':
        return <Loader2 size={16} className="text-blue-400 animate-spin" />
      case 'failed':
        return <AlertCircle size={16} className="text-red-400" />
      default:
        return <Zap size={16} className="text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400'
      case 'processing':
        return 'bg-blue-500/20 text-blue-400'
      case 'failed':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <p className="text-xs uppercase tracking-widest font-semibold mb-2 text-gray-500">Portal</p>
        <h1 className="text-3xl font-semibold text-white mb-2">Toolkit</h1>
        <p className="text-sm text-gray-400">Genera content, reportes, y estrategias con IA. Todos tus entregables en un solo lugar.</p>
      </div>

      {/* Crear Nuevo Entregable */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold mb-4 text-white">Generar Nuevo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TOOLKIT_TOOLS.map((tool) => (
            <Link
              key={tool.slug}
              href={tool.href}
              className="card p-4 hover:bg-white/8 transition-all cursor-pointer border-l-4"
              style={{ borderLeftColor: tool.color }}
            >
              <p className="text-2xl mb-2">{tool.icon}</p>
              <p className="text-sm font-semibold text-white">{tool.name}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Centro de Reportes */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-white">Centro de Reportes</h2>
        
        {error && (
          <div className="card p-4 border-red-500/20 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-red-400 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-400">Error</p>
                <p className="text-xs text-gray-400 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="card p-8 flex items-center justify-center gap-3">
            <Loader2 size={20} className="animate-spin text-gray-400" />
            <p className="text-gray-400">Cargando generaciones...</p>
          </div>
        ) : generations.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-gray-400">No hay generaciones aún</p>
            <p className="text-xs text-gray-500 mt-2">Selecciona un tool arriba para crear tu primer entregable</p>
          </div>
        ) : (
          <div className="space-y-2">
            {generations.map((gen) => {
              const completionTime = gen.completed_at
                ? `${Math.round((new Date(gen.completed_at).getTime() - new Date(gen.created_at).getTime()) / 1000)}s`
                : '—'

              return (
                <div
                  key={gen.id}
                  className="card p-4 border-l-4 hover:bg-white/5 transition-colors"
                  style={{ borderLeftColor: getToolColor(gen.tool_slug) }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex items-center gap-4">
                      <span className="text-xl">{getToolIcon(gen.tool_slug)}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-white capitalize">
                          {gen.tool_slug.replace(/-/g, ' ')}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(gen.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(gen.status)}`}>
                          {getStatusIcon(gen.status)}
                          <span className="capitalize">{gen.status}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{completionTime}</p>
                      </div>

                      {gen.status === 'completed' && (
                        <Link
                          href={`/toolkit/${gen.tool_slug}?result=${gen.id}`}
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                          Ver →
                        </Link>
                      )}

                      {gen.status === 'failed' && (
                        <div className="text-xs text-red-400">
                          {gen.error_message || 'Unknown error'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
