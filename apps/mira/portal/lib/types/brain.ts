export type ResourceType = 'logo' | 'social_profile' | 'presentation' | 'document' | 'reference_url'

export type SocialChannel = 'linkedin' | 'twitter' | 'instagram' | 'tiktok' | 'youtube' | 'discord'

export type TriggeredBy = 'user' | 'agent' | 'system'

export interface BrainVersion {
  id: string
  client_id: string
  version_number: number
  snapshot: Record<string, any>
  change_summary: string | null
  triggered_by: TriggeredBy
  triggered_by_agent_id: string | null
  created_at: string
}

export interface BrainResource {
  id: string
  client_id: string
  resource_type: ResourceType
  channel: SocialChannel | null
  name: string
  url: string | null
  file_path: string | null
  metadata: Record<string, any>
  connected_at: string
  updated_at: string
}

export interface BrainLearning {
  id: string
  client_id: string
  agent_id: string
  department_slug: string
  learning_text: string
  evidence: Record<string, any> | null
  user_validated: boolean | null
  created_at: string
  updated_at: string
}

export interface BrainChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  proposal?: {
    section: string
    value: string
    reason: string
  }
}
