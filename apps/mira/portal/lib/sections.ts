import {
  Briefcase,
  Users, LayoutDashboard, CheckSquare, BarChart3,
  Kanban, Target, Zap, LucideIcon, Map, Lightbulb, TrendingUp,
  Search, MessageSquare, FileText,
  Home, Calendar, Brain, ClipboardList, Layers, Archive, Image,
  Mail, Wrench, LayoutGrid,
} from 'lucide-react'
import type { Entitlement } from './entitlements'
import { canAccessSection, minPlanForSection, type UserPlan } from './plans'

/**
 * Flag de la UI de 6 espacios. YA NO GOBIERNA LA NAVEGACIÓN: la clásica se
 * borró el 26-ago-2026 tras comprobar en producción que la ideal llevaba días
 * siendo la única que ven los clientes, así que el sidebar se pinta siempre.
 *
 * Sigue vivo porque tiene otros dos consumidores que NO son navegación y sí
 * gatean contenido de página: la tarjeta de informe semanal en /home y la de
 * valor en /performance.
 */
export function isIdealUI(): boolean {
  return process.env.NEXT_PUBLIC_IDEAL_UI === '1'
}

/**
 * Estado de un item de navegación, mismo vocabulario que el marketplace de
 * integraciones (lib/integrations/marketplace-tools.ts): ahí una herramienta es
 * 'locked' (el plan no la incluye) o 'coming_soon' (no existe aún) y la tarjeta
 * se pinta distinta en cada caso. Aquí es lo mismo pero para el menú, para que
 * el usuario vea ANTES de hacer clic por qué algo no le abre — antes el candado
 * solo existía en el switcher de departamentos y las páginas se abrían igual
 * por URL directa ("gating cosmético", docs/MIRA-LANZAMIENTO-FASE2.md).
 *
 *   'available'   → link normal.
 *   'coming_soon' → se declara a mano en el item: la ruta o la herramienta no
 *                   existe todavía. Chip "Soon", no navega.
 *   'locked'      → NUNCA se declara a mano: depende del plan de quien mira, así
 *                   que lo calcula resolveNavItemStatus() con PLAN_SECTIONS.
 */
export type NavItemStatus = 'available' | 'coming_soon' | 'locked'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  /** Herramienta con acceso restringido por cliente (ver lib/entitlements). */
  requires?: Entitlement
  /** Solo 'coming_soon' tiene sentido declararlo aquí; ver NavItemStatus. */
  status?: NavItemStatus
  /**
   * La ruta existe y pertenece a esta sección, pero NO se pinta en el menú.
   * Sirve para que getActiveSectionFromPath la siga mapeando —de ahí sale el
   * gating por plan de proxy.ts— sin ocupar un hueco en la navegación. Lo usa
   * /goals, que se alcanza desde la landing de Marketing.
   */
  hidden?: boolean
  /**
   * Sección de PLAN_SECTIONS que gatea el item cuando no se deduce de la ruta.
   * Por defecto se deduce con getActiveSectionFromPath(href) (p. ej. /roster →
   * marketing, /comercial → comercial), que es lo que ya usa proxy.ts.
   */
  section?: string
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
      // Objetivos: ya NO son un item de menú (decisión CEO 20-ago). Viven dentro
      // de la landing de Marketing, encima del chat (components/goals/GoalsSection).
      // El href se queda declarado —sin label visible no serviría— porque
      // getActiveSectionFromPath necesita saber que /goals pertenece a marketing:
      // de ahí sale el gating por plan de proxy.ts. Lo oculta 'hidden'.
      { href: '/goals',       label: 'Goals',        icon: Target, hidden: true },
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
// no aparece aquí (Operaciones/Finanzas como departamentos) queda
// CONGELADO — la ruta sigue viva por URL, solo sale de la navegación. Reversible
// apagando el flag. Los 8 informes, el módulo comercial y todo lo demás siguen.
export interface IdealSpace {
  key: string
  label: string
  icon: LucideIcon
  items: NavItem[]
}

