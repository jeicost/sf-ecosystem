// Workspace types
export type WorkspaceType = 'sf' | 'discoolver' | 'dadybox' | 'salsaburgers'

export interface Workspace {
  id: string
  name: string
  type: WorkspaceType
  clientId?: string
  logo?: string
}

// Contact/Lead types
export type ContactStage = 'prospect' | 'qualified' | 'engaged' | 'proposal' | 'negotiation' | 'won' | 'lost'
export type HotScore = 'hot' | 'warm' | 'cold'

export interface Contact {
  id: string
  firstName: string
  lastName: string
  company: string
  title: string
  email: string
  phone?: string
  linkedinUrl?: string
  geography?: string
  industry?: string
  score: number
  stage: ContactStage
  workspaceId?: string
  clientId?: string
  createdAt: string
  updatedAt: string
  notes?: string
}

export interface Lead extends Contact {
  icereakerUsed?: boolean
  proposalSent?: boolean
  lastActivity?: string
}

export interface CrmContact extends Contact {
  linkedinId?: string
  enrichedAt?: string
}

// Activity types
export type ActivityType = 'email_sent' | 'call' | 'meeting' | 'note' | 'proposal_sent' | 'task_completed' | 'status_change'

export interface Activity {
  id: string
  contactId: string
  type: ActivityType
  description: string
  metadata?: Record<string, any>
  createdAt: string
  createdBy: string
}

// Outreach types
export type EmailStatus = 'draft' | 'sent' | 'delivered' | 'bounced' | 'opened' | 'clicked'

export interface OutreachEmail {
  id: string
  contactId: string
  to: string
  subject: string
  body: string
  status: EmailStatus
  sentAt?: string
  openedAt?: string
  clickedAt?: string
  workspaceId?: string
  createdAt: string
}

// Prospection types
export interface ProspectionResult {
  id: string
  firstName: string
  lastName: string
  company: string
  title: string
  email: string
  phone?: string
  linkedinUrl?: string
  geography?: string
  industry?: string
  enrichedData?: Record<string, any>
}

// Discovery types
export type DiscoveryStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface DiscoveryRun {
  id: string
  workspaceId?: string
  clientId?: string
  company: string
  status: DiscoveryStatus
  results?: Record<string, any>
  error?: string
  startedAt: string
  completedAt?: string
}

// Integration types
export interface Integration {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  category: 'prospection' | 'enrichment' | 'outreach' | 'analytics' | 'other'
  connected: boolean
  credentials?: Record<string, any>
}

// Auth types
export interface AuthSession {
  workspace: Workspace
  expiresAt: number
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// Query parameters
export interface ContactsQueryParams {
  page?: number
  limit?: number
  stage?: ContactStage
  score?: 'hot' | 'warm' | 'cold'
  search?: string
  workspaceId?: string
}

export interface ActivitiesQueryParams {
  contactId: string
  page?: number
  limit?: number
  type?: ActivityType
}
