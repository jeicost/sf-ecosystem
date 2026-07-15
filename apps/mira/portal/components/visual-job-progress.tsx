'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, AlertCircle, Download, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'
import type { VisualJobStatus, VisualJobStatusType, VisualAsset, ApprovalStatus } from '@/lib/generation/visual-provider'

interface VisualJobProgressProps {
  jobId: string
  onRefinement?: (assetId: string, refinementPrompt: string) => void
  onApproval?: (assetId: string, status: ApprovalStatus) => void
}

export function VisualJobProgress({
  jobId,
  onRefinement,
  onApproval,
}: VisualJobProgressProps) {
  const [jobStatus, setJobStatus] = useState<VisualJobStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<VisualAsset | null>(null)
  const [refinementPrompt, setRefinementPrompt] = useState('')
  const [expandedAssets, setExpandedAssets] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const pollJob = async () => {
      try {
        const res = await fetch(`/api/visual-jobs/${jobId}`)
        if (res.ok) {
          const data = await res.json()
          setJobStatus(data)
        }
      } catch (error) {
        console.error('Error polling visual job:', error)
      } finally {
        setLoading(false)
      }
    }

    pollJob()
    const interval = setInterval(pollJob, 2000) // Poll every 2s
    return () => clearInterval(interval)
  }, [jobId])

  if (loading) {
    return (
      <div className="p-6 bg-surface rounded-lg border border-border space-y-4">
        <div className="flex items-center gap-2 text-text2">
          <Clock size={16} className="animate-spin" />
          <span>Loading visual job status...</span>
        </div>
      </div>
    )
  }

  if (!jobStatus) {
    return (
      <div className="p-6 bg-surface rounded-lg border border-border">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle size={16} />
          <span>Job not found or error occurred</span>
        </div>
      </div>
    )
  }

  const states = ['accepted', 'planning', 'rendering', 'qa', 'completed', 'error'] as const
  const currentStateIndex = states.indexOf(jobStatus.status as VisualJobStatusType)

  return (
    <div className="space-y-6">
      {/* Progress Timeline */}
      <div className="p-6 bg-surface rounded-lg border border-border">
        <div className="flex items-center justify-between gap-2 mb-4">
          {states.map((state, idx) => (
            <div
              key={state}
              className="flex flex-col items-center flex-1"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-colors ${
                  idx <= currentStateIndex
                    ? 'bg-accent text-white'
                    : 'bg-surface2 text-text3'
                }`}
              >
                {idx < currentStateIndex ? (
                  <CheckCircle2 size={20} />
                ) : idx === currentStateIndex ? (
                  <Clock className="animate-spin" size={20} />
                ) : (
                  idx + 1
                )}
              </div>
              <span className="text-xs uppercase tracking-wider text-text2 text-center">
                {state}
              </span>
            </div>
          ))}
        </div>

        {jobStatus.progress && (
          <div className="text-sm text-text3 text-center">
            Slide {jobStatus.progress.current} of {jobStatus.progress.total}
          </div>
        )}
      </div>

      {/* Error State */}
      {jobStatus.status === 'error' && jobStatus.error && (
        <div className="p-4 bg-red-950 border border-red-800 rounded-lg flex gap-3">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-200">
            <p className="font-semibold mb-1">Generation failed</p>
            <p>{jobStatus.error}</p>
          </div>
        </div>
      )}

      {/* Assets Grid */}
      {jobStatus.assets && jobStatus.assets.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text uppercase tracking-wider">
            Generated Assets
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobStatus.assets.map((asset) => (
              <div
                key={asset.id}
                className="bg-surface border border-border rounded-lg overflow-hidden hover:border-accent transition-colors"
              >
                {/* Asset Preview */}
                {asset.storageUrl && (
                  <div className="aspect-video bg-surface2 overflow-hidden">
                    <img
                      src={asset.storageUrl}
                      alt={`Asset ${asset.id}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Asset Meta */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-text3 mb-1">
                        {asset.assetType}
                      </p>
                      {asset.slideIndex !== undefined && (
                        <p className="text-xs text-text2">Slide {asset.slideIndex}</p>
                      )}
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider ${
                        asset.approvalStatus === 'approved'
                          ? 'bg-green-900 text-green-300'
                          : asset.approvalStatus === 'rejected'
                            ? 'bg-red-900 text-red-300'
                            : 'bg-yellow-900 text-yellow-300'
                      }`}
                    >
                      {asset.approvalStatus}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <a
                      href={asset.storageUrl}
                      download
                      className="flex-1 px-3 py-2 bg-cyan text-black rounded text-xs font-semibold uppercase tracking-wider hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
                    >
                      <Download size={14} />
                      Download
                    </a>

                    <button
                      onClick={() => {
                        setSelectedAsset(asset)
                        setExpandedAssets((p) => ({ ...p, [asset.id]: true }))
                      }}
                      className="px-3 py-2 bg-surface2 border border-border rounded text-xs font-semibold uppercase tracking-wider hover:border-accent transition-colors flex items-center gap-2"
                    >
                      <MessageSquare size={14} />
                      Refine
                    </button>
                  </div>

                  {/* Approval Buttons */}
                  {asset.approvalStatus === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <button
                        onClick={() => onApproval?.(asset.id, 'approved')}
                        className="flex-1 px-2 py-2 bg-green-900 text-green-300 rounded text-xs font-semibold uppercase tracking-wider hover:bg-green-800 transition-colors flex items-center justify-center gap-1"
                      >
                        <ThumbsUp size={12} />
                        Approve
                      </button>
                      <button
                        onClick={() => onApproval?.(asset.id, 'rejected')}
                        className="flex-1 px-2 py-2 bg-red-900 text-red-300 rounded text-xs font-semibold uppercase tracking-wider hover:bg-red-800 transition-colors flex items-center justify-center gap-1"
                      >
                        <ThumbsDown size={12} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                {/* Refinement Panel */}
                {expandedAssets[asset.id] && (
                  <div className="p-4 border-t border-border space-y-3">
                    <textarea
                      value={refinementPrompt}
                      onChange={(e) => setRefinementPrompt(e.target.value)}
                      placeholder="What should we change? (e.g., 'make background darker')"
                      className="w-full px-3 py-2 bg-surface2 border border-border rounded text-xs text-text placeholder-text3 resize-none h-16"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (refinementPrompt.trim()) {
                            onRefinement?.(asset.id, refinementPrompt)
                            setRefinementPrompt('')
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-accent text-white rounded text-xs font-semibold uppercase tracking-wider hover:opacity-80 transition-opacity"
                      >
                        Request Change
                      </button>
                      <button
                        onClick={() => {
                          setExpandedAssets((p) => ({ ...p, [asset.id]: false }))
                          setRefinementPrompt('')
                        }}
                        className="px-3 py-2 bg-surface2 border border-border rounded text-xs font-semibold uppercase tracking-wider hover:border-accent transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed State Message */}
      {jobStatus.status === 'completed' && jobStatus.assets?.length === 0 && (
        <div className="p-4 bg-surface2 border border-border rounded text-sm text-text3 text-center">
          Generation complete. Waiting for assets to be processed...
        </div>
      )}
    </div>
  )
}