export const IDEAL_SPACES: IdealSpace[] = [
  {
    key: 'hoy', label: 'Today', icon: Home,
    items: [
      { href: '/home',      label: 'Overview', icon: LayoutDashboard },
      { href: '/approvals', label: 'Inbox',    icon: CheckSquare },
    ],
  },
  {
    key: 'calendario', label: 'Calendar', icon: Calendar,
    items: [
      { href: '/calendar', label: 'Calendar', icon: Calendar },
    ],
  },
  {
    // Tools (antes «Library»): TODO lo que la marca tiene contratado, junto.
    // Las tres primeras entran con cualquier plan de pago; las de operativa se
    // habilitan marca a marca (client_tools, migración 0073) y quien no las
    // tiene las ve en el marketplace de /tools, no escondidas como antes.
    key: 'tools', label: 'Tools', icon: Wrench,
    items: [
      { href: '/tools',          label: 'All tools',     icon: LayoutGrid },
      { href: '/toolkit',        label: 'Reports',       icon: Layers },
      { href: '/documents',      label: 'Documents',     icon: FileText },
      // Estudio Visual v1: genera imágenes guiadas por la marca. La galería
      // (/gallery) es su biblioteca de assets, enlazada desde el propio Estudio.
      { href: '/studio',         label: 'Visual Studio', icon: Image },
      { href: '/licitaciones',   label: 'Tenders',       icon: Briefcase, requires: 'tender' },
      { href: '/email-ops',      label: 'Email Ops',     icon: Mail, requires: 'email-ops' },
    ],
  },
  {
    key: 'equipo', label: 'Team', icon: Users,
    items: [
      { href: '/roster',    label: 'Marketing', icon: Target },
      // Goals ya no sale aquí: es una sección de la propia landing de Marketing
      // (decisión CEO 20-ago). Se llega desde ahí, no desde el menú.
      { href: '/comercial', label: 'Sales',     icon: Kanban },
      { href: '/strategy',  label: 'Leadership', icon: Map },
      // Finanzas se vende en Scale/Admin: no se esconde a quien lo paga; a quien
      // no, le sale con candado (upsell), igual que en la navegación clásica.
      { href: '/finanzas',  label: 'Finance',   icon: TrendingUp },
    ],
  },
  {
    key: 'cerebro', label: 'Brain', icon: Brain,
    items: [
      { href: '/brand-brain',    label: 'Brand Brain',    icon: Brain },
      // Los cuestionarios NO son una herramienta de biblioteca: son la forma de
      // rellenar los huecos del Cerebro (sus respuestas se ingestan en
      // brand_profiles, content_pillars y project_memory). Por eso viven aquí,
      // junto al Cerebro y a la Memoria que alimentan.
      { href: '/questionnaires', label: 'Questionnaires', icon: ClipboardList },
      { href: '/project-memory', label: 'Memory',         icon: Archive },
    ],
  },
  {
    key: 'resultados', label: 'Results', icon: BarChart3,
    items: [
      { href: '/performance', label: 'Performance', icon: BarChart3 },
    ],
  },
]


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

/** Sección (slug de PLAN_SECTIONS) que gatea un item, o undefined si es global (Toolkit, Brain...). */
export function navItemSection(item: Pick<NavItem, 'href' | 'section'>): string | undefined {
  return item.section ?? getActiveSectionFromPath(item.href)?.slug
}

/**
 * Estado real de un item para el plan de quien lo mira. Es la ÚNICA función que
 * produce 'locked': misma fuente de verdad (PLAN_SECTIONS + getActiveSectionFromPath)
 * que usa proxy.ts cuando ENFORCE_PLAN_LIMITS está encendido, así el menú nunca
 * promete algo que el middleware luego rebota. Los items globales (sin sección)
 * están siempre disponibles: el gating por feature (toolkitGenerate) sigue
 * viviendo en canUseFeature, y el gating por cliente en NavItem.requires.
 */
export function resolveNavItemStatus(
  item: Pick<NavItem, 'href' | 'status' | 'section'>,
  plan: UserPlan | string | null | undefined,
): NavItemStatus {
  if (item.status === 'coming_soon') return 'coming_soon'
  const slug = navItemSection(item)
  if (!slug) return 'available'
  return canAccessSection(plan, slug) ? 'available' : 'locked'
}

/** Plan mínimo que desbloquea un item 'locked' (null si ningún plan de cliente lo incluye). */
export function minPlanForNavItem(item: Pick<NavItem, 'href' | 'section'>): UserPlan | null {
  const slug = navItemSection(item)
  return slug ? minPlanForSection(slug) : null
}
