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
  description: string
  color: string
  gradient: string
  department: 'comercial' | 'marketing' | 'estrategia' | 'operaciones' | 'innovacion' | 'finanzas'
}

export const AGENT_METADATA: Record<string, AgentMetadata> = {
  // Comercial (4)
  orchestrator: {
    id: 'orchestrator',
    name: 'Marco',
    emoji: '🎯',
    description: 'Estratega y coordinador de campañas',
    color: '#8B5CF6',
    gradient: 'from-purple-600 to-indigo-600',
    department: 'comercial',
  },
  'lead-scout': {
    id: 'lead-scout',
    name: 'Rex',
    emoji: '🔍',
    description: 'Descubridor de oportunidades',
    color: '#06B6D4',
    gradient: 'from-cyan-500 to-blue-500',
    department: 'comercial',
  },
  'icp-scorer': {
    id: 'icp-scorer',
    name: 'Vera',
    emoji: '📊',
    description: 'Evaluador de leads y ICP',
    color: '#F59E0B',
    gradient: 'from-amber-500 to-orange-500',
    department: 'comercial',
  },
  'icebreaker-writer': {
    id: 'icebreaker-writer',
    name: 'Finn',
    emoji: '💬',
    description: 'Experto en mensajes personalizados',
    color: '#EC4899',
    gradient: 'from-pink-500 to-rose-500',
    department: 'comercial',
  },
  scout: {
    id: 'scout',
    name: 'Scout',
    emoji: '🔭',
    description: 'Explorador de mercados',
    color: '#06B6D4',
    gradient: 'from-cyan-500 to-blue-500',
    department: 'comercial',
  },
  'reply-qualifier': {
    id: 'reply-qualifier',
    name: 'Quinn',
    emoji: '✅',
    description: 'Calificador de respuestas',
    color: '#10B981',
    gradient: 'from-green-400 to-emerald-500',
    department: 'comercial',
  },
  'proposal-writer': {
    id: 'proposal-writer',
    name: 'Nova',
    emoji: '📝',
    description: 'Redactor de propuestas',
    color: '#8B5CF6',
    gradient: 'from-purple-500 to-indigo-600',
    department: 'comercial',
  },

  // Marketing (6)
  'content-strategist': {
    id: 'content-strategist',
    name: 'Luna',
    emoji: '📋',
    description: 'Estratega de contenido',
    color: '#10B981',
    gradient: 'from-emerald-500 to-teal-500',
    department: 'marketing',
  },
  copywriter: {
    id: 'copywriter',
    name: 'Alex',
    emoji: '✍️',
    description: 'Redactor de copy',
    color: '#EC4899',
    gradient: 'from-pink-500 to-rose-500',
    department: 'marketing',
  },
  herald: {
    id: 'herald',
    name: 'Herald',
    emoji: '📢',
    description: 'Comunicador de marcas',
    color: '#6366F1',
    gradient: 'from-indigo-500 to-violet-600',
    department: 'marketing',
  },
  'social-media-manager': {
    id: 'social-media-manager',
    name: 'Noa',
    emoji: '📱',
    description: 'Gestor de redes sociales',
    color: '#8B5CF6',
    gradient: 'from-purple-500 to-pink-500',
    department: 'marketing',
  },
  designer: {
    id: 'designer',
    name: 'Zoe',
    emoji: '🎨',
    description: 'Directora creativa',
    color: '#EC4899',
    gradient: 'from-pink-500 to-rose-600',
    department: 'marketing',
  },
  'video-editor': {
    id: 'video-editor',
    name: 'Kai',
    emoji: '🎬',
    description: 'Editor de vídeos',
    color: '#EC4899',
    gradient: 'from-pink-500 to-red-500',
    department: 'marketing',
  },
  'ads-manager': {
    id: 'ads-manager',
    name: 'Riva',
    emoji: '📣',
    description: 'Gestor de campañas publicitarias',
    color: '#F97316',
    gradient: 'from-orange-500 to-red-500',
    department: 'marketing',
  },
  'community-manager': {
    id: 'community-manager',
    name: 'Sam',
    emoji: '👥',
    description: 'Gestor de comunidad',
    color: '#06B6D4',
    gradient: 'from-cyan-400 to-blue-500',
    department: 'marketing',
  },

  // Estrategia (5)
  strategos: {
    id: 'strategos',
    name: 'Strategos',
    emoji: '♟️',
    description: 'Estratega maestro',
    color: '#7C3AED',
    gradient: 'from-violet-600 to-purple-600',
    department: 'estrategia',
  },
  blueprint: {
    id: 'blueprint',
    name: 'Blueprint',
    emoji: '🏗️',
    description: 'Arquitecto de planes',
    color: '#06B6D4',
    gradient: 'from-cyan-500 to-blue-500',
    department: 'estrategia',
  },
  atlas: {
    id: 'atlas',
    name: 'Atlas',
    emoji: '🗺️',
    description: 'Cartógrafo de tendencias',
    color: '#3B82F6',
    gradient: 'from-blue-500 to-cyan-500',
    department: 'estrategia',
  },
  kairos: {
    id: 'kairos',
    name: 'Kairos',
    emoji: '⏰',
    description: 'Experto en timing estratégico',
    color: '#D946EF',
    gradient: 'from-fuchsia-500 to-purple-600',
    department: 'estrategia',
  },
  radar: {
    id: 'radar',
    name: 'Radar',
    emoji: '📡',
    description: 'Detector de oportunidades',
    color: '#06B6D4',
    gradient: 'from-cyan-500 to-blue-600',
    department: 'estrategia',
  },
  venture: {
    id: 'venture',
    name: 'Venture',
    emoji: '🚀',
    description: 'Arquitecto de negocios',
    color: '#8B5CF6',
    gradient: 'from-purple-500 to-indigo-600',
    department: 'estrategia',
  },
  oracle: {
    id: 'oracle',
    name: 'Oracle',
    emoji: '🔮',
    description: 'Visionario de futuros',
    color: '#7C3AED',
    gradient: 'from-violet-500 to-purple-600',
    department: 'estrategia',
  },

  // Operaciones (4)
  ledger: {
    id: 'ledger',
    name: 'Ledger',
    emoji: '💳',
    description: 'Gestor de finanzas',
    color: '#6366F1',
    gradient: 'from-indigo-500 to-violet-700',
    department: 'operaciones',
  },
  pulse: {
    id: 'pulse',
    name: 'Pulse',
    emoji: '📈',
    description: 'Monitor de métricas',
    color: '#10B981',
    gradient: 'from-green-500 to-emerald-600',
    department: 'operaciones',
  },
  onboard: {
    id: 'onboard',
    name: 'Onboard',
    emoji: '🎓',
    description: 'Entrenador de equipos',
    color: '#3B82F6',
    gradient: 'from-blue-500 to-indigo-600',
    department: 'operaciones',
  },
  harbor: {
    id: 'harbor',
    name: 'Harbor',
    emoji: '⚓',
    description: 'Ancla de estabilidad',
    color: '#10B981',
    gradient: 'from-green-500 to-teal-600',
    department: 'operaciones',
  },

  // Innovación (1)
  spark: {
    id: 'spark',
    name: 'Spark',
    emoji: '⚡',
    description: 'Generador de ideas',
    color: '#FBBF24',
    gradient: 'from-amber-400 to-orange-500',
    department: 'innovacion',
  },

  // Finanzas (3)
  midas: {
    id: 'midas',
    name: 'Midas',
    emoji: '💰',
    description: 'Optimizador de ingresos',
    color: '#FBBF24',
    gradient: 'from-yellow-400 to-orange-500',
    department: 'finanzas',
  },
  quant: {
    id: 'quant',
    name: 'Quant',
    emoji: '🧮',
    description: 'Analista de datos',
    color: '#3B82F6',
    gradient: 'from-blue-500 to-cyan-600',
    department: 'finanzas',
  },
  fiscal: {
    id: 'fiscal',
    name: 'Fiscal',
    emoji: '📊',
    description: 'Auditor financiero',
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

export const ESTRATEGIA_DEPT_AGENTS: AgentMetadata[] = [
  AGENT_METADATA['strategos'],
  AGENT_METADATA['blueprint'],
  AGENT_METADATA['atlas'],
  AGENT_METADATA['kairos'],
  AGENT_METADATA['radar'],
  AGENT_METADATA['venture'],
  AGENT_METADATA['oracle'],
]

export const OPERACIONES_DEPT_AGENTS: AgentMetadata[] = [
  AGENT_METADATA['ledger'],
  AGENT_METADATA['pulse'],
  AGENT_METADATA['onboard'],
  AGENT_METADATA['harbor'],
]

export const INNOVACION_DEPT_AGENTS: AgentMetadata[] = [
  AGENT_METADATA['spark'],
]

export const FINANZAS_DEPT_AGENTS: AgentMetadata[] = [
  AGENT_METADATA['midas'],
  AGENT_METADATA['quant'],
  AGENT_METADATA['fiscal'],
]
