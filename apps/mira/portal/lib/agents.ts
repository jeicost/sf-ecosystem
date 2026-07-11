const baseAgents = [
  {
    id: 'ai-strategist',
    name: 'AI Strategist',
    description: 'Strategic planning and business analysis',
    icon: '🎯',
  },
  {
    id: 'content-creator',
    name: 'Content Creator',
    description: 'Content generation and copywriting',
    icon: '✍️',
  },
  {
    id: 'brand-expert',
    name: 'Brand Expert',
    description: 'Brand strategy and positioning',
    icon: '🏷️',
  },
  {
    id: 'seo-specialist',
    name: 'SEO Specialist',
    description: 'SEO optimization and keyword research',
    icon: '🔍',
  },
  {
    id: 'marketing-manager',
    name: 'Marketing Manager',
    description: 'Marketing campaigns and strategy',
    icon: '📢',
  },
]

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
