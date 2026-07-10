export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

// ── Comercial types ───────────────────────────────────────────────────────────

export type LeadStage = 'prospected' | 'contacted' | 'replied' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'

export interface Lead {
  id: string
  client_id: string
  icp_id: string | null
  first_name: string | null
  last_name: string | null
  title: string | null
  email: string | null
  linkedin_url: string | null
  company_name: string | null
  company_website: string | null
  company_size: string | null
  industry: string | null
  geography: string | null
  stage: LeadStage
  hot_score: number | null
  bant_score: number | null
  linkedin_summary: string | null
  company_news: string | null
  trigger_event: string | null
  icebreaker_used: string | null
  first_contact_at: string | null
  last_contact_at: string | null
  source: string | null
  assigned_to: string | null
  notes: string | null
  notion_page_id: string | null
  created_at: string
  updated_at: string
}

export interface IcpProfile {
  id: string
  client_id: string
  icp_name: string | null
  industries: string[] | null
  company_sizes: string[] | null
  geographies: string[] | null
  job_titles: string[] | null
  pain_points: string[] | null
  trigger_events: string[] | null
  disqualifiers: string[] | null
  min_budget_usd: number | null
  decision_maker_signals: string[] | null
  updated_at: string
}

// ── Row types ────────────────────────────────────────────────────────────────

export interface ApprovalItem {
  id: string
  post_id: string | null
  client_id: string
  tipo: 'content' | 'community_response' | 'ads_alert'
  platform: string | null
  asset_url: string | null
  copy: string | null
  caption: string | null
  hashtags: string[] | null
  scheduled_time: string | null
  status: 'pending_review' | 'approved' | 'approved_with_edits' | 'rejected'
  tone_warning: boolean
  submitted_at: string
  reviewed_at: string | null
  reviewer_notes: string | null
  edited_copy: string | null
  edited_caption: string | null
}

export interface Alert {
  id: string
  client_id: string
  tipo: 'negative_review' | 'urgent' | 'purchase_intent' | 'competitor_campaign' | 'viral_ad' | 'performance_drop'
  canal: 'GMB' | 'Instagram' | 'WhatsApp' | 'Meta_Ads' | 'TikTok_Ads' | 'internal'
  contenido: string
  propuesta_respuesta: string | null
  status: 'open' | 'in_review' | 'resolved' | 'dismissed'
  prioridad: 'alta' | 'normal' | 'baja'
  created_at: string
  resolved_at: string | null
}

export interface AgentActivity {
  id: string
  client_id: string
  agent_name: string
  agent_role: string
  task_type: string
  post_id: string | null
  status: 'working' | 'completed' | 'failed' | 'waiting_approval'
  output_summary: string | null
  started_at: string
  completed_at: string | null
}

export interface AgentPromptVersion {
  id: string
  client_id: string
  agent_role: string
  prompt_content: string
  version: number
  is_active: boolean
  created_at: string
}

export interface BrandProfile {
  client_id: string
  brand_name: string
  mission: string | null
  tone_of_voice: Json | null
  brand_personality: string[] | null
  banned_phrases: string[] | null
  banned_topics: string[] | null
  unique_value_props: string[] | null
  visual_identity: Json | null
  competitors: Json | null
  target_audience: Json | null
  created_at: string
  updated_at: string
}

export interface ContentPillar {
  id: string
  client_id: string
  name: string
  description: string | null
  weight: number
  sub_topics: string[] | null
  example_hooks: string[] | null
  cta_patterns: string[] | null
  is_active: boolean
  created_at: string
}

export interface Client {
  id: string
  slug: string
  name: string
  icp: string
  onboarding_status: string
  logo_url: string | null
  primary_color: string | null
  created_at: string
}

export interface MiraUser {
  id: string
  auth_id: string
  email: string
  company_name: string
  role: 'sf_team' | 'client'
  subscription_tier: 'starter' | 'growth' | 'scale' | 'enterprise'
  subscription_status: 'active' | 'paused' | 'cancelled'
  billing_contact_email: string | null
  created_at: string
  updated_at: string
}

export interface MiraProject {
  id: string
  user_id: string
  name: string
  slug: string
  description: string | null
  status: 'active' | 'paused' | 'archived'
  agents_count: number
  created_at: string
  updated_at: string
}

export interface MiraProjectAccess {
  id: string
  user_id: string
  project_id: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  created_at: string
  updated_at: string
}

// ── Database type for Supabase client ────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      mira_users: {
        Row: MiraUser
        Insert: Omit<MiraUser, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<MiraUser, 'id' | 'auth_id' | 'created_at' | 'updated_at'>>
      }
      mira_projects: {
        Row: MiraProject
        Insert: Omit<MiraProject, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<MiraProject, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
      }
      mira_project_access: {
        Row: MiraProjectAccess
        Insert: Omit<MiraProjectAccess, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<MiraProjectAccess, 'id' | 'created_at' | 'updated_at'>>
      }
      clients: {
        Row: Client
        Insert: Omit<Client, 'id' | 'created_at'>
        Update: Partial<Omit<Client, 'id' | 'created_at'>>
      }
      brand_profiles: {
        Row: BrandProfile
        Insert: Omit<BrandProfile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<BrandProfile, 'created_at' | 'updated_at'>>
      }
      content_pillars: {
        Row: ContentPillar
        Insert: Omit<ContentPillar, 'id' | 'created_at'>
        Update: Partial<Omit<ContentPillar, 'id' | 'created_at'>>
      }
      approval_queue: {
        Row: ApprovalItem
        Insert: Omit<ApprovalItem, 'id' | 'submitted_at'>
        Update: Partial<Omit<ApprovalItem, 'id' | 'submitted_at'>>
      }
      alerts: {
        Row: Alert
        Insert: Omit<Alert, 'id' | 'created_at'>
        Update: Partial<Omit<Alert, 'id' | 'created_at'>>
      }
      agent_activity: {
        Row: AgentActivity
        Insert: Omit<AgentActivity, 'id' | 'started_at'>
        Update: Partial<Omit<AgentActivity, 'id' | 'started_at'>>
      }
      agent_prompt_versions: {
        Row: AgentPromptVersion
        Insert: Omit<AgentPromptVersion, 'id' | 'created_at'>
        Update: Partial<Omit<AgentPromptVersion, 'id' | 'created_at'>>
      }
      post_history: {
        Row: {
          id: string; client_id: string; pillar_id: string | null
          platform: string; content: string; performance: Json | null
          status: string; approved_by: string | null
          posted_at: string | null; created_at: string
        }
        Insert: { client_id: string; platform: string; content: string; status?: string }
        Update: { status?: string; performance?: Json; posted_at?: string }
      }
      leads: {
        Row: Lead
        Insert: Omit<Lead, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Lead, 'id' | 'client_id' | 'created_at' | 'updated_at'>>
      }
      icp_profiles: {
        Row: IcpProfile
        Insert: Omit<IcpProfile, 'id' | 'updated_at'>
        Update: Partial<Omit<IcpProfile, 'id' | 'client_id' | 'updated_at'>>
      }
    }
  }
}

export type AgentPackage = 'marketing' | 'comercial' | 'admin' | 'estrategia' | 'innovacion' | 'finanzas'

export type AgentStatus = 'idle' | 'working' | 'completed' | 'waiting'
