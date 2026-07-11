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
  },
  {
    id: 'content-creator',
    name: 'Content Creator',
    description: 'Content generation and copywriting',
    icon: '✍️',
    emoji: '✍️',
    color: '#EC4899',
  },
  {
    id: 'brand-expert',
    name: 'Brand Expert',
    description: 'Brand strategy and positioning',
    icon: '🏷️',
    emoji: '🏷️',
    color: '#06B6D4',
  },
  {
    id: 'seo-specialist',
    name: 'SEO Specialist',
    description: 'SEO optimization and keyword research',
    icon: '🔍',
    emoji: '🔍',
    color: '#F59E0B',
  },
  {
    id: 'marketing-manager',
    name: 'Marketing Manager',
    description: 'Marketing campaigns and strategy',
    icon: '📢',
    emoji: '📢',
    color: '#10B981',
  },
]

export type Agent = typeof baseAgents[0]

export const AGENTS = baseAgents
export const ALL_AGENTS = baseAgents
export const INNOVACION_AGENTS = baseAgents
export const COMERCIAL_AGENTS = baseAgents
export const ESTRATEGIA_AGENTS = baseAgents
export const FINANZAS_AGENTS = baseAgents

export const AGENT_PROMPTS: Record<string, string> = {
  'ai-strategist': 'You are a strategic business advisor...',
  'content-creator': 'You are a creative content specialist...',
  'brand-expert': 'You are a brand strategy expert...',
  'seo-specialist': 'You are an SEO optimization specialist...',
  'marketing-manager': 'You are a marketing strategy manager...',
}
