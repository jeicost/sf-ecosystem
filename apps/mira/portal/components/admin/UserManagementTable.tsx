'use client'

import { useState } from 'react'

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

export default function UserManagementTable({
  users,
  onToggleActivation,
  onEditStorageLimit,
}: UserManagementTableProps) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)

  const getPlanColor = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800'
      case 'scale':
        return 'bg-blue-100 text-blue-800'
      case 'growth':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'text-green-600' : 'text-red-600'
  }

  const getStoragePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100)
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Empresa</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Plan</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Estado</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Proyectos</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Creado</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 text-sm">{user.email}</td>
                <td className="px-6 py-4 text-sm">{user.company_name}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPlanColor(user.subscription_tier)}`}>
                    {user.subscription_tier.toUpperCase()}
                  </span>
                </td>
                <td className={`px-6 py-4 text-sm font-medium ${getStatusColor(user.subscription_status)}`}>
                  {user.subscription_status}
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {user.projects.length} proyecto{user.projects.length !== 1 ? 's' : ''}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm">
                  {expandedUserId === user.id && (
                    <button className="text-blue-600">↥ Ver detalles</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Proyectos expandidos */}
      {users
        .filter((u) => u.id === expandedUserId)
        .map((user) => (
          <div key={`projects-${user.id}`} className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
            <div className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">Proyectos de {user.email}</h3>
              {user.projects.length === 0 ? (
                <p className="text-gray-500">Sin proyectos asignados</p>
              ) : (
                <div className="grid gap-4">
                  {user.projects.map((project) => {
                    const storagePercent = getStoragePercentage(project.storage_used_gb, project.storage_limit_gb)
                    return (
                      <div key={project.id} className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{project.name}</h4>
                            <p className="text-sm text-gray-500">{project.slug}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => onToggleActivation(user.id, project.id, project.active)}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                project.active
                                  ? 'bg-green-100 text-green-800 hover:bg-red-100 hover:text-red-800'
                                  : 'bg-red-100 text-red-800 hover:bg-green-100 hover:text-green-800'
                              }`}
                            >
                              {project.active ? '✓ Activo' : '✗ Inactivo'}
                            </button>
                            <button
                              onClick={() => onEditStorageLimit(user.id, project.id, project.storage_limit_gb)}
                              className="px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                            >
                              Editar GB
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Último acceso</p>
                            <p className="font-medium">{new Date(project.last_access).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Storage</p>
                            <p className="font-medium">
                              {project.storage_used_gb.toFixed(2)} / {project.storage_limit_gb} GB
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Uso</p>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  storagePercent > 80 ? 'bg-red-500' : storagePercent > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(storagePercent, 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{storagePercent}%</p>
                          </div>
                        </div>
                      </div>
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
