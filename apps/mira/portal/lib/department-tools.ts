// Department tools configuration - which tools unlock which agents
// Gamification system: connect tool → unlock agents → incentivize expansion

export type DepartmentSlug = 'marketing' | 'sales' | 'strategy' | 'innovation' | 'admin' | 'finance'
export type ToolType = 'canva' | 'figma' | 'buffer' | 'hootsuite' | 'linkedin-navigator' | 'salesforce' | 'slack' | 'google-workspace'

export interface DepartmentTool {
  id: ToolType
  name: string
  emoji: string
  description: string
  category: 'design' | 'scheduling' | 'analytics' | 'crm' | 'productivity'
  agentsUnlocked: string[] // agent IDs that work with this tool
  departments: DepartmentSlug[] // which departments can use this tool
  priority: 'critical' | 'high' | 'medium' | 'nice-to-have'
  setupUrl?: string
  icon?: string
}

export const DEPARTMENT_TOOLS: Record<ToolType, DepartmentTool> = {
  canva: {
    id: 'canva',
    name: 'Canva',
    emoji: '🎨',
    description: 'Design & visual content creation',
    category: 'design',
    agentsUnlocked: ['zoe', 'nova', 'luna'],
    departments: ['marketing', 'innovation'],
    priority: 'critical',
    setupUrl: '/setup/canva',
  },
  figma: {
    id: 'figma',
    name: 'Figma',
    emoji: '🖌️',
    description: 'UI/UX design & prototyping',
    category: 'design',
    agentsUnlocked: ['zoe', 'spark'],
    departments: ['marketing', 'innovation'],
    priority: 'high',
  },
  buffer: {
    id: 'buffer',
    name: 'Buffer',
    emoji: '📅',
    description: 'Social media scheduling',
    category: 'scheduling',
    agentsUnlocked: ['noa', 'alex'],
    departments: ['marketing', 'admin'],
    priority: 'high',
  },
  hootsuite: {
    id: 'hootsuite',
    name: 'Hootsuite',
    emoji: '🚀',
    description: 'Multi-platform social management',
    category: 'scheduling',
    agentsUnlocked: ['noa', 'alex', 'luna'],
    departments: ['marketing'],
    priority: 'high',
  },
  'linkedin-navigator': {
    id: 'linkedin-navigator',
    name: 'LinkedIn Sales Navigator',
    emoji: '🔍',
    description: 'Advanced lead discovery',
    category: 'crm',
    agentsUnlocked: ['rex', 'vera', 'finn'],
    departments: ['sales', 'strategy'],
    priority: 'critical',
  },
  salesforce: {
    id: 'salesforce',
    name: 'Salesforce',
    emoji: '💼',
    description: 'CRM & sales pipeline',
    category: 'crm',
    agentsUnlocked: ['quinn', 'nova', 'fiscal'],
    departments: ['sales', 'finance'],
    priority: 'critical',
  },
  slack: {
    id: 'slack',
    name: 'Slack',
    emoji: '💬',
    description: 'Team communication',
    category: 'productivity',
    agentsUnlocked: ['alex', 'pulse', 'harbor'],
    departments: ['admin', 'marketing', 'sales'],
    priority: 'medium',
  },
  'google-workspace': {
    id: 'google-workspace',
    name: 'Google Workspace',
    emoji: '📊',
    description: 'Docs, Sheets, Gmail integration',
    category: 'productivity',
    agentsUnlocked: ['onboard', 'midas', 'quant'],
    departments: ['admin', 'finance', 'strategy'],
    priority: 'medium',
  },
}

// Recommended tools per department (for onboarding)
export const DEPARTMENT_TOOL_RECOMMENDATIONS: Record<DepartmentSlug, ToolType[]> = {
  marketing: ['canva', 'buffer', 'hootsuite', 'slack'],
  sales: ['linkedin-navigator', 'salesforce', 'slack'],
  strategy: ['linkedin-navigator', 'google-workspace', 'slack'],
  innovation: ['canva', 'figma', 'slack'],
  admin: ['slack', 'google-workspace', 'buffer'],
  finance: ['google-workspace', 'salesforce', 'slack'],
}

// Get tools by department
export function getDepartmentTools(dept: DepartmentSlug): DepartmentTool[] {
  return Object.values(DEPARTMENT_TOOLS).filter(tool =>
    tool.departments.includes(dept)
  ).sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, 'nice-to-have': 3 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

// Get agents unlocked by a tool
export function getAgentsForTool(toolId: ToolType): string[] {
  return DEPARTMENT_TOOLS[toolId]?.agentsUnlocked || []
}

// Get tools needed for an agent
export function getToolsForAgent(agentId: string): DepartmentTool[] {
  return Object.values(DEPARTMENT_TOOLS).filter(tool =>
    tool.agentsUnlocked.includes(agentId)
  )
}

// Calculate tool adoption score (0-100)
export function calculateDepartmentToolScore(
  dept: DepartmentSlug,
  connectedTools: ToolType[]
): number {
  const recommendedTools = DEPARTMENT_TOOL_RECOMMENDATIONS[dept]
  if (recommendedTools.length === 0) return 0
  const connected = connectedTools.filter(t =>
    recommendedTools.includes(t)
  ).length
  return Math.round((connected / recommendedTools.length) * 100)
}

// Get unlock suggestions: what tool would unlock the most agents
export function getNextUnlockSuggestion(
  dept: DepartmentSlug,
  connectedTools: ToolType[]
): DepartmentTool | null {
  const available = getDepartmentTools(dept)
  const notConnected = available.filter(t => !connectedTools.includes(t.id))
  // Prioritize high/critical tools with most agent unlocks
  return (
    notConnected.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, 'nice-to-have': 3 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return b.agentsUnlocked.length - a.agentsUnlocked.length
    })[0] || null
  )
}
