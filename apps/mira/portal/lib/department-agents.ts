// Real agents for each department, based on AGENT_METADATA
import { AGENT_METADATA } from './agent-meta'

export const COMERCIAL_AGENTS = [
  AGENT_METADATA['orchestrator'],
  AGENT_METADATA['lead-scout'],
  AGENT_METADATA['icp-scorer'],
  AGENT_METADATA['icebreaker-writer'],
]

export const MARKETING_AGENTS = [
  AGENT_METADATA['content-strategist'],
  AGENT_METADATA['copywriter'],
  AGENT_METADATA['herald'],
  AGENT_METADATA['social-media-manager'],
]

export const ESTRATEGIA_AGENTS = [
  AGENT_METADATA['strategos'],
  AGENT_METADATA['blueprint'],
]

export const OPERACIONES_AGENTS = [
  AGENT_METADATA['ledger'],
  AGENT_METADATA['pulse'],
]
