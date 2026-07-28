'use client'

import ToolRunnerPage from '@/components/ToolRunnerPage'
import { getStoredProjectId } from '@/lib/project-context'
import { BRAND_BOOK_CONFIG } from './tool-config'

function BrandBookResult({ data }: { data?: any }) {
  if (!data) return null
  const findings = Array.isArray(data.consistency_findings) ? data.consistency_findings.length : 0
  const openItems = Array.isArray(data.open_items) ? data.open_items.length : 0
  return (
    <div className="card p-6 space-y-3">
      <h3 className="text-lg font-semibold text-ink">Brand Book generado</h3>
      <p className="text-sm text-ink-secondary">
        {findings > 0
          ? `${findings} hallazgo${findings > 1 ? 's' : ''} de consistencia detectado${findings > 1 ? 's' : ''} — revísalos en el informe.`
          : 'Sin contradicciones detectadas en el material analizado.'}
        {openItems > 0 && ` ${openItems} open item${openItems > 1 ? 's' : ''} pendientes, numerados al cierre.`}
      </p>
      <p className="text-xs text-ink-tertiary">
        Abre el informe completo para verlo maquetado y exportar el Voice Guide (1 página A4) a tu Drive.
      </p>
    </div>
  )
}

export default function BrandBookPage() {
  const handleGenerate = async (formData: Record<string, any>, attachments?: any[]) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'brand-book',
        input_data: formData,
        attachments,
        project_id: getStoredProjectId(),
      }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to generate')
    }
    return res.json()
  }

  return (
    <ToolRunnerPage
      config={BRAND_BOOK_CONFIG}
      onGenerate={handleGenerate}
      resultComponent={BrandBookResult}
    />
  )
}
