import type { ToolConfig } from '@/components/ToolRunnerPage'
import { t, type Locale } from '@/lib/i18n'

// Config exportable: la usa la página del tool Y /strategy/plan (tab Plan).
// 2026-07-28: + selector de horizonte 30/60/90 — el prompt detalla solo hasta
// ahí y deja las fases posteriores como esbozo.
export const getActionPlanConfig = (locale: Locale): ToolConfig => ({
  slug: 'action-plan',
  icon: '📅',
  title: t('toolkit.action-plan.title', locale),
  timing: t('toolkit.action-plan.timing', locale),
  brandBrainNote: t('toolkit.action-plan.brand-brain-note', locale),
  submitButtonColor: '#34D399',
  submitButtonText: t('toolkit.action-plan.submit', locale),
  fields: [
    {
      name: 'horizonte',
      label: t('toolkit.action-plan.field-horizon-label', locale),
      type: 'select',
      hint: t('toolkit.action-plan.field-horizon-hint', locale),
      options: [
        { value: '30', label: t('toolkit.action-plan.field-horizon-30', locale) },
        { value: '60', label: t('toolkit.action-plan.field-horizon-60', locale) },
        { value: '90', label: t('toolkit.action-plan.field-horizon-90', locale) },
      ],
      defaultValue: '90',
      required: true,
    },
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
