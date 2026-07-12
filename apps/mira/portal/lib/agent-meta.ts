// Centralized agent metadata for routing + UI
// Used by /api/agent, /agent/[role], DepartmentAgents, etc.

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
  department: 'comercial' | 'marketing' | 'estrategia' | 'operaciones'
}

export const AGENT_METADATA: Record<string, AgentMetadata> = {
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
}

// Department filtering for sidebar cards
export const COMERCIAL_DEPT_AGENTS: AgentMetadata[] = [
  AGENT_METADATA['orchestrator'],
  AGENT_METADATA['lead-scout'],
  AGENT_METADATA['icp-scorer'],
  AGENT_METADATA['icebreaker-writer'],
]

export const MARKETING_DEPT_AGENTS: AgentMetadata[] = [
  AGENT_METADATA['content-strategist'],
  AGENT_METADATA['copywriter'],
  AGENT_METADATA['herald'],
  AGENT_METADATA['social-media-manager'],
]

export const ESTRATEGIA_DEPT_AGENTS: AgentMetadata[] = [
  AGENT_METADATA['strategos'],
  AGENT_METADATA['blueprint'],
]

export const OPERACIONES_DEPT_AGENTS: AgentMetadata[] = [
  AGENT_METADATA['ledger'],
  AGENT_METADATA['pulse'],
]
