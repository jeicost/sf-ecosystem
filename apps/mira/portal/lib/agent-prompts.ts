// Main entry point for agent prompts — delegates to i18n version
import { getAgentPromptI18n } from './agent-prompts-i18n'

type Locale = 'es' | 'en'

export function getAgentPrompt(agentId: string, locale: Locale = 'es'): string {
  return getAgentPromptI18n(agentId, locale)
}

// For backward compatibility: default to Spanish
export function getAgentPromptES(agentId: string): string {
  return getAgentPrompt(agentId, 'es')
}

export function getAgentPromptEN(agentId: string): string {
  return getAgentPrompt(agentId, 'en')
}
