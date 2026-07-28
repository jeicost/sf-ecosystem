'use client'

import { useMemo } from 'react'
import ToolRunnerPage from '@/components/ToolRunnerPage'
import { getStoredProjectId } from '@/lib/project-context'
import { MONTHLY_CONFIG } from './tool-config'

function MonthlyResult({ data }: { data?: any }) {
  if (!data) return null
  const pillars = Array.isArray(data.pillars) ? data.pillars.length : 0
  const captions = Array.isArray(data.captions) ? data.captions.length : 0
  return (
    <div className="card p-6 space-y-3">
      <h3 className="text-lg font-semibold text-ink">
        {data.meta?.month_label ? `Sistema de ${data.meta.month_label} generado` : 'Sistema mensual generado'}
      </h3>
      <p className="text-sm text-ink-secondary">
        {pillars} pilares · {captions} captions listos · tablero semanal, hero briefs, calendario e idea bank.
      </p>
      <p className="text-xs text-ink-tertiary">
        Abre el informe completo para verlo, exportarlo a Google Slides en tu Drive, y enviar los captions a la Cola de Aprobación.
      </p>
    </div>
  )
}

export default function MonthlyContentSystemPage() {
  // Mes siguiente como default (el sistema del mes se prepara antes de que empiece)
  const config = useMemo(() => {
    const next = new Date()
    next.setMonth(next.getMonth() + 1)
    const defaultMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
    return {
      ...MONTHLY_CONFIG,
      fields: MONTHLY_CONFIG.fields.map((f) => (f.name === 'mes' ? { ...f, defaultValue: defaultMonth } : f)),
    }
  }, [])

  const handleGenerate = async (formData: Record<string, any>, attachments?: any[]) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'monthly-content-system',
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
      config={config}
      onGenerate={handleGenerate}
      resultComponent={MonthlyResult}
    />
  )
}
