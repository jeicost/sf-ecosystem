// Maps agents to their workflow archetypes
// Archetypes: ORACLE, ANALYST, EXPLORER, ARCHITECT, SENTINEL, STUDIO

export type AgentArchetype = 'ORACLE' | 'ANALYST' | 'EXPLORER' | 'ARCHITECT' | 'SENTINEL' | 'STUDIO'

export const AGENT_ARCHETYPE_MAP: Record<string, AgentArchetype> = {
  // P4 (2026-07-29): claves por SLUG de rol (el routing real de /agent/[role])
  // — antes iban por nombre de persona ('alex', 'vera'…) y solo ~9/23
  // matcheaban; faltaban finn/quinn/riva y nova/kai estaban invertidos.

  // COMERCIAL
  'orchestrator': 'ARCHITECT',      // Marco — planifica el pipeline
  'lead-scout': 'EXPLORER',         // Rex — descubrimiento
  'icp-scorer': 'ANALYST',          // Vera — scoring
  'icebreaker-writer': 'ORACLE',    // Finn — generación de copy
  'reply-qualifier': 'ANALYST',     // Quinn — evaluación de respuestas
  'proposal-writer': 'ARCHITECT',   // Nova — estructura propuestas

  // MARKETING
  'content-strategist': 'ARCHITECT', // Luna — planifica el sistema
  'copywriter': 'ORACLE',            // Alex — generación
  'social-media-manager': 'ARCHITECT', // Noa — calendariza y estructura
  'designer': 'STUDIO',              // Zoe — visual
  'video-editor': 'STUDIO',          // Kai — visual/vídeo
  'ads-manager': 'ANALYST',          // Riva — performance
  'community-manager': 'SENTINEL',   // Sam — monitorización de comunidad

  // STRATEGY
  'strategos': 'ARCHITECT',
  'blueprint': 'ARCHITECT',
  'atlas': 'ANALYST',
  'spark': 'STUDIO',                 // ideación visual

  // OPERACIONES
  'pulse': 'SENTINEL',
  'onboard': 'ARCHITECT',
  'harbor': 'SENTINEL',

  // FINANZAS
  'midas': 'ARCHITECT',
  'quant': 'ANALYST',
  'fiscal': 'ANALYST',
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
