/**
 * ─── SHARED TYPES FOR GOOGLE DRIVE CONNECTION ─────────────────────
 *
 * This file contains all TypeScript types and interfaces used across
 * the Google Drive sync system. Import these in API routes, components,
 * and utilities to maintain type safety.
 */

/**
 * A folder in Google Drive
 */
export interface DriveFolder {
  id: string
  name: string
  mimeType: string
  parents?: string[]
  webViewLink?: string
}

/**
 * A document synced from Google Drive
 */
export interface SyncedDocument {
  id: string
  fileName: string
  mimeType: string
  size: number
  createdTime: string
  modifiedTime: string
  syncedAt: string
  status: SyncStatus
  error?: string
}

/**
 * Status of a synced document
 */
export type SyncStatus = 'pending' | 'syncing' | 'completed' | 'error'

/**
 * Semantic meaning of sync status
 */
export const SYNC_STATUS_DISPLAY: Record<SyncStatus, { label: string; color: string; icon: string }> = {
  pending: {
    label: 'Pending',
    color: '#9CA3AF',
    icon: '–',
  },
  syncing: {
    label: 'Syncing...',
    color: '#F59E0B',
    icon: '◐',
  },
  completed: {
    label: 'Synced',
    color: '#22C55E',
    icon: '✓',
  },
  error: {
    label: 'Failed',
    color: '#EF4444',
    icon: '⚠',
  },
}

/**
 * Full state of Drive connection for a client
 */
export interface DriveConnectionState {
  isAuthorized: boolean
  isAuthorizing: boolean
  selectedFolderId: string | null
  selectedFolderName: string | null
  autoSyncEnabled: boolean
  isSyncing: boolean
  lastSyncTime: string | null
  documents: SyncedDocument[]
  error: string | null
}

/**
 * Database row for drive_connections table
 */
export interface DriveConnectionRecord {
  id: string
  client_id: string
  access_token: string | null
  refresh_token: string | null
  token_expires_at: string | null
  folder_id: string | null
  folder_name: string | null
  is_authorized: boolean
  auto_sync_enabled: boolean
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Metadata stored with agent_documents when synced from Drive
 */
export interface DriveSourceMetadata {
  folder_id: string
  folder_name: string
  google_drive_file_id: string
  synced_at: string
  original_url?: string
}

/**
 * API Request/Response types
 */

export interface AuthorizeRequest {
  clientId: string
  redirectUrl: string
  returnTo?: string
}

export interface AuthorizeResponse {
  authUrl: string
}

export interface AuthStatusRequest {
  clientId: string
}

export interface AuthStatusResponse {
  authorized: boolean
  selectedFolderId: string | null
  selectedFolderName: string | null
  autoSyncEnabled: boolean
  lastSyncTime: string | null
  documents: SyncedDocument[]
}

export interface ListFoldersRequest {
  clientId: string
  parentId?: string
}

export interface ListFoldersResponse {
  folders: DriveFolder[]
}

export interface SelectFolderRequest {
  clientId: string
  folderId: string
  folderName: string
}

export interface SelectFolderResponse {
  success: boolean
  message: string
}

export interface AutoSyncRequest {
  clientId: string
  enabled: boolean
}

export interface AutoSyncResponse {
  success: boolean
  autoSyncEnabled: boolean
  message: string
}

export interface SyncRequest {
  clientId: string
}

export interface SyncResponse {
  success: boolean
  syncStarted: boolean
  jobId?: string
  documents: SyncedDocument[]
}

export interface DisconnectRequest {
  clientId: string
}

export interface DisconnectResponse {
  success: boolean
  message: string
}

/**
 * Generic API error response
 */
export interface ApiErrorResponse {
  success: false
  message: string
  code: string
  details?: Record<string, any>
}

/**
 * Webhook payload for Drive file changes (if using Push Notifications)
 */
export interface DriveWebhookPayload {
  clientId: string
  folderId: string
  fileId: string
  fileName: string
  action: 'created' | 'modified' | 'deleted'
  timestamp: string
}

/**
 * Sync job metadata (for background processing)
 */
export interface SyncJob {
  id: string
  clientId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  filesProcessed: number
  filesTotal: number
  startedAt: string
  completedAt?: string
  error?: string
}

/**
 * Google Drive API types (from @types/googleapis)
 */
export interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
  size: string
  createdTime: string
  modifiedTime: string
  webViewLink: string
  parents?: string[]
}

/**
 * Configuration for Drive integration
 */
export interface DriveIntegrationConfig {
  googleClientId: string
  googleClientSecret: string
  redirectUri: string
  driveApiKey: string
  scopes: string[]
  maxFileSizeBytes: number
  supportedMimeTypes: string[]
  syncBatchSize: number
  syncTimeoutMs: number
}

/**
 * Helper function to create default config
 */
export function createDriveConfig(overrides?: Partial<DriveIntegrationConfig>): DriveIntegrationConfig {
  return {
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
    driveApiKey: process.env.GOOGLE_DRIVE_API_KEY || '',
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    maxFileSizeBytes: 104857600, // 100MB
    supportedMimeTypes: [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.google-apps.document',
      'application/vnd.google-apps.spreadsheet',
      'image/jpeg',
      'image/png',
    ],
    syncBatchSize: 10,
    syncTimeoutMs: 60000,
    ...overrides,
  }
}

/**
 * Utility to check if a MIME type is supported
 */
export function isSupportedMimeType(mimeType: string, config?: DriveIntegrationConfig): boolean {
  const defaultConfig = createDriveConfig(config)
  return defaultConfig.supportedMimeTypes.includes(mimeType)
}

/**
 * Utility to format sync status for display
 */
export function getSyncStatusDisplay(status: SyncStatus) {
  return SYNC_STATUS_DISPLAY[status]
}

/**
 * Utility to check if a sync is in progress
 */
export function isSyncInProgress(state: DriveConnectionState): boolean {
  return state.isSyncing || state.documents.some((doc) => doc.status === 'syncing' || doc.status === 'pending')
}

/**
 * Utility to calculate sync progress percentage
 */
export function calculateSyncProgress(state: DriveConnectionState): number {
  if (state.documents.length === 0) return 0
  const completed = state.documents.filter((doc) => doc.status === 'completed').length
  return Math.round((completed / state.documents.length) * 100)
}
