'use client'

// Super Admin — visión de agencia: todos los clientes, entregables y consumo.
// Lenguaje visual de ai-agency-sf-next (StatCards + ClientCards) adaptado a MIRA.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActiveClient } from '@/lib/client-context'

interface ClientOverview {
  id: string
  name: string
  slug: string
  logo_url: string | null
  primary_color: string | null
  status: string
  reports: number
  documents: number
  last_deliverable: string | null
  drive_folders: number
  drive_docs: number
  usage_tokens: number
  usage_cost_usd: number
  own_key: boolean
}

interface Overview {
  clients: ClientOverview[]
  totals: { clients: number; reports: number; documents: number; usage_cost_usd: number }
}

function StatCard({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-5">
      <p
        className="text-3xl font-extrabold tracking-tight"
        style={{ color: accent ? 'var(--client-primary, #8B5CF6)' : '#fff' }}
      >
        {value}
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">{label}</p>
    </div>
  )
}

export default function SuperAdminPage() {
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { setActiveClient } = useActiveClient()
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/overview')
      .then(async (r) => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.error || 'Error cargando overview')
        setData(json)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }, [])

  function openClient(c: ClientOverview) {
    setActiveClient({
      id: c.id,
      name: c.name,
      slug: c.slug,
      logoUrl: c.logo_url,
      primaryColor: c.primary_color,
    })
    // Entra a la home del cliente tal y como él la ve
    router.push('/home')
  }

  if (error) {
    return <div className="p-8 text-red-400 text-sm">{error}</div>
  }
  if (!data) {
    return <div className="p-8 text-gray-500 text-sm">Cargando visión de agencia…</div>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-violet-400">
            Buenos días, equipo 👋
          </p>
          <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-white">Clientes y Operaciones</h1>
          <p className="mt-2 text-sm text-gray-500">Gestión unificada de todos los clientes y su progreso en MIRA</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Link href="/toolkit"
            className="rounded-xl bg-violet-600 px-4 py-2.5 font-semibold text-white transition hover:bg-violet-500">
            + Generar entregable
          </Link>
          <Link href="/admin/users" className="rounded-lg border border-gray-800 px-3 py-2 text-gray-400 hover:bg-white/5">
            👥 Usuarios
          </Link>
          <Link href="/admin/facturacion" className="rounded-lg border border-gray-800 px-3 py-2 text-gray-500 hover:bg-white/5">
            💶 Facturación
          </Link>
          <Link href="/admin/sistema" className="rounded-lg border border-gray-800 px-3 py-2 text-gray-500 hover:bg-white/5">
            ⚙️ Sistema
          </Link>
        </div>
      </div>

      {/* StatCards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard value={String(data.totals.clients)} label="Clientes activos" accent />
        <StatCard value={String(data.totals.reports)} label="Informes generados" />
        <StatCard value={String(data.totals.documents)} label="Documentos" />
        <StatCard value={`$${data.totals.usage_cost_usd.toFixed(2)}`} label="Consumo IA este mes" />
      </div>

      {/* Client grid */}
      <div>
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
          Espacios activos · Clientes
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.clients.map((c) => {
            const color = c.primary_color || '#8B5CF6'
            return (
              <button
                key={c.id}
                onClick={() => openClient(c)}
                className="group rounded-xl border border-gray-800 bg-gray-900/70 p-5 text-left transition hover:-translate-y-0.5 hover:border-gray-700 hover:shadow-lg"
                style={{ boxShadow: `inset 0 3px 0 0 ${color}` }}
              >
                <div className="flex items-center gap-3">
                  {c.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.logo_url} alt={c.name} className="h-9 w-9 rounded-lg bg-white/5 object-contain p-1" />
                  ) : (
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold"
                      style={{ background: `${color}26`, color }}
                    >
                      {c.name[0]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white group-hover:text-white">{c.name}</p>
                    <p className="flex items-center gap-1.5 text-[10px] text-gray-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Activo
                      {c.own_key && <span className="ml-1 rounded bg-emerald-500/15 px-1.5 text-emerald-400">BYO key</span>}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-white">{c.reports}</p>
                    <p className="font-mono text-[9px] uppercase text-gray-500">Informes</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{c.documents}</p>
                    <p className="font-mono text-[9px] uppercase text-gray-500">Docs</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{c.drive_docs}</p>
                    <p className="font-mono text-[9px] uppercase text-gray-500">Drive</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-800 pt-3 text-[10px] text-gray-500">
                  <span>
                    {c.last_deliverable
                      ? `Último: ${new Date(c.last_deliverable).toLocaleDateString('es-ES')}`
                      : 'Sin entregables'}
                  </span>
                  <span style={{ color }}>
                    {c.usage_cost_usd > 0 ? `$${c.usage_cost_usd.toFixed(2)} IA/mes` : '—'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
