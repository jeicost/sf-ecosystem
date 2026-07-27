import {
  Briefcase,
  Users, LayoutDashboard, CheckSquare, BarChart3, MessageSquarePlus,
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
      { href: '/brief',       label: 'New Brief',    icon: MessageSquarePlus },
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
      { href: '/strategy/plan',      label: '90-Day Plan',   icon: Map },
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
