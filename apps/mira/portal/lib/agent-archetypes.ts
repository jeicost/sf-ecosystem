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

// NOTA: existió aquí un ARCHETYPE_CUSTOMIZATIONS keyed por nombre de persona
// ('alex', 'vera'...) mientras AgentArchetypeWrapper siempre recibe el slug
// de rol ('copywriter', 'icp-scorer'...) — nunca hizo match, así que ningún
// componente llegó a leer sus campos (verificado por grep, 2026-07-30).
// Eliminado en vez de re-keyeado: los ajustes por agente que sí importan
// (scoring thresholds, qué tool_slug consultar, etc.) viven ahora en los
// fetchers reales de lib/{oracle,analyst,explorer,architect,sentinel}-data.ts.
