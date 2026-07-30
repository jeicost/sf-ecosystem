import type { ToolConfig } from '@/components/ToolRunnerPage'
import { t, type Locale } from '@/lib/i18n'

// Config exportada (la reutiliza Strategy si hiciera falta y evita drift).
export const getBrandBookConfig = (locale: Locale): ToolConfig => ({
  slug: 'brand-book',
  icon: '📕',
  title: t('toolkit.brand-book.title', locale),
  subtitle: t('toolkit.brand-book.subtitle', locale),
  timing: t('toolkit.brand-book.timing', locale),
  brandBrainNote: t('toolkit.brand-book.brand-brain-note', locale),
  fields: [
    {
      name: 'mode',
      label: t('toolkit.brand-book.field.mode.label', locale),
      type: 'select',
      required: true,
      defaultValue: 'full',
      options: [
        { value: 'full', label: t('toolkit.brand-book.field.mode.option.full', locale) },
        { value: 'audit', label: t('toolkit.brand-book.field.mode.option.audit', locale) },
      ],
    },
    {
      name: 'notas_diseno',
      label: t('toolkit.brand-book.field.notas-diseno.label', locale),
      type: 'textarea',
      placeholder: t('toolkit.brand-book.field.notas-diseno.placeholder', locale),
    },
  ],
  submitButtonText: t('toolkit.brand-book.submit', locale),
  submitButtonColor: '#8B5CF6',
})
