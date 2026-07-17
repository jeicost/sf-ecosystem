'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import Card from '@/components/ui/Card'

interface Project {
  id: string
  name: string
  slug: string
  status: string
  storage_used_gb: number
  storage_limit_gb: number
  last_access: string
  active: boolean
}

interface User {
  id: string
  email: string
  company_name: string
  subscription_tier: 'starter' | 'growth' | 'scale' | 'enterprise'
  subscription_status: 'active' | 'paused' | 'cancelled'
  created_at: string
  projects: Project[]
}

interface UserManagementTableProps {
  users: User[]
  onToggleActivation: (userId: string, projectId: string, active: boolean) => void
  onEditStorageLimit: (userId: string, projectId: string, limit: number) => void
}

const TIER_COLORS: Record<string, { bg: string; text: string }> = {
  enterprise: { bg: '#8B5CF620', text: '#8B5CF6cc' },
  scale: { bg: '#6366F120', text: '#6366F1cc' },
  growth: { bg: '#10B98120', text: '#10B981cc' },
  starter: { bg: '#66666620', text: '#666666cc' },
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: '#10B98120', text: '#10B981cc' },
  paused: { bg: '#F59E0B20', text: '#F59E0Bcc' },
  cancelled: { bg: '#EF444420', text: '#EF4444cc' },
}

export default function UserManagementTable({
  users,
  onToggleActivation,
  onEditStorageLimit,
}: UserManagementTableProps) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const { locale } = useLocaleContext()

  const getPlanLabel = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1)
  }

  const getStoragePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100)
  }

  const getStatusLabel = (status: string) => {
    return t(`admin.users.status-${status}`, locale)
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead
            style={{
              background: 'rgba(255,255,255,0.02)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <tr>
              <th
                className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                {t('admin.users.table.email', locale)}
              </th>
              <th
                className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                {t('admin.users.table.company', locale)}
              </th>
              <th
                className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                {t('admin.users.table.plan', locale)}
              </th>
              <th
                className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                {t('admin.users.table.status', locale)}
              </th>
              <th
                className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                {t('admin.users.table.projects', locale)}
              </th>
              <th
                className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                {t('admin.users.table.created', locale)}
              </th>
              <th
                className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                {t('admin.users.table.actions', locale)}
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr
                key={user.id}
                style={{
                  background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <td className="px-6 py-4 text-sm text-white">{user.email}</td>
                <td className="px-6 py-4 text-sm text-white">{user.company_name}</td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: TIER_COLORS[user.subscription_tier].bg,
                      color: TIER_COLORS[user.subscription_tier].text,
                    }}
                  >
                    {getPlanLabel(user.subscription_tier)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: STATUS_COLORS[user.subscription_status].bg,
                      color: STATUS_COLORS[user.subscription_status].text,
                    }}
                  >
                    {getStatusLabel(user.subscription_status)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                    className="font-medium transition-colors"
                    style={{ color: '#6366F1' }}
                  >
                    <span>{user.projects.length}</span>
                    <span> {expandedUserId === user.id ? <ChevronUp className="inline w-4 h-4 ml-1" /> : <ChevronDown className="inline w-4 h-4 ml-1" />}</span>
                  </button>
                </td>
                <td className="px-6 py-4 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm">
                  {expandedUserId === user.id && (
                    <ChevronUp className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expanded projects section */}
      {users
        .filter((u) => u.id === expandedUserId)
        .map((user) => (
          <div
            key={`projects-${user.id}`}
            style={{
              background: 'rgba(255,255,255,0.02)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="p-6 space-y-4">
              <h3 className="font-semibold text-lg text-white">
                {t('admin.users.projects-header', locale)} {user.email}
              </h3>
              {user.projects.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {t('admin.users.no-projects', locale)}
                </p>
              ) : (
                <div className="grid gap-4">
                  {user.projects.map((project) => {
                    const storagePercent = getStoragePercentage(project.storage_used_gb, project.storage_limit_gb)
                    return (
                      <Card key={project.id} radius="card" padding="md">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-white">{project.name}</h4>
                            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                              {project.slug}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => onToggleActivation(user.id, project.id, project.active)}
                              className="px-3 py-1 rounded text-sm font-semibold transition-colors flex items-center gap-1"
                              style={{
                                background: project.active ? '#10B98120' : '#EF444420',
                                color: project.active ? '#10B981cc' : '#EF4444cc',
                              }}
                            >
                              {project.active ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  {t('admin.users.active', locale)}
                                </>
                              ) : (
                                <>
                                  <X className="w-3.5 h-3.5" />
                                  {t('admin.users.inactive', locale)}
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => onEditStorageLimit(user.id, project.id, project.storage_limit_gb)}
                              className="px-3 py-1 rounded text-sm font-semibold transition-colors"
                              style={{
                                background: '#6366F120',
                                color: '#6366F1cc',
                              }}
                            >
                              {t('admin.users.edit-storage', locale)}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-[11px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
                              {t('admin.users.last-access', locale)}
                            </p>
                            <p className="font-medium text-white mt-1">
                              {new Date(project.last_access).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
                              {t('admin.users.storage', locale)}
                            </p>
                            <p className="font-medium text-white mt-1">
                              {project.storage_used_gb.toFixed(2)} / {project.storage_limit_gb} GB
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
                              {t('admin.users.usage', locale)}
                            </p>
                            <div className="w-full rounded-full h-2 mt-2" style={{ background: 'rgba(255,255,255,0.1)' }}>
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{
                                  width: `${Math.min(storagePercent, 100)}%`,
                                  background:
                                    storagePercent > 80 ? '#EF4444' : storagePercent > 50 ? '#F59E0B' : '#10B981',
                                }}
                              />
                            </div>
                            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                              {storagePercent}%
                            </p>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
    </div>
  )
}
