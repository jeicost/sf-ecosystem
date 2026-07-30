import type { ToolConfig } from '@/components/ToolRunnerPage'
import { t, type Locale } from '@/lib/i18n'

// Config exportable: la usa la página del tool Y /strategy/plan (tab Competencia).
// Fusión con la quick action analizar_competencia (2026-07-28): focus +
// vulnerabilidades + profundidad. Brain-first: fuera tu_proposicion y
// mercado_posicion — el Brand Brain ya lo sabe y entra server-side.
export const getCompetitiveConfig = (locale: Locale): ToolConfig => ({
  slug: 'competitive-analysis',
  icon: '⚔️',
  title: t('toolkit.competitive-analysis.title', locale),
  timing: t('toolkit.competitive-analysis.timing', locale),
  brandBrainNote: t('toolkit.competitive-analysis.brand-brain-note', locale),
  submitButtonColor: '#EC4899',
  submitButtonText: t('toolkit.competitive-analysis.submit', locale),
  fields: [
    {
      name: 'competidor_1',
      label: t('toolkit.competitive-analysis.field.competidor-1.label', locale),
      type: 'text',
      placeholder: t('toolkit.competitive-analysis.field.competidor-1.placeholder', locale),
      required: true,
    },
    {
      name: 'competidor_2',
      label: t('toolkit.competitive-analysis.field.competidor-2.label', locale),
      type: 'text',
      placeholder: t('toolkit.competitive-analysis.field.competidor-2.placeholder', locale),
      required: false,
    },
    {
      name: 'competidor_3',
      label: t('toolkit.competitive-analysis.field.competidor-3.label', locale),
      type: 'text',
      placeholder: t('toolkit.competitive-analysis.field.competidor-3.placeholder', locale),
      required: false,
    },
    {
      name: 'focus',
      label: t('toolkit.competitive-analysis.field.focus.label', locale),
      type: 'select',
      hint: t('toolkit.competitive-analysis.field.focus.hint', locale),
      options: [
        { value: 'todo', label: t('toolkit.competitive-analysis.field.focus.option.todo', locale) },
        { value: 'pricing', label: t('toolkit.competitive-analysis.field.focus.option.pricing', locale) },
        { value: 'features', label: t('toolkit.competitive-analysis.field.focus.option.features', locale) },
        { value: 'positioning', label: t('toolkit.competitive-analysis.field.focus.option.positioning', locale) },
      ],
      defaultValue: 'todo',
      required: true,
    },
    {
      name: 'vulnerabilidades',
      label: t('toolkit.competitive-analysis.field.vulnerabilidades.label', locale),
      type: 'textarea',
      placeholder: t('toolkit.competitive-analysis.field.vulnerabilidades.placeholder', locale),
      hint: t('toolkit.competitive-analysis.field.vulnerabilidades.hint', locale),
      required: false,
    },
    {
      name: 'profundidad',
      label: t('toolkit.competitive-analysis.field.profundidad.label', locale),
      type: 'select',
      hint: t('toolkit.competitive-analysis.field.profundidad.hint', locale),
      options: [
        { value: 'deep', label: t('toolkit.competitive-analysis.field.profundidad.option.deep', locale) },
        { value: 'quick', label: t('toolkit.competitive-analysis.field.profundidad.option.quick', locale) },
      ],
      defaultValue: 'deep',
      required: true,
    },
  ],
})
