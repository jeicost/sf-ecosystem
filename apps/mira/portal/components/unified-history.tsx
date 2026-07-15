'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getUnifiedHistory, type UnifiedGeneration } from '@/lib/unified-history'
import { useActiveClient } from '@/lib/client-context'

export default function UnifiedHistory() {
  const { activeClient } = useActiveClient()
  const [generations, setGenerations] = useState<UnifiedGeneration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeClient?.id) {
      setLoading(false)
      return
    }

    const fetchHistory = async () => {
      const data = await getUnifiedHistory(activeClient.id, 5)
      setGenerations(data)
      setLoading(false)
    }

    fetchHistory()
  }, [activeClient?.id])

  if (loading) {
    return (
      <div className="py-4 text-center text-[#666]">
        <p className="text-xs">Loading...</p>
      </div>
    )
  }

  if (generations.length === 0) {
    return (
      <div className="py-8 text-center text-[#666]">
        <p className="text-sm">No generations yet. Start creating!</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {generations.map((gen) => (
        <div
          key={gen.id}
          className="card px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-all"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-white">{gen.name}</span>
              <span
                className="text-[9px] px-2 py-0.5 rounded-full"
                style={{
                  background: gen.type === 'toolkit' ? 'rgba(139,92,246,0.1)' : 'rgba(99,102,241,0.1)',
                  color: gen.type === 'toolkit' ? '#a78bfa' : '#818cf8',
                }}
              >
                {gen.type === 'toolkit' ? '🔧 Toolkit' : '⚡ Quick Action'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[#666]">
              {gen.department && <span>{gen.department}</span>}
              <span>•</span>
              <span>{new Date(gen.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
              <span>•</span>
              <span
                className={`font-medium ${
                  gen.status === 'completed'
                    ? 'text-green-400'
                    : gen.status === 'failed'
                      ? 'text-red-400'
                      : 'text-yellow-400'
                }`}
              >
                {gen.status === 'completed' ? '✓' : gen.status === 'failed' ? '✗' : '⏱'} {gen.status}
              </span>
            </div>
          </div>
          {gen.resultUrl && (
            <Link
              href={gen.resultUrl}
              className="ml-4 text-[11px] font-medium px-2 py-1 rounded transition-all hover:bg-white/10"
              style={{ color: '#a78bfa' }}
            >
              View →
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}
