'use client'

import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'
import { getStoredProjectId } from '@/lib/project-context'
import { t, type Locale } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'
import { MarketingAuditResult } from './marketing-audit-result'

const getToolConfig = (locale: Locale): ToolConfig => ({
  slug: 'marketing-audit',
  icon: '📊',
  title: t('toolkit.marketing-audit.title', locale),
  subtitle: 'Salsa Burgers',
  timing: t('toolkit.marketing-audit.timing', locale),
  brandBrainNote: t('toolkit.marketing-audit.brand-brain-note', locale),
  submitButtonColor: '#60A5FA',
  submitButtonText: t('toolkit.marketing-audit.submit', locale),
  fields: [
    {
      name: 'url_sitio',
      label: t('toolkit.marketing-audit.field-url-label', locale),
      type: 'text',
      placeholder: t('toolkit.marketing-audit.field-url-placeholder', locale),
      required: true,
    },
    {
      name: 'canales_actuales',
      label: t('toolkit.marketing-audit.field-channels-label', locale),
      type: 'textarea',
      placeholder: t('toolkit.marketing-audit.field-channels-placeholder', locale),
      hint: t('toolkit.marketing-audit.field-channels-hint', locale),
      required: true,
    },
    {
      name: 'presupuesto_anual',
      label: t('toolkit.marketing-audit.field-budget-label', locale),
      type: 'text',
      placeholder: t('toolkit.marketing-audit.field-budget-placeholder', locale),
      hint: t('toolkit.marketing-audit.field-budget-hint', locale),
      required: true,
    },
    {
      name: 'metricas_clave',
      label: t('toolkit.marketing-audit.field-metrics-label', locale),
      type: 'textarea',
      placeholder: t('toolkit.marketing-audit.field-metrics-placeholder', locale),
      required: true,
    },
    {
      name: 'objetivos_trim',
      label: t('toolkit.marketing-audit.field-goals-label', locale),
      type: 'textarea',
      placeholder: t('toolkit.marketing-audit.field-goals-placeholder', locale),
      required: true,
    },
    {
      name: 'competencia_directa',
      label: t('toolkit.marketing-audit.field-competitors-label', locale),
      type: 'textarea',
      placeholder: t('toolkit.marketing-audit.field-competitors-placeholder', locale),
      required: true,
    },
    {
      name: 'recursos_team',
      label: t('toolkit.marketing-audit.field-resources-label', locale),
      type: 'textarea',
      placeholder: t('toolkit.marketing-audit.field-resources-placeholder', locale),
      required: true,
    },
  ],
})

export default function MarketingAuditPage() {
  const { locale } = useLocaleContext()
  const toolConfig = getToolConfig(locale)

  const handleGenerate = async (formData: Record<string, any>) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'marketing-audit',
        input_data: formData,
        project_id: getStoredProjectId(),
      }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to generate')
    }

    return await res.json()
  }

  return (
    <ToolRunnerPage
      config={toolConfig}
      onGenerate={handleGenerate}
      resultComponent={MarketingAuditResult}
    />
  )
}
