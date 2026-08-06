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
  // 'coming_soon': tarjeta visible pero conexión deshabilitada (OAuth aún no implementado — el endpoint responde 503)
  status: 'connected' | 'disconnected' | 'locked' | 'coming_soon'
  authType: 'api-key' | 'oauth' | 'native'
}

export const AUTH_TYPE_LABELS = {
  'api-key': 'Requires API Key',
  'oauth': 'Requires OAuth',
  'native': 'Native Integration',
} as const

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
    authType: 'oauth',
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
    status: 'coming_soon',
    authType: 'oauth',
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
    agentsUnlocked: ['noa', 'alex'],
    departments: ['marketing', 'admin'],
    isCritical: true,
    status: 'disconnected',
    authType: 'api-key',
  },
  {
    id: 'hootsuite',
    name: 'Hootsuite',
    emoji: '🚀',
    category: 'Social Media',
    description: 'Multi-platform social management and analytics',
    pricing: 'via_subscription',
    setupUrl: 'https://hootsuite.com',
    agentsUnlocked: ['noa', 'alex', 'luna'],
    departments: ['marketing'],
    isCritical: false,
    status: 'disconnected',
    authType: 'api-key',
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
    status: 'coming_soon',
    authType: 'oauth',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    emoji: '💼',
    category: 'CRM',
    description: 'CRM and sales pipeline management for deal tracking',
    pricing: 'paid',
    setupUrl: 'https://salesforce.com',
    agentsUnlocked: ['quinn', 'nova', 'fiscal'],
    departments: ['sales', 'finance'],
    isCritical: true,
    status: 'coming_soon',
    authType: 'oauth',
  },
  {
    id: 'apollo',
    name: 'Apollo.io',
    emoji: '🚀',
    category: 'Sales',
    description: 'B2B contact database — powers Discovery "deep mode" (real companies + contacts by ICP)',
    pricing: 'paid',
    setupUrl: 'https://www.apollo.io',
    agentsUnlocked: ['rex'],
    departments: ['sales'],
    isCritical: false,
    status: 'disconnected',
    authType: 'api-key',
  },
  {
    id: 'hunter',
    name: 'Hunter.io',
    emoji: '✉️',
    category: 'Sales',
    description: 'Verified email finder — confirms real, deliverable emails for Discovery "deep mode"',
    pricing: 'paid',
    setupUrl: 'https://hunter.io',
    agentsUnlocked: ['rex'],
    departments: ['sales'],
    isCritical: false,
    status: 'disconnected',
    authType: 'api-key',
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
    agentsUnlocked: ['alex', 'pulse', 'harbor'],
    departments: ['admin', 'marketing', 'sales'],
    isCritical: false,
    status: 'coming_soon',
    authType: 'oauth',
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
    status: 'coming_soon',
    authType: 'oauth',
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    emoji: '☁️',
    category: 'Productivity',
    description: 'Cloud storage & document management for shared files and collaboration',
    pricing: 'free',
    setupUrl: 'https://drive.google.com',
    agentsUnlocked: ['onboard', 'midas', 'quant', 'zoe'],
    departments: ['admin', 'finance', 'strategy', 'marketing'],
    isCritical: false,
    status: 'disconnected',
    authType: 'oauth',
  },

  // AI Integration Tools
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
    authType: 'api-key',
  },
  {
    id: 'openai',
    name: 'OpenAI (Images)',
    emoji: '⚡',
    category: 'AI',
    description: 'AI image generation (gpt-image-1) for posts and decks',
    pricing: 'via_subscription',
    setupUrl: 'https://platform.openai.com',
    agentsUnlocked: ['zoe', 'nova', 'spark', 'midas'],
    departments: ['marketing', 'innovation', 'strategy'],
    isCritical: false,
    status: 'disconnected',
    authType: 'api-key',
  },

  // Media & Design Enhancement Tools
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
    authType: 'api-key',
  },
  {
    id: 'magnific',
    name: 'Magnific AI',
    emoji: '✨',
    category: 'Media',
    description: 'Upscale and enhance images with AI — powered by Freepik',
    pricing: 'via_subscription',
    // Magnific no tiene API propia desde que la compró Freepik: la key que
    // hay que pegar aquí es la de Freepik (Dashboard → API).
    setupUrl: 'https://www.freepik.com/api',
    agentsUnlocked: ['zoe', 'nova', 'spark'],
    departments: ['marketing', 'innovation'],
    isCritical: false,
    status: 'disconnected',
    authType: 'api-key',
  },
]
