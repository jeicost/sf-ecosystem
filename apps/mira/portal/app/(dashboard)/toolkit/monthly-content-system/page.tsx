'use client'

import { useMemo } from 'react'
import ToolRunnerPage from '@/components/ToolRunnerPage'
import { getStoredProjectId } from '@/lib/project-context'
import { getMonthlyConfig } from './tool-config'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'

function MonthlyResult({ data, locale }: { data?: any; locale: Locale }) {
  if (!data) return null
  const pillars = Array.isArray(data.pillars) ? data.pillars.length : 0
  const captions = Array.isArray(data.captions) ? data.captions.length : 0
  return (
    <div className="card p-6 space-y-3">
      <h3 className="text-lg font-semibold text-ink">
        {data.meta?.month_label
          ? t('toolkit.monthly-content-system.result.title-with-month', locale).replace('{month}', data.meta.month_label)
          : t('toolkit.monthly-content-system.result.title-default', locale)}
      </h3>
      <p className="text-sm text-ink-secondary">
        {t('toolkit.monthly-content-system.result.summary', locale)
          .replace('{pillars}', String(pillars))
          .replace('{captions}', String(captions))}
      </p>
      <p className="text-xs text-ink-tertiary">
        {t('toolkit.monthly-content-system.result.footer-note', locale)}
      </p>
    </div>
  )
}

export default function MonthlyContentSystemPage() {
  const { locale } = useLocaleContext()

  // Mes siguiente como default (el sistema del mes se prepara antes de que empiece)
  const config = useMemo(() => {
    const next = new Date()
    next.setMonth(next.getMonth() + 1)
    const defaultMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
    const base = getMonthlyConfig(locale)
    return {
      ...base,
      fields: base.fields.map((f) => (f.name === 'mes' ? { ...f, defaultValue: defaultMonth } : f)),
    }
  }, [locale])

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
      throw new Error(error.error || t('toolkit.report.generate-error-fallback', locale))
    }
    return res.json()
  }

  return (
    <ToolRunnerPage
      config={config}
      onGenerate={handleGenerate}
      resultComponent={(props: { data?: any }) => <MonthlyResult {...props} locale={locale} />}
    />
  )
}
