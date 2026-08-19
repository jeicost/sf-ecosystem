'use client'

// Panel de agencia de Tools: quién tiene abierto qué módulo de operativa, y las
// peticiones que llegan del marketplace.
//
// Esto sustituye a editar dos Set<string> de UUIDs en lib/entitlements.ts y
// desplegar: dar acceso a un cliente pasa de ser un commit a ser un clic.

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Check } from 'lucide-react'
import { PER_CLIENT_TOOLS, toolLabel } from '@/lib/tools/catalog'
import { BILLING_PLANS, billingPlan } from '@/lib/billing/plans'

interface AdminClient {
  id: string
  name: string
  slug: string | null
  plan: string | null
  primary_color: string | null
}
interface ClientTool { client_id: string; tool_id: string; enabled: boolean }
interface ToolRequest {
  id: string
  client_id: string
  tool_id: string
  message: string | null
  status: string
  created_at: string
}

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-amber-500/15 text-amber-400',
  contacted: 'bg-sky-500/15 text-sky-400',
  enabled: 'bg-emerald-500/15 text-emerald-400',
  declined: 'bg-line text-ink-tertiary',
}

export default function AdminToolsPage() {
  const [clients, setClients] = useState<AdminClient[]>([])
  const [clientTools, setClientTools] = useState<ClientTool[]>([])
  const [requests, setRequests] = useState<ToolRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/tools')
      if (!res.ok) throw new Error('No se pudo cargar')
      const data = await res.json()
      setClients(data.clients || [])
      setClientTools(data.clientTools || [])
      setRequests(data.requests || [])
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const isOn = (clientId: string, toolId: string) =>
    clientTools.some((r) => r.client_id === clientId && r.tool_id === toolId && r.enabled)

  const toggle = async (clientId: string, toolId: string, enabled: boolean) => {
    const key = `${clientId}:${toolId}`
    setBusy(key)
    try {
      const res = await fetch('/api/admin/tools', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, toolId, enabled }),
      })
      if (!res.ok) throw new Error('No se pudo guardar')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setBusy(null)
    }
  }

  const setPlan = async (clientId: string, plan: string) => {
    setBusy(`plan:${clientId}`)
    try {
      const res = await fetch('/api/admin/client-plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, plan }),
      })
      if (!res.ok) throw new Error('No se pudo cambiar el plan')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setBusy(null)
    }
  }

  const setStatus = async (id: string, status: string) => {
    setBusy(id)
    try {
      await fetch('/api/admin/tools', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      await load()
    } finally {
      setBusy(null)
    }
  }

  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? id
  const openRequests = requests.filter((r) => r.status === 'new')

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 justify-center text-sm text-ink-tertiary">
        <Loader2 size={16} className="animate-spin" /> Cargando…
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-ink-muted">Agency</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Tools por cliente</h1>
          <p className="mt-2 text-sm text-ink-tertiary">
            Reports, Documents y Visual Studio entran con cualquier plan de pago: lo único que
            cambia entre planes es el volumen, y eso se ajusta en la columna «Plan (marca)» —
            de ahí salen las imágenes al mes y los asientos. Los interruptores son solo para
            los módulos de operativa.
          </p>
        </div>
        <Link href="/admin" className="rounded-lg border border-line px-3 py-2 text-xs text-ink-tertiary hover:bg-surface-hover">
          ← Admin
        </Link>
      </div>

      {error && <p className="mb-4 text-xs" style={{ color: '#f87171' }}>{error}</p>}

      {/* Peticiones */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-ink mb-3">
          Peticiones {openRequests.length > 0 && (
            <span className="ml-1.5 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
              {openRequests.length}
            </span>
          )}
        </h2>
        {requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-subtle bg-surface py-8 text-center text-xs text-ink-tertiary">
            Nadie ha pedido ningún módulo todavía.
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="rounded-xl border border-line bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-ink">
                      <span className="font-medium">{clientName(r.client_id)}</span>
                      <span className="text-ink-muted"> pide </span>
                      <span className="font-medium">{toolLabel(r.tool_id)}</span>
                    </p>
                    {r.message && <p className="mt-1.5 text-xs text-ink-tertiary">{r.message}</p>}
                    <p className="mt-1.5 text-[10px] text-ink-muted">
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[r.status] ?? ''}`}>
                      {r.status}
                    </span>
                    {r.status === 'new' && (
                      <>
                        <button onClick={() => setStatus(r.id, 'contacted')} disabled={busy === r.id}
                          className="rounded-lg border border-line px-2.5 py-1 text-[11px] text-ink-secondary hover:bg-surface-hover disabled:opacity-50">
                          Contactado
                        </button>
                        <button onClick={() => setStatus(r.id, 'declined')} disabled={busy === r.id}
                          className="rounded-lg border border-line px-2.5 py-1 text-[11px] text-ink-tertiary hover:bg-surface-hover disabled:opacity-50">
                          Descartar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Matriz cliente × módulo */}
      <section>
        <h2 className="text-sm font-semibold text-ink mb-3">Módulos habilitados</h2>
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface">
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest font-semibold text-ink-muted">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest font-semibold text-ink-muted">
                  Plan (marca)
                </th>
                {PER_CLIENT_TOOLS.map((tool) => (
                  <th key={tool.id} className="px-4 py-3 text-left text-[10px] uppercase tracking-widest font-semibold text-ink-muted">
                    {tool.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-line-subtle last:border-0">
                  <td className="px-4 py-3">
                    <span className="text-ink">{c.name}</span>
                  </td>
                  {/* El tier de la MARCA: de aquí salen sus asientos y sus imágenes
                      al mes. No se podía tocar desde ninguna pantalla, así que
                      todas arrastraban el 'starter' por defecto. */}
                  <td className="px-4 py-3">
                    <select
                      value={c.plan ?? 'starter'}
                      disabled={busy === `plan:${c.id}`}
                      onChange={(e) => setPlan(c.id, e.target.value)}
                      className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink outline-none disabled:opacity-50"
                    >
                      {Object.values(BILLING_PLANS).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {p.images} img · {p.seats} pers.
                        </option>
                      ))}
                    </select>
                  </td>
                  {PER_CLIENT_TOOLS.map((tool) => {
                    const on = isOn(c.id, tool.id)
                    const key = `${c.id}:${tool.id}`
                    return (
                      <td key={tool.id} className="px-4 py-3">
                        <button
                          onClick={() => toggle(c.id, tool.id, !on)}
                          disabled={busy === key}
                          className={`flex h-6 w-11 items-center rounded-full px-0.5 transition-colors disabled:opacity-50 ${
                            on ? 'bg-emerald-500/70 justify-end' : 'bg-line justify-start'
                          }`}
                          aria-label={`${on ? 'Quitar' : 'Dar'} ${tool.name} a ${c.name}`}
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white">
                            {on && <Check size={11} className="text-emerald-600" />}
                          </span>
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
