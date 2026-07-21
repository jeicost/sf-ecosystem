// Centralized agent metadata for routing + UI
// Used by /api/agent, /agent/[role], DepartmentAgents, etc.

export type AgentStatus = 'active' | 'inactive' | 'pending' | 'idle' | 'processing' | 'complete'

export interface AgentMetadata {
  id: string
  name: string
  emoji: string
  description: string // English short description
  descriptionEs: string // Spanish short description
  color: string
  gradient: string
  department: 'comercial' | 'marketing' | 'strategy' | 'operaciones' | 'finanzas'
}

export const AGENT_METADATA: Record<string, AgentMetadata> = {
  // Comercial (6)
  orchestrator: {
    id: 'orchestrator',
    name: 'Marco',
    emoji: '🎯',
    description: 'Campaign strategist and coordinator',
    descriptionEs: 'Estratega y coordinador de campañas',
    color: '#8B5CF6',
    gradient: 'from-purple-600 to-indigo-600',
    department: 'comercial',
  },
  'lead-scout': {
    id: 'lead-scout',
    name: 'Rex',
    emoji: '🔍',
    description: 'Lead, market & opportunity discoverer',
    descriptionEs: 'Descubridor de leads, mercados y oportunidades',
    color: '#06B6D4',
    gradient: 'from-cyan-500 to-blue-500',
    department: 'comercial',
  },
  'icp-scorer': {
    id: 'icp-scorer',
    name: 'Vera',
    emoji: '📊',
    description: 'Lead and ICP evaluator',
    descriptionEs: 'Evaluador de leads y ICP',
    color: '#F59E0B',
    gradient: 'from-amber-500 to-orange-500',
    department: 'comercial',
  },
  'icebreaker-writer': {
    id: 'icebreaker-writer',
    name: 'Finn',
    emoji: '💬',
    description: 'Personalized messaging expert',
    descriptionEs: 'Experto en mensajes personalizados',
    color: '#EC4899',
    gradient: 'from-pink-500 to-rose-500',
    department: 'comercial',
  },
  'reply-qualifier': {
    id: 'reply-qualifier',
    name: 'Quinn',
    emoji: '✅',
    description: 'Response qualifier',
    descriptionEs: 'Calificador de respuestas',
    color: '#10B981',
    gradient: 'from-green-400 to-emerald-500',
    department: 'comercial',
  },
  'proposal-writer': {
    id: 'proposal-writer',
    name: 'Nova',
    emoji: '📝',
    description: 'Proposal writer',
    descriptionEs: 'Redactor de propuestas',
    color: '#8B5CF6',
    gradient: 'from-purple-500 to-indigo-600',
    department: 'comercial',
  },

  // Marketing (7)
  'content-strategist': {
    id: 'content-strategist',
    name: 'Luna',
    emoji: '📋',
    description: 'Content strategist',
    descriptionEs: 'Estratega de contenido',
    color: '#10B981',
    gradient: 'from-emerald-500 to-teal-500',
    department: 'marketing',
  },
  copywriter: {
    id: 'copywriter',
    name: 'Alex',
    emoji: '✍️',
    description: 'Copy & brand communications writer',
    descriptionEs: 'Redactor de copy y comunicación de marca',
    color: '#EC4899',
    gradient: 'from-pink-500 to-rose-500',
    department: 'marketing',
  },
  'social-media-manager': {
    id: 'social-media-manager',
    name: 'Noa',
    emoji: '📱',
    description: 'Social media manager',
    descriptionEs: 'Gestor de redes sociales',
    color: '#8B5CF6',
    gradient: 'from-purple-500 to-pink-500',
    department: 'marketing',
  },
  designer: {
    id: 'designer',
    name: 'Zoe',
    emoji: '🎨',
    description: 'Creative director',
    descriptionEs: 'Directora creativa',
    color: '#EC4899',
    gradient: 'from-pink-500 to-rose-600',
    department: 'marketing',
  },
  'video-editor': {
    id: 'video-editor',
    name: 'Kai',
    emoji: '🎬',
    description: 'Video editor',
    descriptionEs: 'Editor de vídeos',
    color: '#EC4899',
    gradient: 'from-pink-500 to-red-500',
    department: 'marketing',
  },
  'ads-manager': {
    id: 'ads-manager',
    name: 'Riva',
    emoji: '📣',
    description: 'Advertising campaign manager',
    descriptionEs: 'Gestor de campañas publicitarias',
    color: '#F97316',
    gradient: 'from-orange-500 to-red-500',
    department: 'marketing',
  },
  'community-manager': {
    id: 'community-manager',
    name: 'Sam',
    emoji: '👥',
    description: 'Community manager',
    descriptionEs: 'Gestor de comunidad',
    color: '#06B6D4',
    gradient: 'from-cyan-400 to-blue-500',
    department: 'marketing',
  },

  // Strategy (4 — síntesis 2026-07-21: Strategos absorbe Kairos, Blueprint absorbe Venture, Atlas absorbe Oracle y Radar)
  strategos: {
    id: 'strategos',
    name: 'Strategos',
    emoji: '♟️',
    description: 'Master strategist & strategic timing',
    descriptionEs: 'Estratega maestro y timing estratégico',
    color: '#7C3AED',
    gradient: 'from-violet-600 to-purple-600',
    department: 'strategy',
  },
  blueprint: {
    id: 'blueprint',
    name: 'Blueprint',
    emoji: '🏗️',
    description: 'Plan & business model architect',
    descriptionEs: 'Arquitecto de planes y modelos de negocio',
    color: '#06B6D4',
    gradient: 'from-cyan-500 to-blue-500',
    department: 'strategy',
  },
  atlas: {
    id: 'atlas',
    name: 'Atlas',
    emoji: '🗺️',
    description: 'Trends, foresight & opportunity mapping',
    descriptionEs: 'Tendencias, escenarios futuros y oportunidades',
    color: '#3B82F6',
    gradient: 'from-blue-500 to-cyan-500',
    department: 'strategy',
  },

  // Operaciones (3 — reperfilado 2026-07-21: soporte de cliente + métricas + procesos; Ledger eliminado, redundante con Finanzas)
  pulse: {
    id: 'pulse',
    name: 'Pulse',
    emoji: '📈',
    description: 'Metrics monitor',
    descriptionEs: 'Monitor de métricas',
    color: '#10B981',
    gradient: 'from-green-500 to-emerald-600',
    department: 'operaciones',
  },
  onboard: {
    id: 'onboard',
    name: 'Onboard',
    emoji: '🎓',
    description: 'Processes, SOPs & team onboarding',
    descriptionEs: 'Procesos, SOPs y formación de equipos',
    color: '#3B82F6',
    gradient: 'from-blue-500 to-indigo-600',
    department: 'operaciones',
  },
  harbor: {
    id: 'harbor',
    name: 'Harbor',
    emoji: '🛟',
    description: 'Customer support — tickets, FAQs & replies',
    descriptionEs: 'Soporte de cliente — tickets, FAQs y respuestas',
    color: '#10B981',
    gradient: 'from-green-500 to-teal-600',
    department: 'operaciones',
  },

  // Strategy - Innovation (merged)
  spark: {
    id: 'spark',
    name: 'Spark',
    emoji: '⚡',
    description: 'Idea generator & trend scout',
    descriptionEs: 'Generador de ideas y detector de tendencias',
    color: '#FBBF24',
    gradient: 'from-amber-400 to-orange-500',
    department: 'strategy',
  },

  // Finanzas (3)
  midas: {
    id: 'midas',
    name: 'Midas',
    emoji: '💰',
    description: 'Revenue optimizer',
    descriptionEs: 'Optimizador de ingresos',
    color: '#FBBF24',
    gradient: 'from-yellow-400 to-orange-500',
    department: 'finanzas',
  },
  quant: {
    id: 'quant',
    name: 'Quant',
    emoji: '🧮',
    description: 'Data analyst',
    descriptionEs: 'Analista de datos',
    color: '#3B82F6',
    gradient: 'from-blue-500 to-cyan-600',
    department: 'finanzas',
  },
  fiscal: {
    id: 'fiscal',
    name: 'Fiscal',
    emoji: '📊',
    description: 'Financial auditor',
    descriptionEs: 'Auditor financiero',
    color: '#6366F1',
    gradient: 'from-indigo-500 to-blue-600',
    department: 'finanzas',
  },
}

