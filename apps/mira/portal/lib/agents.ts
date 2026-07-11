// Types
export type AgentStatus = 'active' | 'inactive' | 'pending' | 'idle' | 'processing' | 'complete'

const baseAgents = [
  {
    id: 'ai-strategist',
    name: 'AI Strategist',
    description: 'Strategic planning and business analysis',
    icon: '🎯',
    emoji: '🎯',
    color: '#8B5CF6',
    gradient: 'from-purple-500 to-pink-500',
    capabilities: ['Strategic Planning', 'Business Analysis', 'Market Research'],
  },
  {
    id: 'content-creator',
    name: 'Content Creator',
    description: 'Content generation and copywriting',
    icon: '✍️',
    emoji: '✍️',
    color: '#EC4899',
    gradient: 'from-pink-500 to-rose-500',
    capabilities: ['Copywriting', 'Content Strategy', 'Editorial Planning'],
  },
  {
    id: 'brand-expert',
    name: 'Brand Expert',
    description: 'Brand strategy and positioning',
    icon: '🏷️',
    emoji: '🏷️',
    color: '#06B6D4',
    gradient: 'from-cyan-500 to-blue-500',
    capabilities: ['Brand Strategy', 'Positioning', 'Visual Identity'],
  },
  {
    id: 'seo-specialist',
    name: 'SEO Specialist',
    description: 'SEO optimization and keyword research',
    icon: '🔍',
    emoji: '🔍',
    color: '#F59E0B',
    gradient: 'from-amber-500 to-orange-500',
    capabilities: ['Keyword Research', 'On-page SEO', 'Technical SEO'],
  },
  {
    id: 'marketing-manager',
    name: 'Marketing Manager',
    description: 'Marketing campaigns and strategy',
    icon: '📢',
    emoji: '📢',
    color: '#10B981',
    gradient: 'from-emerald-500 to-teal-500',
    capabilities: ['Campaign Strategy', 'Budget Allocation', 'Performance Tracking'],
  },
]

export type Agent = typeof baseAgents[0]

export const AGENTS = baseAgents
export const ALL_AGENTS = baseAgents
export const INNOVACION_AGENTS = baseAgents.slice(0, 4)
export const COMERCIAL_AGENTS = baseAgents.slice(0, 4)
export const ESTRATEGIA_AGENTS = baseAgents.slice(0, 4)
export const FINANZAS_AGENTS = baseAgents.slice(0, 4)
export const ADMIN_AGENTS = baseAgents.slice(0, 4)

export const AGENT_PROMPTS: Record<string, string> = {
  'ai-strategist': 'You are a strategic business advisor...',
  'content-creator': 'You are a creative content specialist...',
  'brand-expert': 'You are a brand strategy expert...',
  'seo-specialist': 'You are an SEO optimization specialist...',
  'marketing-manager': 'You are a marketing strategy manager...',
}
