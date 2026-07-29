'use client'

import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'
import { getStoredProjectId } from '@/lib/project-context'
import { t, type Locale } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'
import { SeoAuditResult } from './seo-audit-result'

const getToolConfig = (locale: Locale): ToolConfig => ({
  slug: 'seo-audit',
  icon: '🔍',
  title: t('toolkit.seo.title', locale),
  timing: t('toolkit.seo.timing', locale),
  brandBrainNote: t('toolkit.seo.brand-brain-note', locale),
  submitButtonColor: '#F87171',
  submitButtonText: t('toolkit.seo.submit', locale),
  fields: [
    {
      name: 'url_sitio',
      label: t('toolkit.seo.field-url-label', locale),
      type: 'text',
      placeholder: t('toolkit.seo.field-url-placeholder', locale),
      required: true,
    },
    {
      name: 'palabras_clave_objetivo',
      label: t('toolkit.seo.field-keywords-label', locale),
      type: 'textarea',
      placeholder: t('toolkit.seo.field-keywords-placeholder', locale),
      hint: t('toolkit.seo.field-keywords-hint', locale),
      required: true,
    },
    {
      name: 'competidores_top_3',
      label: t('toolkit.seo.field-competitors-label', locale),
      type: 'textarea',
      placeholder: t('toolkit.seo.field-competitors-placeholder', locale),
      hint: t('toolkit.seo.field-competitors-hint', locale),
      required: true,
    },
    {
      name: 'ubicacion_objetivo',
      label: t('toolkit.seo.field-location-label', locale),
      type: 'text',
      placeholder: t('toolkit.seo.field-location-placeholder', locale),
      hint: t('toolkit.seo.field-location-hint', locale),
      required: true,
    },
    {
      name: 'audito_tipo',
      label: t('toolkit.seo.field-audit-type-label', locale),
      type: 'select',
      options: [
        { value: 'full', label: t('toolkit.seo.field-audit-type-full', locale) },
        { value: 'competitive', label: t('toolkit.seo.field-audit-type-competitive', locale) },
        { value: 'technical', label: t('toolkit.seo.field-audit-type-technical', locale) },
      ],
      required: true,
    },
    {
      name: 'historial_trafico',
      label: t('toolkit.seo.field-traffic-label', locale),
      type: 'textarea',
      placeholder: t('toolkit.seo.field-traffic-placeholder', locale),
    },
  ],
})

export default function SeoAuditPage() {
  const { locale } = useLocaleContext()
  const toolConfig = getToolConfig(locale)

  const handleGenerate = async (formData: Record<string, any>, attachments?: any[]) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'seo-audit',
        input_data: formData,
        attachments,
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
      resultComponent={SeoAuditResult}
    />
  )
}