// Display names derived from AGENT_METADATA — single source of truth (23 agentes reales).
// Shape: Record<agentId, displayName> — consumer: app/api/agent/route.ts (AGENT_DISPLAY_NAMES[role] ?? role)
export const AGENT_DISPLAY_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(AGENT_METADATA).map(([id, meta]) => [id, meta.name])
)

// Department filtering for sidebar cards
export const COMERCIAL_DEPT_AGENTS: AgentMetadata[] = [
  AGENT_METADATA['orchestrator'],
  AGENT_METADATA['lead-scout'],
  AGENT_METADATA['icp-scorer'],
  AGENT_METADATA['icebreaker-writer'],
  AGENT_METADATA['reply-qualifier'],
  AGENT_METADATA['proposal-writer'],
]

export const MARKETING_DEPT_AGENTS: AgentMetadata[] = [
  AGENT_METADATA['content-strategist'],
  AGENT_METADATA['copywriter'],
  AGENT_METADATA['social-media-manager'],
  AGENT_METADATA['designer'],
  AGENT_METADATA['video-editor'],
  AGENT_METADATA['ads-manager'],
  AGENT_METADATA['community-manager'],
]

export const STRATEGY_DEPT_AGENTS: AgentMetadata[] = [
  AGENT_METADATA['strategos'],
  AGENT_METADATA['blueprint'],
  AGENT_METADATA['atlas'],
  AGENT_METADATA['spark'],
]

// Backward compatibility aliases
export const ESTRATEGIA_DEPT_AGENTS = STRATEGY_DEPT_AGENTS
export const INNOVACION_DEPT_AGENTS = [AGENT_METADATA['spark']]

export const OPERACIONES_DEPT_AGENTS: AgentMetadata[] = [
  AGENT_METADATA['harbor'],
  AGENT_METADATA['pulse'],
  AGENT_METADATA['onboard'],
]

export const FINANZAS_DEPT_AGENTS: AgentMetadata[] = [
  AGENT_METADATA['midas'],
  AGENT_METADATA['quant'],
  AGENT_METADATA['fiscal'],
]
