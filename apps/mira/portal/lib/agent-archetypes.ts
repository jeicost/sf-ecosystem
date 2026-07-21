// Maps agents to their workflow archetypes
// Archetypes: ORACLE, ANALYST, EXPLORER, ARCHITECT, SENTINEL, STUDIO

export type AgentArchetype = 'ORACLE' | 'ANALYST' | 'EXPLORER' | 'ARCHITECT' | 'SENTINEL' | 'STUDIO'

export const AGENT_ARCHETYPE_MAP: Record<string, AgentArchetype> = {
  // ORACLE — Content & idea generators
  alex: 'ORACLE',
  kai: 'ORACLE',

  // ANALYST — Scoring & evaluation
  vera: 'ANALYST',
  atlas: 'ANALYST',
  quant: 'ANALYST',
  fiscal: 'ANALYST',

  // EXPLORER — Discovery & research
  rex: 'EXPLORER',

  // ARCHITECT — Planning & structuring
  marco: 'ARCHITECT',
  blueprint: 'ARCHITECT',
  midas: 'ARCHITECT',
  noa: 'ARCHITECT',
  onboard: 'ARCHITECT',

  // SENTINEL — Monitoring & alerts
  pulse: 'SENTINEL',
  harbor: 'SENTINEL', // Customer support
  sam: 'SENTINEL', // Community monitoring
  luna: 'SENTINEL', // Strategy monitoring

  // STUDIO — Visual content creation
  zoe: 'STUDIO', // Post design & graphics
  nova: 'STUDIO', // Video editor
  spark: 'STUDIO', // Visual ideation

  // Strategy agents that can use both ORACLE and ARCHITECT
  strategos: 'ARCHITECT',
}

export function getArchetype(agentId: string): AgentArchetype {
  return AGENT_ARCHETYPE_MAP[agentId] || 'ORACLE'
}

// Customize per-agent settings within an archetype
export const ARCHETYPE_CUSTOMIZATIONS: Record<string, Record<string, any>> = {
  alex: {
    libraryLabel: 'Frases & Headlines',
    engagementMetric: 'engagement',
    previewPlatform: 'Instagram',
  },
  kai: {
    libraryLabel: 'Video Templates',
    engagementMetric: 'watch_time',
    previewPlatform: 'YouTube',
  },
  vera: {
    tableName: 'Leads',
    scoringThresholds: { hot: 75, warm: 50, cold: 0 },
    insightType: 'buying_signals',
  },
  rex: {
    filterLabel: 'Search Criteria',
    resultGroups: ['HOT', 'WARM', 'COLD'],
    deepDiveLabel: 'Lead Intelligence',
  },
  marco: {
    templateTypes: [
      '90-day GTM',
      'Product Launch',
      'Rebranding Campaign',
      'Partnership Strategy',
      'Custom Brief',
    ],
    stepCount: 5,
  },
  zoe: {
    projectTypes: ['post', 'video', 'thumbnail'],
    primaryTool: 'canva',
    supportedTools: ['canva', 'figma'],
  },
  nova: {
    projectTypes: ['video', 'reel', 'short'],
    primaryTool: 'canva',
    supportedTools: ['canva', 'descript'],
  },
}
