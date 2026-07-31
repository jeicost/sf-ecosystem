'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@sf/supabase'
import UserManagementTable from '@/components/admin/UserManagementTable'
import StorageLimitModal from '@/components/admin/StorageLimitModal'

interface UserWithProjects {
  id: string
  email: string
  company_name: string
  subscription_tier: 'starter' | 'growth' | 'scale' | 'enterprise'
  subscription_status: 'active' | 'paused' | 'cancelled'
  created_at: string
  projects: {
    id: string
    name: string
    slug: string
    status: string
    storage_used_gb: number
    storage_limit_gb: number
    last_access: string
    active: boolean
  }[]
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithProjects[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUserProject, setSelectedUserProject] = useState<{
    userId: string
    projectId: string
  } | null>(null)
  const [currentLimit, setCurrentLimit] = useState(10)

  const supabase = createBrowserSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('mira_users')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      const usersWithProjects = await Promise.all(
        (usersData || []).map(async (user) => {
          const { data: projectsData, error: projectsError } = await supabase
            .from('mira_project_access')
            .select(`
              project_id,
              mira_projects(id, name, slug, status),
              storage_limits(storage_used_gb, storage_limit_gb, last_access),
              user_project_status(active, deactivated_at)
            `)
            .eq('user_id', user.id)

          if (projectsError) throw projectsError

          const projects = (projectsData || []).map((access: any) => ({
            id: access.project_id,
            name: access.mira_projects?.name || 'Unknown',
            slug: access.mira_projects?.slug || '',
            status: access.mira_projects?.status || 'active',
            storage_used_gb: access.storage_limits?.[0]?.storage_used_gb || 0,
            storage_limit_gb: access.storage_limits?.[0]?.storage_limit_gb || 10,
            last_access: access.storage_limits?.[0]?.last_access || user.created_at,
            active: access.user_project_status?.[0]?.active ?? true,
          }))

          return {
            ...user,
            projects,
          }
        })
      )

      setUsers(usersWithProjects)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleUserActivation(userId: string, projectId: string, active: boolean) {
    try {
      const { error } = await supabase
        .from('user_project_status')
        .upsert({
          user_id: userId,
          project_id: projectId,
          active: !active,
          deactivated_at: active ? new Date().toISOString() : null,
          deactivation_reason: active ? 'Deactivated by super admin' : null,
        })

      if (error) throw error

      fetchUsers()
    } catch (error) {
      console.error('Error toggling user activation:', error)
    }
  }

  async function updateStorageLimit(userId: string, projectId: string, newLimit: number) {
    try {
      const { error } = await supabase
        .from('storage_limits')
        .update({ storage_limit_gb: newLimit })
        .eq('user_id', userId)
        .eq('project_id', projectId)

      if (error) throw error

      setSelectedUserProject(null)
      fetchUsers()
    } catch (error) {
      console.error('Error updating storage limit:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin">⏳</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🔐 Super Admin — Gestión de Usuarios</h1>
        <p className="text-ink-tertiary mt-2">
          Total de usuarios: {users.length} | Proyectos activos: {users.reduce((sum, u) => sum + u.projects.length, 0)}
        </p>
      </div>

      <UserManagementTable
        users={users}
        onToggleActivation={toggleUserActivation}
        onEditStorageLimit={(userId, projectId, limit) => {
          setSelectedUserProject({ userId, projectId })
          setCurrentLimit(limit)
        }}
      />

      {selectedUserProject && (
        <StorageLimitModal
          isOpen={true}
          currentLimit={currentLimit}
          onClose={() => setSelectedUserProject(null)}
          onSave={(newLimit) =>
            updateStorageLimit(selectedUserProject.userId, selectedUserProject.projectId, newLimit)
          }
        />
      )}
    </div>
  )
}
