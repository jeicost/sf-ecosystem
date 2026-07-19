export interface ToolkitTool {
  slug: string
  icon: string
  name: string
  description: string
  time: string
  color: string
  href: string
  departments?: string[] // e.g., ['marketing', 'strategy']
}

export const TOOLKIT_TOOLS: ToolkitTool[] = [
  {
    slug: 'seo-audit',
    icon: '🔍',
    name: 'Auditoría SEO',
    description: 'Diagnóstico técnico completo: on-page, Core Web Vitals, keywords, content gaps, backlinks y plan de acción prioritizado.',
    time: '~3 min',
    color: '#F87171',
    href: '/toolkit/seo-audit',
    departments: ['marketing', 'strategy']
  },
  {
    slug: 'brand-briefing',
    icon: '💭',
    name: 'Brand Briefing',
    description: 'Pack completo de inteligencia de marca: 23 secciones, planes de contenido, Brand Brain JSON y roadmap.',
    time: '~20 min',
    color: '#A78BFA',
    href: '/toolkit/brand-briefing',
    departments: ['marketing', 'comercial', 'strategy']
  },
  {
    slug: 'action-plan',
    icon: '🎯',
    name: 'Plan de Acción 30/60/90',
    description: 'Plan de acción específico por semanas con acciones, KPIs, owners y recursos. Bebe del briefing existente.',
    time: '~3 min',
    color: '#FF6B35',
    href: '/toolkit/action-plan',
    departments: ['strategy', 'finanzas']
  },
  {
    slug: 'content-pack',
    icon: '📝',
    name: 'Content Pack',
    description: '15 posts listos para publicar + 10 scripts de Reel/TikTok + estrategia de plataformas.',
    time: '~10 min',
    color: '#FBBF24',
    href: '/toolkit/content-pack',
    departments: ['marketing', 'comercial']
  },
  {
    slug: 'content-engine',
    icon: '🏭',
    name: 'Content Engine',
    description: 'Motor de contenido por pilares: elige pilares, plataformas y volumen — genera posts listos para revisar en la Cola de Aprobación y el calendario editorial.',
    time: '~5 min',
    color: '#22D3EE',
    href: '/toolkit/content-engine',
    departments: ['marketing', 'comercial']
  },
  {
    slug: 'marketing-audit',
    icon: '📊',
    name: 'Auditoría de Marketing',
    description: 'Análisis de 6 dimensiones: contenido, canales, conversión, posicionamiento.',
    time: '~4 min',
    color: '#60A5FA',
    href: '/toolkit/marketing-audit',
    departments: ['marketing', 'comercial']
  },
  {
    slug: 'investor-deck',
    icon: '📈',
    name: 'Investor Deck',
    description: 'Pitch deck profesional (15-20 slides) con financials, tracción, TAM/SAM/SOM y modelo.',
    time: '~5 min',
    color: '#34D399',
    href: '/toolkit/investor-deck',
    departments: ['finanzas', 'strategy']
  },
  {
    slug: 'competitive-analysis',
    icon: '⚔️',
    name: 'Análisis Competitivo',
    description: 'Mapeo de 5-7 competidores, strengths/weaknesses, pricing, go-to-market y positioning gaps.',
    time: '~7 min',
    color: '#EC4899',
    href: '/toolkit/competitive-analysis',
    departments: ['strategy', 'comercial']
  },
  {
    slug: 'brandbook-content-system',
    icon: '📚',
    name: 'Brandbook + Content System',
    description: 'Sistema completo de contenidos de marca: guías de tono, templates, arquetipos de personajes, calendarios editoriales y playbooks de contenido por canal.',
    time: '~30 min',
    color: '#8B5CF6',
    href: '/toolkit/brandbook-content-system',
    departments: ['marketing', 'comercial']
  },
  {
    slug: 'marketing-campaign-generator',
    icon: '📢',
    name: 'Marketing Campaign Generator',
    description: 'Generador de campañas de marketing: estrategia mensual, distribución por canal, KPIs y métricas de éxito.',
    time: '~5 min',
    color: '#EC4899',
    href: '/toolkit/marketing-campaign-generator',
    departments: ['marketing', 'comercial']
  },
  {
    slug: 'community-growth-blueprint',
    icon: '👥',
    name: 'Community Growth Blueprint',
    description: 'Estrategia de crecimiento comunitario: roadmap de 90 días, playbook de engagement, sourcing de influencers, métricas.',
    time: '~8 min',
    color: '#F59E0B',
    href: '/toolkit/community-growth-blueprint',
    departments: ['marketing']
  },
]

// Helper to get tool by slug
export const getToolBySlug = (slug: string): ToolkitTool | undefined => {
  return TOOLKIT_TOOLS.find(t => t.slug === slug)
}

// Helper to get tools for a department
export const getToolsForDepartment = (dept: string, limit?: number): ToolkitTool[] => {
  const tools = TOOLKIT_TOOLS.filter(t => t.departments?.includes(dept))
  return limit ? tools.slice(0, limit) : tools
}
