import type { ToolConfig } from '@/components/ToolRunnerPage'

// Config exportable: la usa la página del tool Y /strategy/plan (tab Competencia).
// Fusión con la quick action analizar_competencia (2026-07-28): focus +
// vulnerabilidades + profundidad. Brain-first: fuera tu_proposicion y
// mercado_posicion — el Brand Brain ya lo sabe y entra server-side.
export const COMPETITIVE_CONFIG: ToolConfig = {
  slug: 'competitive-analysis',
  icon: '⚔️',
  title: 'Competitive Analysis',
  timing: 'Radar ~1 min · Análisis profundo 3-4 min',
  brandBrainNote:
    'Tu posicionamiento y propuesta de valor entran solos desde el Brand Brain — no hace falta repetirlos aquí.',
  submitButtonColor: '#EC4899',
  submitButtonText: 'Analizar competencia',
  fields: [
    {
      name: 'competidor_1',
      label: 'COMPETIDOR PRINCIPAL',
      type: 'text',
      placeholder: 'Nombre o URL del competidor más fuerte',
      required: true,
    },
    {
      name: 'competidor_2',
      label: 'COMPETIDOR 2 (opcional)',
      type: 'text',
      placeholder: 'Otro competidor relevante',
      required: false,
    },
    {
      name: 'competidor_3',
      label: 'COMPETIDOR 3 (opcional)',
      type: 'text',
      placeholder: 'Competidor emergente o nicho',
      required: false,
    },
    {
      name: 'focus',
      label: '¿DÓNDE QUIERES EL FOCO?',
      type: 'select',
      hint: 'El análisis investiga y profundiza sobre todo en esta dimensión.',
      options: [
        { value: 'todo', label: 'Visión completa' },
        { value: 'pricing', label: 'Precios y ofertas' },
        { value: 'features', label: 'Producto y funcionalidades' },
        { value: 'positioning', label: 'Posicionamiento y mensaje' },
      ],
      defaultValue: 'todo',
      required: true,
    },
    {
      name: 'vulnerabilidades',
      label: 'VULNERABILIDADES QUE YA CONOCES (opcional)',
      type: 'textarea',
      placeholder:
        'Debilidades de tus competidores que has visto de primera mano: colas, quejas, precios que suben, servicio flojo… Una por línea.',
      hint: 'Tu conocimiento del terreno vale más que cualquier búsqueda — el análisis lo verifica y construye sobre ello.',
      required: false,
    },
    {
      name: 'profundidad',
      label: 'PROFUNDIDAD',
      type: 'select',
      hint: 'El radar rápido responde "qué está pasando y qué hago" en un minuto. El análisis profundo es el informe completo con matriz, SWOT y estrategia.',
      options: [
        { value: 'deep', label: 'Análisis profundo (informe completo)' },
        { value: 'quick', label: 'Radar rápido (~1 min)' },
      ],
      defaultValue: 'deep',
      required: true,
    },
  ],
}
