import type { ToolConfig } from '@/components/ToolRunnerPage'
import { t, type Locale } from '@/lib/i18n'

// Config exportada del Monthly Content System (Business Reports).
// El mes por defecto lo fija la página (mes siguiente) — aquí solo el shape.
export const getMonthlyConfig = (locale: Locale): ToolConfig => ({
  slug: 'monthly-content-system',
  icon: '📆',
  title: t('toolkit.monthly-content-system.title', locale),
  subtitle: t('toolkit.monthly-content-system.subtitle', locale),
  timing: t('toolkit.monthly-content-system.timing', locale),
  brandBrainNote: t('toolkit.monthly-content-system.brand-brain-note', locale),
  fields: [
    {
      name: 'mes',
      label: t('toolkit.monthly-content-system.field.mes.label', locale),
      type: 'month',
      required: true,
    },
    {
      name: 'posts_por_pilar',
      label: t('toolkit.monthly-content-system.field.posts-por-pilar.label', locale),
      type: 'select',
      required: true,
      defaultValue: '4',
      options: [
        { value: '3', label: t('toolkit.monthly-content-system.field.posts-por-pilar.option.3', locale) },
        { value: '4', label: t('toolkit.monthly-content-system.field.posts-por-pilar.option.4', locale) },
        { value: '5', label: t('toolkit.monthly-content-system.field.posts-por-pilar.option.5', locale) },
      ],
    },
    {
      name: 'plataformas',
      label: t('toolkit.monthly-content-system.field.plataformas.label', locale),
      type: 'multicheck',
      required: true,
      defaultValue: ['instagram'],
      options: [
        { value: 'instagram', label: t('toolkit.monthly-content-system.field.plataformas.option.instagram', locale) },
        { value: 'tiktok', label: t('toolkit.monthly-content-system.field.plataformas.option.tiktok', locale) },
        { value: 'linkedin', label: t('toolkit.monthly-content-system.field.plataformas.option.linkedin', locale) },
        { value: 'facebook', label: t('toolkit.monthly-content-system.field.plataformas.option.facebook', locale) },
      ],
    },
    {
      name: 'include_reels',
      label: t('toolkit.monthly-content-system.field.include-reels.label', locale),
      type: 'select',
      required: true,
      defaultValue: 'yes',
      options: [
        { value: 'yes', label: t('toolkit.monthly-content-system.field.include-reels.option.yes', locale) },
        { value: 'no', label: t('toolkit.monthly-content-system.field.include-reels.option.no', locale) },
      ],
    },
  ],
  submitButtonText: t('toolkit.monthly-content-system.submit', locale),
  submitButtonColor: '#22D3EE',
})
