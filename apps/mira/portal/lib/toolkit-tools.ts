// Catálogo de Business Reports (antes "Toolkit"). Rediseño 2026-07-28:
// 11 herramientas → 8 reportes visibles + 5 entradas legacy (conservan
// nombre/icono para que los informes históricos de generation_queue sigan
// abriéndose y mostrándose bien; no aparecen en catálogo ni departamentos).

export type ToolCategory = 'Digital Audit' | 'Brand Intelligence' | 'Content' | 'Strategy'

export interface ToolkitTool {
  slug: string
  icon: string
  name: string
  description: string
  time: string
  color: string
  href: string
  departments?: string[] // e.g., ['marketing', 'strategy']
  /** True when the tool has its own generation route (not served by /api/toolkit/generate[-batch]) */
  hasDedicatedRoute?: boolean
  category: ToolCategory
  /** Fuera del catálogo; solo resuelve por slug para históricos */
  legacy?: boolean
}

export const TOOLKIT_TOOLS: ToolkitTool[] = [
  // ── DIGITAL AUDIT ──────────────────────────────────────────────────────
  {
    slug: 'seo-audit',
    icon: '🔍',
    name: 'Auditoría SEO',
    description: 'Diagnóstico técnico completo: on-page, Core Web Vitals, keywords, content gaps, backlinks y plan de acción prioritizado.',
    time: '~3 min',
    color: '#F87171',
    href: '/toolkit/seo-audit',
    departments: ['marketing', 'strategy'],
    category: 'Digital Audit',
  },
  {
    slug: 'marketing-audit',
    icon: '📊',
    name: 'Auditoría de Marketing',
    description: 'Análisis de 6 dimensiones: contenido, canales, conversión, posicionamiento.',
    time: '~4 min',
    color: '#60A5FA',
    href: '/toolkit/marketing-audit',
    departments: ['marketing', 'comercial'],
    category: 'Digital Audit',
  },
  // ── BRAND INTELLIGENCE ─────────────────────────────────────────────────
  {
    slug: 'brand-briefing',
    icon: '💭',
    name: 'Brand Briefing',
    description: 'Pack completo de inteligencia de marca a partir de tu web y tu Brand Brain: 23 secciones, posicionamiento y roadmap.',
    time: '~20 min',
    color: '#A78BFA',
    href: '/toolkit/brand-briefing',
    departments: ['marketing', 'comercial', 'strategy'],
    category: 'Brand Intelligence',
  },
  {
    slug: 'brand-book',
    icon: '📕',
    name: 'Brand Book',
    description: 'El manual maestro de marca: identidad, voz con reglas y porqués, logo, color con CMYK real, tipografía, imagen y gobernanza — con auditoría de consistencia incluida. + Voice Guide de 1 página.',
    time: '~10 min',
    color: '#8B5CF6',
    href: '/toolkit/brand-book',
    departments: ['marketing', 'strategy'],
    category: 'Brand Intelligence',
  },
  // ── CONTENT ────────────────────────────────────────────────────────────
  {
    slug: 'monthly-content-system',
    icon: '📆',
    name: 'Monthly Content System',
    description: 'El sistema de contenido del mes: pilares, tablero semanal Approve/Tweak/Pass, hero briefs, captions listos, calendario real e idea bank — entregado como Google Slides editable en tu Drive.',
    time: '~12 min',
    color: '#22D3EE',
    href: '/toolkit/monthly-content-system',
    departments: ['marketing', 'comercial'],
    category: 'Content',
  },
  // ── STRATEGY ───────────────────────────────────────────────────────────
  {
    slug: 'action-plan',
    icon: '🎯',
    name: 'Plan de Acción 30/60/90',
    description: 'Plan de acción específico por semanas con acciones, KPIs, owners y recursos. Bebe del briefing existente.',
    time: '~3 min',
    color: '#FF6B35',
    href: '/toolkit/action-plan',
    departments: ['strategy', 'finanzas'],
    category: 'Strategy',
  },
  {
    slug: 'competitive-analysis',
    icon: '⚔️',
    name: 'Análisis Competitivo',
    description: 'Mapeo de competidores con investigación web real: matriz, pricing, SWOT y estrategia ganadora.',
    time: '~7 min',
    color: '#EC4899',
    href: '/toolkit/competitive-analysis',
    departments: ['strategy', 'comercial'],
    category: 'Strategy',
  },
  {
    slug: 'investor-deck',
    icon: '📈',
    name: 'Investor Deck',
    description: 'Pitch deck profesional (15-20 slides) con financials, tracción, TAM/SAM/SOM y modelo.',
    time: '~5 min',
    color: '#34D399',
    href: '/toolkit/investor-deck',
    departments: ['finanzas', 'strategy'],
    category: 'Strategy',
  },

  // ── LEGACY (históricos; fuera del catálogo) ────────────────────────────
  {
    slug: 'content-pack',
    icon: '📝',
    name: 'Content Pack',
    description: 'Legacy — absorbido por Monthly Content System.',
    time: '~10 min',
    color: '#FBBF24',
    href: '/toolkit/monthly-content-system',
    category: 'Content',
    legacy: true,
  },
  {
    slug: 'content-engine',
    icon: '🏭',
    name: 'Content Engine',
    description: 'Legacy — ahora es el motor interno del Monthly Content System.',
    time: '~5 min',
    color: '#22D3EE',
    href: '/toolkit/monthly-content-system',
    hasDedicatedRoute: true,
    category: 'Content',
    legacy: true,
  },
  {
    slug: 'brandbook-content-system',
    icon: '📚',
    name: 'Brandbook + Content System',
    description: 'Legacy — dividido en Brand Book y Monthly Content System.',
    time: '~30 min',
    color: '#8B5CF6',
    href: '/toolkit/brand-book',
    category: 'Brand Intelligence',
    legacy: true,
  },
  {
    slug: 'marketing-campaign-generator',
    icon: '📢',
    name: 'Marketing Campaign Generator',
    description: 'Legacy — absorbido por el Idea Bank del Monthly Content System.',
    time: '~5 min',
    color: '#EC4899',
    href: '/toolkit/monthly-content-system',
    category: 'Content',
    legacy: true,
  },
  {
    slug: 'community-growth-blueprint',
    icon: '👥',
    name: 'Community Growth Blueprint',
    description: 'Legacy — absorbido por el Idea Bank del Monthly Content System.',
    time: '~8 min',
    color: '#F59E0B',
    href: '/toolkit/monthly-content-system',
    category: 'Content',
    legacy: true,
  },
]

// Helper to get tool by slug (resuelve también legacy — históricos)
export const getToolBySlug = (slug: string): ToolkitTool | undefined => {
  return TOOLKIT_TOOLS.find(t => t.slug === slug)
}

// Helper to get tools for a department (solo visibles)
export const getToolsForDepartment = (dept: string, limit?: number): ToolkitTool[] => {
  const tools = TOOLKIT_TOOLS.filter(t => !t.legacy && t.departments?.includes(dept))
  return limit ? tools.slice(0, limit) : tools
}

export const getVisibleTools = (): ToolkitTool[] => TOOLKIT_TOOLS.filter(t => !t.legacy)
