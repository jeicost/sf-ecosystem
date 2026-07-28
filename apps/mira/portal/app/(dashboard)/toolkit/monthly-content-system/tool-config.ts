import type { ToolConfig } from '@/components/ToolRunnerPage'

// Config exportada del Monthly Content System (Business Reports).
// El mes por defecto lo fija la página (mes siguiente) — aquí solo el shape.
export const MONTHLY_CONFIG: ToolConfig = {
  slug: 'monthly-content-system',
  icon: '📆',
  title: 'Monthly Content System',
  subtitle: 'Pilares, tablero semanal, hero briefs, captions y calendario del mes — como Google Slides editable en tu Drive',
  timing: '~12 min',
  brandBrainNote: 'Se construye desde tu Brand Brain, tus pilares y el tablero del mes anterior (lo aprobado y rechazado enseña al siguiente). Adjunta briefs o materiales del mes si los tienes.',
  fields: [
    {
      name: 'mes',
      label: 'Mes a generar',
      type: 'month',
      required: true,
    },
    {
      name: 'posts_por_pilar',
      label: 'Propuestas por pilar',
      type: 'select',
      required: true,
      defaultValue: '4',
      options: [
        { value: '3', label: '3 por pilar' },
        { value: '4', label: '4 por pilar' },
        { value: '5', label: '5 por pilar' },
      ],
    },
    {
      name: 'plataformas',
      label: 'Plataformas',
      type: 'multicheck',
      required: true,
      defaultValue: ['instagram'],
      options: [
        { value: 'instagram', label: 'Instagram' },
        { value: 'tiktok', label: 'TikTok' },
        { value: 'linkedin', label: 'LinkedIn' },
        { value: 'facebook', label: 'Facebook' },
      ],
    },
    {
      name: 'include_reels',
      label: '¿Incluir guiones de Reel?',
      type: 'select',
      required: true,
      defaultValue: 'yes',
      options: [
        { value: 'yes', label: 'Sí — con guion timecodeado' },
        { value: 'no', label: 'No' },
      ],
    },
  ],
  submitButtonText: 'Generar mes',
  submitButtonColor: '#22D3EE',
}
