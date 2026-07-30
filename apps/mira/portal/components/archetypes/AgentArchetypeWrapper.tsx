'use client'
import { getArchetype } from '@/lib/agent-archetypes'
import OracleArchetype from './OracleArchetype'
import AnalystArchetype from './AnalystArchetype'
import ExplorerArchetype from './ExplorerArchetype'
import ArchitectArchetype from './ArchitectArchetype'
import SentinelArchetype from './SentinelArchetype'
import StudioArchetype from './StudioArchetype'
import type { AgentArchetype } from '@/lib/agent-archetypes'

interface AgentArchetypeWrapperProps {
  agentId: string
  agentName: string
  agentColor: string
  agentEmoji: string
  // Pass through any archetype-specific props
  [key: string]: any
}

export default function AgentArchetypeWrapper({
  agentId,
  agentName,
  agentColor,
  agentEmoji,
  ...props
}: AgentArchetypeWrapperProps) {
  const archetype = getArchetype(agentId)

  const mergedProps = {
    agentColor,
    agentEmoji,
    agentName,
    ...props,
  }

  switch (archetype) {
    case 'ORACLE':
      return <OracleArchetype {...mergedProps} />

    case 'ANALYST':
      return <AnalystArchetype {...mergedProps} />

    case 'EXPLORER':
      return <ExplorerArchetype {...mergedProps} />

    case 'ARCHITECT':
      return <ArchitectArchetype {...mergedProps} />

    case 'SENTINEL':
      return <SentinelArchetype {...mergedProps} />

    case 'STUDIO':
      return <StudioArchetype {...mergedProps} />

    default:
      // Fallback to ORACLE for unknown archetypes
      return <OracleArchetype {...mergedProps} />
  }
}
