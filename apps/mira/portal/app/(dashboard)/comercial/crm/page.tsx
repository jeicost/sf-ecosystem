'use client'

// CRM — contactos promovidos desde el pipeline de MIRA al SF CRM.
// Lectura sobre crm_contacts (workspace del cliente activo) + acceso al CRM completo.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, ExternalLink, ArrowRight } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'

const SF_CRM_URL = 'https://sf-crm-phi.vercel.app'

interface CrmContact {
  id: string
  first_name: string | null
  last_name: string | null
  company_name: string | null
  title: string | null
  email: string | null
  hot_score: number | null
  source: string | null
  stage: string | null
  created_at: string
}

interface CrmData {
  workspace: string | null
  contacts: CrmContact[]
}

function scoreColor(score: number | null): string {
  if (score == null) return '#666'
  if (score >= 75) return '#f87171'
  if (score >= 50) return '#fbbf24'
  return '#4ade80'
}

export default function CrmPage() {
  const { activeClient } = useActiveClient()
  const [data, setData] = useState<CrmData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const qs = activeClient?.id ? `?clientId=${activeClient.id}` : ''
    fetch(`/api/comercial/crm${qs}`)
      .then(async (r) => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.error || 'Error cargando CRM')
        setData(json)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }, [activeClient?.id])

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-red-400">MIRA Sales</p>
          <h1 className="mt-1 text-3xl font-bold text-ink">CRM</h1>
          <p className="mt-2 max-w-xl text-sm text-ink-tertiary">
            Contactos promovidos desde tu pipeline. Cada lead que envías a CRM desde{' '}
            <Link href="/comercial/pipeline" className="text-red-400 hover:underline">Pipeline</Link>{' '}
            aparece aquí y en el SF CRM completo.
          </p>
        </div>
        <a
          href={SF_CRM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
        >
          Abrir SF CRM <ExternalLink size={14} />
        </a>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
      ) : !data ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={18} className="animate-spin text-ink-muted" />
        </div>
      ) : !data.workspace ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface py-12 text-center">
          <p className="mb-1 text-sm text-ink-secondary">Este cliente aún no tiene workspace en el CRM.</p>
          <p className="text-xs text-ink-tertiary">
            Pide a tu contacto de Startup Factory que active el puente para poder promover leads.
          </p>
        </div>
      ) : data.contacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface py-12 text-center">
          <p className="mb-1 text-sm text-ink-secondary">Aún no hay contactos promovidos.</p>
          <p className="mb-4 text-xs text-ink-tertiary">
            Ve a tu pipeline y usa «Enviar a CRM» en un lead cualificado — aparecerá aquí al momento.
          </p>
          <Link
            href="/comercial/pipeline"
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/15 px-4 py-2 text-xs font-medium text-red-400"
          >
            Ir al Pipeline <ArrowRight size={12} />
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-tertiary">
              {data.contacts.length} contactos · workspace {data.workspace}
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-surface font-mono text-[9px] uppercase tracking-[0.15em] text-ink-tertiary">
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Etapa</th>
                  <th className="px-4 py-3">Origen</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {data.contacts.map((c) => (
                  <tr key={c.id} className="border-b border-line-subtle transition hover:bg-surface-hover">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">
                        {[c.first_name, c.last_name].filter(Boolean).join(' ') || '—'}
                      </p>
                      {c.title && <p className="text-[11px] text-ink-tertiary">{c.title}</p>}
                    </td>
                    <td className="px-4 py-3 text-ink-secondary">{c.company_name || '—'}</td>
                    <td className="px-4 py-3 text-ink-secondary">{c.email || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2 py-0.5 font-mono text-[10px] font-bold"
                        style={{ color: scoreColor(c.hot_score), background: `${scoreColor(c.hot_score)}18` }}
                      >
                        {c.hot_score ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-secondary">{c.stage || '—'}</td>
                    <td className="px-4 py-3 text-ink-tertiary">{c.source || '—'}</td>
                    <td className="px-4 py-3 text-ink-tertiary">
                      {new Date(c.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
