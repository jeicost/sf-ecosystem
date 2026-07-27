'use client'

// Contactos promovidos desde el pipeline al SF CRM — vista de solo lectura
// sobre crm_contacts (workspace del cliente activo). Vivía como página propia
// en /comercial/crm; al ser un espejo del pipeline sin acciones propias, ahora
// es una pestaña dentro de Pipeline.

import { useEffect, useState } from 'react'
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

export default function CrmContactsPanel({ onGoToPipeline }: { onGoToPipeline?: () => void }) {
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

  if (error) {
    return <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
  }
  if (!data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={18} className="animate-spin text-ink-muted" />
      </div>
    )
  }
  if (!data.workspace) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface py-12 text-center">
        <p className="mb-1 text-sm text-ink-secondary">Este cliente aún no tiene workspace en el CRM.</p>
        <p className="text-xs text-ink-tertiary">
          Pide a tu contacto de Startup Factory que active el puente para poder promover leads.
        </p>
      </div>
    )
  }
  if (data.contacts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface py-12 text-center">
        <p className="mb-1 text-sm text-ink-secondary">Aún no hay contactos promovidos.</p>
        <p className="mb-4 text-xs text-ink-tertiary">
          Usa «Enviar a CRM» en un lead cualificado del pipeline — aparecerá aquí al momento.
        </p>
        {onGoToPipeline && (
          <button
            onClick={onGoToPipeline}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/15 px-4 py-2 text-xs font-medium text-red-400"
          >
            Ver el pipeline <ArrowRight size={12} />
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-tertiary">
          {data.contacts.length} contactos · workspace {data.workspace}
        </p>
        <a
          href={SF_CRM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-ink-secondary transition hover:bg-surface-hover hover:text-ink"
        >
          Abrir SF CRM <ExternalLink size={12} />
        </a>
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
  )
}
