import {
  Briefcase,
  Users, LayoutDashboard, CheckSquare, BarChart3,
  Kanban, Target, Zap, LucideIcon, Map, Lightbulb, Settings, TrendingUp,
  Search, MessageSquare, FileText,
  Home, Calendar, Brain, Library, ClipboardList, Layers, Archive, Image,
} from 'lucide-react'
import { DEFAULT_SECTION_SLUG } from './constants'

/** Flag de la UI consolidada del sistema ideal (6 espacios). Apagado por
 *  defecto: sin él, la navegación es exactamente la de hoy. Encenderlo en
 *  Vercel (NEXT_PUBLIC_IDEAL_UI=1 + redeploy) muestra la nueva sin borrar nada. */
export function isIdealUI(): boolean {
  return process.env.NEXT_PUBLIC_IDEAL_UI === '1'
}

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  /** Herramienta con acceso restringido por cliente (ver lib/entitlements). */
  requires?: 'tender'
}

export interface MiraSection {
  slug: string
  name: string
  shortName: string
  color: string
  icon: string
  navItems: NavItem[]
}

export const SECTIONS: MiraSection[] = [
  {
    slug: 'marketing',
    name: 'MIRA Marketing',
    shortName: 'Marketing',
    color: '#8B5CF6',
    icon: '🎯',
    navItems: [
      { href: '/roster',      label: 'My Team',      icon: Users },
      { href: '/approvals',   label: 'Approvals',    icon: CheckSquare },
      { href: '/performance', label: 'Performance',  icon: BarChart3 },
    ],
  },
  {
    slug: 'comercial',
    name: 'MIRA Sales',
    shortName: 'Sales',
    color: '#EF4444',
    icon: '🚀',
    navItems: [
      { href: '/comercial',            label: 'My Team',       icon: Users },
      { href: '/comercial/discovery',  label: 'Discovery',     icon: Search },
      { href: '/comercial/pipeline',   label: 'Pipeline',      icon: Kanban },
      { href: '/comercial/scoring',    label: 'Scoring',       icon: BarChart3 },
      { href: '/comercial/icebreaker', label: 'Icebreaker',    icon: Zap },
      { href: '/comercial/qualify',    label: 'Qualify',       icon: MessageSquare },
      { href: '/comercial/proposals',  label: 'Proposals',     icon: FileText },
    ],
  },
  {
    slug: 'strategy',
    name: 'MIRA Strategy',
    shortName: 'Strategy',
    color: '#6366F1',
    icon: '🔭',
    navItems: [
      { href: '/strategy',           label: 'My Team',       icon: Users },
      { href: '/strategy/plan',      label: 'Plan & Competitive', icon: Map },
      { href: '/strategy/proyectos', label: 'Innovation',    icon: Lightbulb },
    ],
  },
  {
    slug: 'operations',
    name: 'MIRA Operations',
    shortName: 'Operations',
    color: '#10B981',
    icon: '⚙️',
    // Billing/System are internal-agency tools (super_admin only, guarded at
    // the page level) -- clients only get the support/FAQ/tutorials hub.
    navItems: [
      { href: '/operations', label: 'My Team', icon: Users },
    ],
  },
  {
    slug: 'finanzas',
    name: 'MIRA Finance',
    shortName: 'Finance',
    color: '#F59E0B',
    icon: '💰',
    navItems: [
      { href: '/finanzas',          label: 'My Team',    icon: Users },
      { href: '/finanzas/plan',     label: 'My Plan',    icon: Map },
      { href: '/finanzas/cartera',  label: 'Portfolio',  icon: TrendingUp },
    ],
  },
]

// ── UI ideal: 6 espacios (Fase 1 del plan) ──────────────────────────────────
// Reorganización SIN pérdida: cada espacio apunta a rutas que ya existen. Lo que
// no aparece aquí (Operaciones/Finanzas como departamentos, marketplace) queda
// CONGELADO — la ruta sigue viva por URL, solo sale de la navegación. Reversible
// apagando el flag. Los 8 informes, el módulo comercial y todo lo demás siguen.
export interface IdealSpace {
  key: string
  label: string
  icon: LucideIcon
  /** Solo super_admin/agencia lo ve (p. ej. Resultados de agencia). */
  agencyOnly?: boolean
  items: NavItem[]
}

export const IDEAL_SPACES: IdealSpace[] = [
  {
    key: 'hoy', label: 'Hoy', icon: Home,
    items: [
      { href: '/home',      label: 'Resumen',  icon: LayoutDashboard },
      { href: '/approvals', label: 'Bandeja',  icon: CheckSquare },
    ],
  },
  {
    key: 'calendario', label: 'Calendario', icon: Calendar,
    items: [
      { href: '/calendar', label: 'Calendario', icon: Calendar },
    ],
  },
  {
    key: 'biblioteca', label: 'Biblioteca', icon: Library,
    items: [
      { href: '/toolkit',        label: 'Informes',      icon: Layers },
      { href: '/licitaciones',   label: 'Licitaciones',  icon: Briefcase, requires: 'tender' },
      { href: '/documents',      label: 'Documentos',    icon: FileText },
      // Estudio Visual v1: genera imágenes guiadas por la marca. La galería
      // (/gallery) es su biblioteca de assets, enlazada desde el propio Estudio.
      { href: '/studio',         label: 'Estudio visual', icon: Image },
      { href: '/questionnaires', label: 'Cuestionarios', icon: ClipboardList },
    ],
  },
  {
    key: 'equipo', label: 'Equipo', icon: Users,
    items: [
      { href: '/roster',    label: 'Marketing', icon: Target },
      { href: '/comercial', label: 'Ventas',    icon: Kanban },
      { href: '/strategy',  label: 'Dirección', icon: Map },
    ],
  },
  {
    key: 'cerebro', label: 'Cerebro', icon: Brain,
    items: [
      { href: '/brand-brain',    label: 'Brand Brain', icon: Brain },
      { href: '/project-memory', label: 'Memoria',     icon: Archive },
    ],
  },
  {
    key: 'resultados', label: 'Resultados', icon: BarChart3,
    items: [
      { href: '/performance', label: 'Rendimiento', icon: BarChart3 },
    ],
  },
]

export function getSectionBySlug(slug: string): MiraSection | undefined {
  return SECTIONS.find(s => s.slug === slug)
}

export function getActiveSectionFromPath(pathname: string): MiraSection | undefined {
  // Match the pathname against each section's navItem hrefs — the longest
  // matching prefix across ALL sections wins. This is needed because some
  // sections (e.g. 'marketing') have navItems outside /<slug> (/roster,
  // /command, /approvals, ...) and there is no /marketing route.
  // For global pages (Toolkit, Brand Brain, Integrations, etc.) nothing
  // matches and we return undefined → sidebar in "neutral" state.
  let best: MiraSection | undefined
  let bestLen = -1

  for (const section of SECTIONS) {
    for (const { href } of section.navItems) {
      const matches = pathname === href || pathname.startsWith(`${href}/`)
      if (matches && href.length > bestLen) {
        best = section
        bestLen = href.length
      }
    }
  }
  if (best) return best

  // Fallback: routes under /<slug> that are not listed as navItems
  return SECTIONS.find(
    s => pathname === `/${s.slug}` || pathname.startsWith(`/${s.slug}/`)
  )
}
