export interface MiraUser {
  id: string
  auth_id: string
  email: string
  company_name: string
  subscription_tier: 'starter' | 'growth' | 'scale' | 'enterprise'
  subscription_status: 'active' | 'paused' | 'cancelled'
  billing_contact_email: string | null
  created_at: string
  updated_at: string
}

export interface MiraProject {
  id: string
  user_id: string
  client_id: string | null
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
    }
  }
}
