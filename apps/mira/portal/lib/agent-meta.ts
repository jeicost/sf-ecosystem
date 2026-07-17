// Centralized agent metadata for routing + UI
// Used by /api/agent, /agent/[role], DepartmentAgents, etc.

export type AgentStatus = 'active' | 'inactive' | 'pending' | 'idle' | 'processing' | 'complete'

export const AGENT_DISPLAY_NAMES: Record<string, string> = {
  orchestrator: 'Marco',
  'content-strategist': 'Luna',
  copywriter: 'Alex',
  designer: 'Zoe',
  'video-editor': 'Kai',
  'social-media-manager': 'Noa',
  'ads-manager': 'Riva',
  'community-manager': 'Sam',
  'lead-scout': 'Rex',
  'icp-scorer': 'Vera',
  'icebreaker-writer': 'Finn',
  'reply-qualifier': 'Quinn',
  'proposal-writer': 'Nova',
  strategos: 'Strategos',
  atlas: 'Atlas',
  blueprint: 'Blueprint',
  kairos: 'Kairos',
  radar: 'Radar',
  spark: 'Spark',
  scout: 'Scout',
  venture: 'Venture',
  oracle: 'Oracle',
  ledger: 'Ledger',
  onboard: 'Onboard',
  pulse: 'Pulse',
  herald: 'Herald',
  midas: 'Midas',
  quant: 'Quant',
  fiscal: 'Fiscal',
  harbor: 'Harbor',
}

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
  // Comercial (7)
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
    description: 'Opportunity discoverer',
    descriptionEs: 'Descubridor de oportunidades',
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
  scout: {
    id: 'scout',
    name: 'Scout',
    emoji: '🔭',
    description: 'Market explorer',
    descriptionEs: 'Explorador de mercados',
    color: '#06B6D4',
    gradient: 'from-cyan-500 to-blue-500',
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

  // Marketing (8)
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
    description: 'Copy writer',
    descriptionEs: 'Redactor de copy',
    color: '#EC4899',
    gradient: 'from-pink-500 to-rose-500',
    department: 'marketing',
  },
  herald: {
    id: 'herald',
    name: 'Herald',
    emoji: '📢',
    description: 'Brand communicator',
    descriptionEs: 'Comunicador de marcas',
    color: '#6366F1',
    gradient: 'from-indigo-500 to-violet-600',
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

  // Strategy (8 - 7 from old estrategia + 1 from old innovacion)
  strategos: {
    id: 'strategos',
    name: 'Strategos',
    emoji: '♟️',
    description: 'Master strategist',
    descriptionEs: 'Estratega maestro',
    color: '#7C3AED',
    gradient: 'from-violet-600 to-purple-600',
    department: 'strategy',
  },
  blueprint: {
    id: 'blueprint',
    name: 'Blueprint',
    emoji: '🏗️',
    description: 'Plan architect',
    descriptionEs: 'Arquitecto de planes',
    color: '#06B6D4',
    gradient: 'from-cyan-500 to-blue-500',
    department: 'strategy',
  },
  atlas: {
    id: 'atlas',
    name: 'Atlas',
    emoji: '🗺️',
    description: 'Trend cartographer',
    descriptionEs: 'Cartógrafo de tendencias',
    color: '#3B82F6',
    gradient: 'from-blue-500 to-cyan-500',
    department: 'strategy',
  },
  kairos: {
    id: 'kairos',
    name: 'Kairos',
    emoji: '⏰',
    description: 'Strategic timing expert',
    descriptionEs: 'Experto en timing estratégico',
    color: '#D946EF',
    gradient: 'from-fuchsia-500 to-purple-600',
    department: 'strategy',
  },
  radar: {
    id: 'radar',
    name: 'Radar',
    emoji: '📡',
    description: 'Opportunity detector',
    descriptionEs: 'Detector de oportunidades',
    color: '#06B6D4',
    gradient: 'from-cyan-500 to-blue-600',
    department: 'strategy',
  },
  venture: {
    id: 'venture',
    name: 'Venture',
    emoji: '🚀',
    description: 'Business architect',
    descriptionEs: 'Arquitecto de negocios',
    color: '#8B5CF6',
    gradient: 'from-purple-500 to-indigo-600',
    department: 'strategy',
  },
  oracle: {
    id: 'oracle',
    name: 'Oracle',
    emoji: '🔮',
    description: 'Future visionary',
    descriptionEs: 'Visionario de futuros',
    color: '#7C3AED',
    gradient: 'from-violet-500 to-purple-600',
    department: 'strategy',
  },

  // Operaciones (4)
  ledger: {
    id: 'ledger',
    name: 'Ledger',
    emoji: '💳',
    description: 'Finance manager',
    descriptionEs: 'Gestor de finanzas',
    color: '#6366F1',
    gradient: 'from-indigo-500 to-violet-700',
    department: 'operaciones',
  },
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
    description: 'Team trainer',
    descriptionEs: 'Entrenador de equipos',
    color: '#3B82F6',
    gradient: 'from-blue-500 to-indigo-600',
    department: 'operaciones',
  },
  harbor: {
    id: 'harbor',
    name: 'Harbor',
    emoji: '⚓',
    description: 'Stability anchor',
    descriptionEs: 'Ancla de estabilidad',
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

// Department filtering for sidebar cards
export const COMERCIAL_DEPT_AGENTS: AgentMetadata[] = [
  AGENT_METADATA['orchestrator'],
  AGENT_METADATA['lead-scout'],
  AGENT_METADATA['icp-scorer'],
  AGENT_METADATA['icebreaker-writer'],
  AGENT_METADATA['scout'],
  AGENT_METADATA['reply-qualifier'],
  AGENT_METADATA['proposal-writer'],
]

export const MARKETING_DEPT_AGENTS: AgentMetadata[] = [
  AGENT_METADATA['content-strategist'],
  AGENT_METADATA['copywriter'],
  AGENT_METADATA['herald'],
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
  AGENT_METADATA['kairos'],
  AGENT_METADATA['radar'],
  AGENT_METADATA['venture'],
  AGENT_METADATA['oracle'],
  AGENT_METADATA['spark'],
]

// Backward compatibility aliases
export const ESTRATEGIA_DEPT_AGENTS = STRATEGY_DEPT_AGENTS
export const INNOVACION_DEPT_AGENTS = [AGENT_METADATA['spark']]

export const OPERACIONES_DEPT_AGENTS: AgentMetadata[] = [
  AGENT_METADATA['ledger'],
  AGENT_METADATA['pulse'],
  AGENT_METADATA['onboard'],
  AGENT_METADATA['harbor'],
]

export const FINANZAS_DEPT_AGENTS: AgentMetadata[] = [
  AGENT_METADATA['midas'],
  AGENT_METADATA['quant'],
  AGENT_METADATA['fiscal'],
]
