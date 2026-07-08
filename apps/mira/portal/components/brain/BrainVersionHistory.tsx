'use client'
import { useEffect, useState } from 'react'
import { ArrowLeft, RotateCcw, Clock } from 'lucide-react'
import { BrainVersion } from '@/lib/types/brain'
import { createClient } from '@/lib/supabase'

interface BrainVersionHistoryProps {
  clientId: string
  currentVersion: number
  onRollback?: (versionNumber: number) => Promise<void>
}

export default function BrainVersionHistory({
  clientId,
  currentVersion,
  onRollback,
}: BrainVersionHistoryProps) {
  const [versions, setVersions] = useState<BrainVersion[]>([])
  const [selectedVersion, setSelectedVersion] = useState<BrainVersion | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRollingBack, setIsRollingBack] = useState(false)

  useEffect(() => {
    const fetchVersions = async () => {
      const db = createClient()
      const { data } = await db
        .from('brain_versions')
        .select('*')
        .eq('client_id', clientId)
        .order('version_number', { ascending: false })

      if (data) {
        setVersions(data)
      }
      setIsLoading(false)
    }

    fetchVersions()
  }, [clientId])

  const handleRollback = async (versionNumber: number) => {
    if (!onRollback) return

    setIsRollingBack(true)
    try {
      await onRollback(versionNumber)
      setSelectedVersion(null)
    } finally {
      setIsRollingBack(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#666]">Loading version history...</div>
      </div>
    )
  }

  if (selectedVersion) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedVersion(null)}
          className="flex items-center gap-2 text-sm text-[#EC4899] hover:text-[#FF1493]"
        >
          <ArrowLeft size={16} />
          Back to Timeline
        </button>

        <div className="card p-6 border border-[#1E1E1E] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-white">Version {selectedVersion.version_number}</div>
              <div className="text-xs text-[#666]">
                {new Date(selectedVersion.created_at).toLocaleString()}
              </div>
            </div>
            {selectedVersion.version_number !== currentVersion && (
              <button
                onClick={() => handleRollback(selectedVersion.version_number)}
                disabled={isRollingBack}
                className="px-4 py-2 rounded bg-[#F59E0B] text-black text-sm font-medium hover:bg-[#FBBF24] disabled:opacity-50 flex items-center gap-2"
              >
                <RotateCcw size={14} />
                Restore
              </button>
            )}
            {selectedVersion.version_number === currentVersion && (
              <div className="px-3 py-1 rounded bg-[#10B981]10 text-xs font-semibold text-[#10B981]">
                Current
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#666] uppercase">Change Summary</div>
            <div className="text-sm text-white bg-[#0D0D0D] p-3 rounded">
              {selectedVersion.change_summary || 'No summary provided'}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#666] uppercase">Triggered By</div>
            <div className="text-sm text-white">
              {selectedVersion.triggered_by === 'agent' ? (
                <span>Agent: <span className="text-[#EC4899]">{selectedVersion.triggered_by_agent_id}</span></span>
              ) : (
                <span className="capitalize text-[#999]">{selectedVersion.triggered_by}</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#666] uppercase">Brain State (JSON)</div>
            <pre className="text-xs bg-[#0D0D0D] p-3 rounded overflow-auto max-h-64 text-[#999]">
              {JSON.stringify(selectedVersion.snapshot, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-[#999]">{versions.length} versions tracked</div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[#1E1E1E]" />

        {/* Versions */}
        <div className="space-y-3">
          {versions.map((version, idx) => {
            const isCurrent = version.version_number === currentVersion
            return (
              <button
                key={version.id}
                onClick={() => setSelectedVersion(version)}
                className={`relative pl-16 py-3 text-left rounded transition-all border ${
                  isCurrent
                    ? 'border-[#10B981] bg-[#10B981]10'
                    : 'border-[#1E1E1E] hover:border-[#333] hover:bg-[#0D0D0D]'
                }`}
              >
                {/* Timeline dot */}
                <div
                  className={`absolute left-0 w-12 h-full flex items-center justify-center`}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isCurrent ? 'bg-[#10B981]' : 'bg-[#1E1E1E]'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-white">
                      v{version.version_number}
                    </div>
                    <div className="text-xs text-[#666] flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(version.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-xs text-[#999]">
                    {version.change_summary || 'No summary'}
                  </div>
                  {version.triggered_by === 'agent' && (
                    <div className="text-xs text-[#EC4899]">
                      Suggested by {version.triggered_by_agent_id}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
