export interface MarketplaceTool {
  id: string
  name: string
  emoji: string
  category: string
  description: string
  pricing: 'free' | 'paid' | 'via_subscription'
  setupUrl: string
  agentsUnlocked: string[]
  departments: string[]
  isCritical: boolean
  affiliateUrl?: string
  status: 'connected' | 'disconnected' | 'locked'
}

export const MARKETPLACE_TOOLS: MarketplaceTool[] = [
  // Design Tools
  {
    id: 'canva',
    name: 'Canva',
    emoji: '🎨',
    category: 'Design',
    description: 'Design & visual content creation for all marketing assets, posts, and graphics',
    pricing: 'via_subscription',
    setupUrl: 'https://www.canva.com',
    agentsUnlocked: ['zoe', 'nova', 'luna'],
    departments: ['marketing', 'innovation'],
    isCritical: true,
    affiliateUrl: 'https://canva.com/affiliate',
    status: 'disconnected',
  },
  {
    id: 'figma',
    name: 'Figma',
    emoji: '🖌️',
    category: 'Design',
    description: 'UI/UX design & prototyping for digital products and interfaces',
    pricing: 'via_subscription',
    setupUrl: 'https://www.figma.com',
    agentsUnlocked: ['zoe', 'spark'],
    departments: ['marketing', 'innovation'],
    isCritical: false,
    status: 'disconnected',
  },

  // Social Media Tools
  {
    id: 'buffer',
    name: 'Buffer',
    emoji: '📅',
    category: 'Social Media',
    description: 'Social media scheduling and content calendar management',
    pricing: 'via_subscription',
    setupUrl: 'https://buffer.com',
    agentsUnlocked: ['noa', 'herald'],
    departments: ['marketing', 'admin'],
    isCritical: true,
    status: 'disconnected',
  },
  {
    id: 'hootsuite',
    name: 'Hootsuite',
    emoji: '🚀',
    category: 'Social Media',
    description: 'Multi-platform social management and analytics',
    pricing: 'via_subscription',
    setupUrl: 'https://hootsuite.com',
    agentsUnlocked: ['noa', 'herald', 'luna'],
    departments: ['marketing'],
    isCritical: false,
    status: 'disconnected',
  },

  // Sales & CRM Tools
  {
    id: 'linkedin-navigator',
    name: 'LinkedIn Sales Navigator',
    emoji: '🔍',
    category: 'Sales',
    description: 'Advanced lead discovery and B2B prospect research',
    pricing: 'via_subscription',
    setupUrl: 'https://business.linkedin.com/sales-solutions',
    agentsUnlocked: ['rex', 'vera', 'finn'],
    departments: ['sales', 'strategy'],
    isCritical: true,
    status: 'disconnected',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    emoji: '💼',
    category: 'CRM',
    description: 'CRM and sales pipeline management for deal tracking',
    pricing: 'paid',
    setupUrl: 'https://salesforce.com',
    agentsUnlocked: ['quinn', 'nova', 'ledger'],
    departments: ['sales', 'finance'],
    isCritical: true,
    status: 'disconnected',
  },

  // Communication & Productivity
  {
    id: 'slack',
    name: 'Slack',
    emoji: '💬',
    category: 'Communication',
    description: 'Team communication and real-time notifications',
    pricing: 'via_subscription',
    setupUrl: 'https://slack.com',
    agentsUnlocked: ['herald', 'pulse', 'compliance'],
    departments: ['admin', 'marketing', 'sales'],
    isCritical: false,
    status: 'disconnected',
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    emoji: '📊',
    category: 'Productivity',
    description: 'Docs, Sheets, and Gmail integration for document collaboration',
    pricing: 'via_subscription',
    setupUrl: 'https://workspace.google.com',
    agentsUnlocked: ['onboard', 'midas', 'quant'],
    departments: ['admin', 'finance', 'strategy'],
    isCritical: false,
    status: 'disconnected',
  },

  // AI Integration Tools (NEW)
  {
    id: 'anthropic',
    name: 'Claude (Anthropic)',
    emoji: '🧠',
    category: 'AI',
    description: 'Use Claude for AI proposals in Brand Brain',
    pricing: 'via_subscription',
    setupUrl: 'https://console.anthropic.com',
    agentsUnlocked: ['zoe', 'nova', 'spark', 'midas'],
    departments: ['marketing', 'innovation', 'strategy'],
    isCritical: false,
    status: 'disconnected',
  },
  {
    id: 'openai',
    name: 'OpenAI (GPT)',
    emoji: '⚡',
    category: 'AI',
    description: 'Use GPT-4 for AI proposals',
    pricing: 'via_subscription',
    setupUrl: 'https://platform.openai.com',
    agentsUnlocked: ['zoe', 'nova', 'spark', 'midas'],
    departments: ['marketing', 'innovation', 'strategy'],
    isCritical: false,
    status: 'disconnected',
  },

  // Media & Design Enhancement Tools (NEW)
  {
    id: 'freepik',
    name: 'Freepik',
    emoji: '🎭',
    category: 'Media',
    description: 'Access millions of design resources',
    pricing: 'via_subscription',
    setupUrl: 'https://www.freepik.com',
    agentsUnlocked: ['zoe', 'luna', 'spark'],
    departments: ['marketing', 'innovation'],
    isCritical: false,
    status: 'disconnected',
  },
  {
    id: 'magnific',
    name: 'Magnific AI',
    emoji: '✨',
    category: 'Media',
    description: 'Upscale and enhance images with AI',
    pricing: 'via_subscription',
    setupUrl: 'https://www.magnific.ai',
    agentsUnlocked: ['zoe', 'nova', 'spark'],
    departments: ['marketing', 'innovation'],
    isCritical: false,
    status: 'disconnected',
  },
]
