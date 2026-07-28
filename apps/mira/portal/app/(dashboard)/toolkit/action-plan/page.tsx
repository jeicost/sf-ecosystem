'use client'

import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'
import { getStoredProjectId } from '@/lib/project-context'
import { t, type Locale } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'
import { ActionPlanResult } from './action-plan-result'

const getToolConfig = (locale: Locale): ToolConfig => ({
  slug: 'action-plan',
  icon: '📅',
  title: t('toolkit.action-plan.title', locale),
  subtitle: 'Salsa Burgers',
  timing: t('toolkit.action-plan.timing', locale),
  brandBrainNote: t('toolkit.action-plan.brand-brain-note', locale),
  submitButtonColor: '#34D399',
  submitButtonText: t('toolkit.action-plan.submit', locale),
  fields: [
    {
      name: 'objetivo_trimestral',
      label: t('toolkit.action-plan.field-goal-label', locale),
      type: 'text',
      placeholder: t('toolkit.action-plan.field-goal-placeholder', locale),
      required: true,
    },
    {
      name: 'recursos_actuales',
      label: t('toolkit.action-plan.field-resources-label', locale),
      type: 'textarea',
      placeholder: t('toolkit.action-plan.field-resources-placeholder', locale),
      required: true,
    },
    {
      name: 'desafios_criticos',
      label: t('toolkit.action-plan.field-challenges-label', locale),
      type: 'textarea',
      placeholder: t('toolkit.action-plan.field-challenges-placeholder', locale),
      required: true,
    },
    {
      name: 'metricas_exito',
      label: t('toolkit.action-plan.field-metrics-label', locale),
      type: 'textarea',
      placeholder: t('toolkit.action-plan.field-metrics-placeholder', locale),
      required: true,
    },
    {
      name: 'presupuesto_disponible',
      label: t('toolkit.action-plan.field-budget-label', locale),
      type: 'textarea',
      placeholder: t('toolkit.action-plan.field-budget-placeholder', locale),
      required: true,
    },
    {
      name: 'equipo_roles',
      label: t('toolkit.action-plan.field-team-label', locale),
      type: 'textarea',
      placeholder: t('toolkit.action-plan.field-team-placeholder', locale),
      required: true,
    },
  ],
})

export default function ActionPlanPage() {
  const { locale } = useLocaleContext()
  const toolConfig = getToolConfig(locale)

  const handleGenerate = async (formData: Record<string, any>, attachments?: any[]) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'action-plan',
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
      resultComponent={ActionPlanResult}
    />
  )
}
