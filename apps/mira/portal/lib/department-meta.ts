// Department metadata for unified rendering
// Single source of truth for department colors, names, icons, and agent counts

export interface DepartmentMetadata {
  slug: 'marketing' | 'comercial' | 'estrategia' | 'innovacion' | 'operations' | 'finanzas'
  id: string // Alias for slug (for backward compatibility)
  name: string // English display name
  nameEs: string // Spanish display name
  icon: string // emoji
  color: string // hex color
  href: string // route path
  description: string // English short description
  descriptionEs: string // Spanish short description
  count: number // Number of agents in this department
}

// Backward compatibility alias
export type DepartmentInfo = DepartmentMetadata

export const DEPARTMENT_METADATA: Record<DepartmentMetadata['slug'], DepartmentMetadata> = {
  marketing: {
    slug: 'marketing',
    id: 'marketing',
    href: '/roster',
    icon: '🎯',
    name: 'Marketing',
    nameEs: 'Marketing',
    description: 'Content · Copy · Ads · Community',
    descriptionEs: 'Contenido · Copy · Anuncios · Comunidad',
    count: 8,
    color: '#8B5CF6',
  },
  comercial: {
    slug: 'comercial',
    id: 'comercial',
    href: '/comercial',
    icon: '🚀',
    name: 'Sales',
    nameEs: 'Ventas',
    description: 'Discovery · Scoring · Proposals',
    descriptionEs: 'Descubrimiento · Puntuación · Propuestas',
    count: 7,
    color: '#EF4444',
  },
  estrategia: {
    slug: 'estrategia',
    id: 'estrategia',
    href: '/estrategia',
    icon: '🔭',
    name: 'Strategy',
    nameEs: 'Estrategia',
    description: 'Plans · Audits · Competitive Analysis',
    descriptionEs: 'Planes · Auditorías · Análisis Competitivo',
    count: 7,
    color: '#6366F1',
  },
  innovacion: {
    slug: 'innovacion',
    id: 'innovacion',
    href: '/innovacion',
    icon: '💡',
    name: 'Innovation',
    nameEs: 'Innovación',
    description: 'Trends · Design Thinking · Foresight',
    descriptionEs: 'Tendencias · Pensamiento de Diseño · Previsión',
    count: 1,
    color: '#F97316',
  },
  operations: {
    slug: 'operations',
    id: 'operations',
    href: '/operations',
    icon: '⚙️',
    name: 'Operations',
    nameEs: 'Operaciones',
    description: 'Billing · Onboarding · Observability',
    descriptionEs: 'Facturación · Incorporación · Observabilidad',
    count: 4,
    color: '#10B981',
  },
  finanzas: {
    slug: 'finanzas',
    id: 'finanzas',
    href: '/finanzas',
    icon: '💰',
    name: 'Finance',
    nameEs: 'Finanzas',
    description: 'Wealth · Investments · Tax Planning',
    descriptionEs: 'Riqueza · Inversiones · Planificación Fiscal',
    count: 3,
    color: '#F59E0B',
  },
}

// Helper: get a single department by slug
export function getDepartmentBySlug(slug: string): DepartmentMetadata | undefined {
  return DEPARTMENT_METADATA[slug as DepartmentMetadata['slug']]
}

// Helper: get all departments except one
export function getOtherDepartments(exclude: DepartmentMetadata['slug']): DepartmentMetadata[] {
  return Object.values(DEPARTMENT_METADATA).filter((d) => d.slug !== exclude)
}

// Helper: get all departments in order
export function getAllDepartments(): DepartmentMetadata[] {
  return Object.values(DEPARTMENT_METADATA)
}
