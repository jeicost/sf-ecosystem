'use client'

import Link from 'next/link'
import { ArrowRight, Zap, HardDrive } from 'lucide-react'

interface ClientCardProps {
  id: string
  name: string
  slug: string
  agentsReady?: number
  storageUsed?: number
  storageLimit?: number
  status: 'active' | 'onboarding' | 'archived'
  createdAt: string
}

export function ClientCard({
  id,
  name,
  slug,
  agentsReady = 30,
  storageUsed = 2048,
  storageLimit = 10240,
  status,
  createdAt,
}: ClientCardProps) {
  const storagePercent = (storageUsed / storageLimit) * 100
  const daysActive = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  )

  const statusColor = {
    active: 'bg-green-100 text-green-800',
    onboarding: 'bg-yellow-100 text-yellow-800',
    archived: 'bg-surface text-ink-secondary',
  }[status]

  const statusLabel = {
    active: 'Active',
    onboarding: 'Onboarding',
    archived: 'Archived',
  }[status]

  return (
    <div className="bg-card border border-line rounded-lg p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-ink">{name}</h3>
          <p className="text-sm text-ink-tertiary mt-1">
            {daysActive} days active
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Agents Ready */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-blue-600" />
            <span className="text-xs text-ink-tertiary">Agents Ready</span>
          </div>
          <p className="text-xl font-bold text-blue-900">{agentsReady}</p>
          <p className="text-xs text-ink-tertiary">of 30</p>
        </div>

        {/* Storage */}
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <HardDrive size={14} className="text-purple-600" />
            <span className="text-xs text-ink-tertiary">Storage</span>
          </div>
          <p className="text-xl font-bold text-purple-900">
            {(storageUsed / 1024).toFixed(1)}GB
          </p>
          <p className="text-xs text-ink-tertiary">of {(storageLimit / 1024).toFixed(0)}GB</p>
        </div>
      </div>

      {/* Storage Bar */}
      <div className="mb-6">
        <div className="w-full bg-surface-hover rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              storagePercent > 80 ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(storagePercent, 100)}%` }}
          />
        </div>
        <p className="text-xs text-ink-tertiary mt-1">
          {storagePercent.toFixed(0)}% used
        </p>
      </div>

      {/* CTA Buttons */}
      <div className="flex gap-2">
        <Link
          href={`/admin/clients/${slug}`}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          Manage
          <ArrowRight size={14} />
        </Link>
        <Link
          href={`/brand-brain?client=${id}`}
          className="flex-1 px-4 py-2 bg-surface text-ink rounded-lg text-sm font-medium hover:bg-surface-hover transition-colors"
        >
          Brand Brain
        </Link>
      </div>
    </div>
  )
}
