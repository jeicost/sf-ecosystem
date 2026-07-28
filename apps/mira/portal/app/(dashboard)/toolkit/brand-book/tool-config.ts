import type { ToolConfig } from '@/components/ToolRunnerPage'

// Config exportada (la reutiliza Strategy si hiciera falta y evita drift).
export const BRAND_BOOK_CONFIG: ToolConfig = {
  slug: 'brand-book',
  icon: '📕',
  title: 'Brand Book',
  subtitle: 'El manual maestro de marca, con auditoría de consistencia y Voice Guide de 1 página',
  timing: '~10 min',
  brandBrainNote: 'Este reporte se construye desde tu Brand Brain — no te pediremos lo que ya sabemos. Adjunta creatividades, brand books antiguos o auditorías: las contradicciones que encontremos son oro.',
  fields: [
    {
      name: 'mode',
      label: 'Modo',
      type: 'select',
      required: true,
      defaultValue: 'full',
      options: [
        { value: 'full', label: 'Manual completo (deck + Voice Guide)' },
        { value: 'audit', label: 'Solo auditoría de consistencia (rápido)' },
      ],
    },
    {
      name: 'notas_diseno',
      label: 'Notas para el diseñador (opcional)',
      type: 'textarea',
      placeholder: 'Énfasis, secciones que te importan especialmente, decisiones ya tomadas...',
    },
  ],
  submitButtonText: 'Generar Brand Book',
  submitButtonColor: '#8B5CF6',
}
