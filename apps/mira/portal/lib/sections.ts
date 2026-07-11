import {
  Users, LayoutDashboard, CheckSquare, BarChart3, MessageSquarePlus, Brain,
  Kanban, Target, Zap, LucideIcon, Map, Lightbulb, Settings, TrendingUp,
  Search, MessageSquare, FileText,
} from 'lucide-react'
import { DEFAULT_SECTION_SLUG } from './constants'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

export interface MiraSection {
  slug: string
  name: string
  shortName: string
  color: string
  icon: string
  navItems: NavItem[]
  locked: boolean
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
      { href: '/command',     label: 'Command',      icon: LayoutDashboard },
      { href: '/approvals',   label: 'Approvals',    icon: CheckSquare },
      { href: '/performance', label: 'Performance',  icon: BarChart3 },
      { href: '/brief',       label: 'New Brief',    icon: MessageSquarePlus },
    ],
    locked: false,
  },
  {
    slug: 'comercial',
    name: 'MIRA Sales',
    shortName: 'Sales',
    color: '#EF4444',
    icon: '🚀',
    navItems: [
      { href: '/comercial',            label: 'My Team',           icon: Users },
      { href: '/comercial/discovery',  label: 'Rex — Discovery',   icon: Search },
      { href: '/comercial/pipeline',   label: 'Pipeline',          icon: Kanban },
      { href: '/comercial/scoring',    label: 'Vera — Scoring',    icon: BarChart3 },
      { href: '/comercial/icebreaker', label: 'Finn — Icebreaker', icon: Zap },
      { href: '/comercial/qualify',    label: 'Quinn — Qualify',   icon: MessageSquare },
      { href: '/comercial/proposals',  label: 'Nova — Proposals',  icon: FileText },
      { href: '/comercial/icp',        label: 'ICP Profile',       icon: Target },
    ],
    locked: false,
  },
  {
    slug: 'estrategia',
    name: 'MIRA Strategy',
    shortName: 'Strategy',
    color: '#6366F1',
    icon: '🔭',
    navItems: [
      { href: '/estrategia',           label: 'My Team',     icon: Users },
      { href: '/estrategia/plan',      label: '90-Day Plan', icon: Map },
      { href: '/estrategia/auditoria', label: 'Audit',       icon: CheckSquare },
    ],
    locked: false,
  },
  {
    slug: 'innovacion',
    name: 'MIRA Innovation',
    shortName: 'Innovation',
    color: '#F97316',
    icon: '💡',
    navItems: [
      { href: '/innovacion',            label: 'My Team',   icon: Users },
      { href: '/innovacion/tendencias', label: 'Trends',    icon: TrendingUp },
      { href: '/innovacion/proyectos',  label: 'Projects',  icon: Lightbulb },
    ],
    locked: false,
  },
  {
    slug: 'admin',
    name: 'MIRA Admin',
    shortName: 'Admin',
    color: '#10B981',
    icon: '⚙️',
    navItems: [
      { href: '/admin',             label: 'My Team',   icon: Users },
      { href: '/admin/facturacion', label: 'Billing',   icon: BarChart3 },
      { href: '/admin/sistema',     label: 'System',    icon: Settings },
    ],
    locked: false,
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
      { href: '/agent/fiscal',      label: 'Tax',        icon: Settings },
      { href: '/agent/harbor',      label: 'FIRE Plan',  icon: Map },
    ],
    locked: false,
  },
]

export function getSectionBySlug(slug: string): MiraSection | undefined {
  return SECTIONS.find(s => s.slug === slug)
}

export function getActiveSectionFromPath(pathname: string): MiraSection {
  const match = SECTIONS.find(s => s.slug !== DEFAULT_SECTION_SLUG && pathname.startsWith(`/${s.slug}`))
  return match ?? SECTIONS.find(s => s.slug === DEFAULT_SECTION_SLUG) ?? SECTIONS[0]
}
