'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardList } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import StatRow from '@/components/ui/StatRow'

const PLAN_OPTIONS = ['consulta', 'starter', 'growth', 'scale', 'admin', 'super_admin'] as const
type Plan = (typeof PLAN_OPTIONS)[number]

const PLAN_LABEL: Record<Plan, string> = {
  consulta: 'Consulta (sin toolkit)',
  starter: 'Starter',
  growth: 'Growth',
  scale: 'Scale',
  admin: 'Admin (interno)',
  super_admin: 'Super Admin',
}

interface ClientUser {
  userId: string
  email: string
  role: string
  plan: string
}

interface ClientWithUsers {
  id: string
  name: string
  users: ClientUser[]
}

export default function AdminUsersPage() {
  const [clients, setClients] = useState<ClientWithUsers[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savingUserId, setSavingUserId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  function fetchData() {
    fetch('/api/admin/clients-users')
      .then(async (r) => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.error || 'Error cargando clientes y usuarios')
        setClients(json.clients)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }

  async function changePlan(userId: string, plan: string) {
    setSavingUserId(userId)
    setSaveError(null)
    try {
      const res = await fetch('/api/admin/users/plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plan }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al cambiar el plan')

      // Optimistic local update — no need to refetch everything.
      setClients((prev) =>
        prev
          ? prev.map((c) => ({
              ...c,
              users: c.users.map((u) => (u.userId === userId ? { ...u, plan } : u)),
            }))
          : prev
      )
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Error al cambiar el plan')
      fetchData() // revert to real state on failure
    } finally {
      setSavingUserId(null)
    }
  }

  if (error) {
    return <div className="p-8 text-sm text-red-400">{error}</div>
  }
  if (!clients) {
    return <div className="p-8 text-sm text-ink-tertiary">Cargando clientes y usuarios…</div>
  }

  const totalUsers = clients.reduce((sum, c) => sum + c.users.length, 0)

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Clientes y usuarios"
        subtitle="Qué clientes hay, quién tiene acceso a cada uno y con qué plan — edítalo directamente aquí."
        eyebrowColor="#6366F1"
      />

      <StatRow
        items={[
          { label: 'Clientes', value: clients.length },
          { label: 'Usuarios con acceso', value: totalUsers },
        ]}
      />

      {saveError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {saveError}
        </div>
      )}

      <div className="space-y-4">
        {clients.map((client) => (
          <div key={client.id} className="rounded-xl border border-line bg-card p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-semibold text-ink">{client.name}</p>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-tertiary">
                  {client.users.length} {client.users.length === 1 ? 'usuario' : 'usuarios'}
                </span>
                <Link
                  href={`/admin/questionnaires/new?clientId=${client.id}&clientName=${encodeURIComponent(client.name)}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-medium text-ink-secondary transition-colors hover:border-sky-500/40 hover:text-sky-400"
                >
                  <ClipboardList size={12} /> Crear informe de decisión
                </Link>
              </div>
            </div>

            {client.users.length === 0 ? (
              <p className="text-xs text-ink-tertiary">Sin usuarios con acceso todavía.</p>
            ) : (
              <div className="space-y-2">
                {client.users.map((u) => (
                  <div
                    key={u.userId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line-subtle bg-surface px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink">{u.email}</p>
                      <p className="text-[10px] uppercase tracking-wide text-ink-tertiary">rol: {u.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={u.plan}
                        disabled={savingUserId === u.userId}
                        onChange={(e) => changePlan(u.userId, e.target.value)}
                        className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-ink disabled:opacity-50"
                      >
                        {PLAN_OPTIONS.map((p) => (
                          <option key={p} value={p}>
                            {PLAN_LABEL[p]}
                          </option>
                        ))}
                      </select>
                      {savingUserId === u.userId && (
                        <span className="text-[10px] text-ink-tertiary">Guardando…</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
