# Google Drive Connection API Specification

This document outlines the backend API endpoints required for the `DriveConnectionModal` component to function.

## Overview

The component communicates with the backend through these API routes:
- Authentication & Authorization flow
- Folder management and browsing
- Document syncing (manual and automatic)
- Settings persistence

## API Endpoints

### 1. Check Authorization Status

**Endpoint:** `GET /api/drive/auth-status`

**Query Parameters:**
- `clientId` (string, required) — The client ID to check authorization for

**Response (200):**
```json
{
  "authorized": true,
  "selectedFolderId": "folder_123",
  "selectedFolderName": "Brand Assets",
  "autoSyncEnabled": true,
  "lastSyncTime": "2026-07-16T10:30:00Z",
  "documents": [
    {
      "id": "file_001",
      "fileName": "brand-book.pdf",
      "mimeType": "application/pdf",
      "size": 2048576,
      "createdTime": "2026-07-16T10:00:00Z",
      "modifiedTime": "2026-07-16T10:15:00Z",
      "syncedAt": "2026-07-16T10:30:00Z",
      "status": "completed",
      "error": null
    }
  ]
}
```

**Implementation Notes:**
- Query Supabase `drive_connections` table for the client
- Return stored authorization tokens and settings
- Fetch documents from `agent_documents` table where `source = 'google_drive'`

---

### 2. Initiate Authorization

**Endpoint:** `POST /api/drive/authorize`

**Request Body:**
```json
{
  "clientId": "client_123",
  "redirectUrl": "https://mira.startupsfactory.es/brand-brain"
}
```

**Response (200):**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
}
```

**Response (400):**
```json
{
  "message": "Authorization URL generation failed"
}
```

**Implementation Notes:**
- Generate Google OAuth2 authorization URL
- Use Google Drive scope: `https://www.googleapis.com/auth/drive.readonly`
- Include state parameter for CSRF protection
- Store state in session/Redis with TTL of 10 minutes
- Redirect URL should include `?code=XXXX&state=YYYY` callback handling

---

### 3. List Folders (Browser)

**Endpoint:** `GET /api/drive/folders`

**Query Parameters:**
- `clientId` (string, required)
- `parentId` (string, optional, default: "root") — The parent folder ID to list children of

**Response (200):**
```json
{
  "folders": [
    {
      "id": "folder_abc123",
      "name": "Q3 2026 Assets",
      "mimeType": "application/vnd.google-apps.folder",
      "parents": ["root"],
      "webViewLink": "https://drive.google.com/drive/folders/folder_abc123"
    },
    {
      "id": "folder_def456",
      "name": "Brand Guidelines",
      "mimeType": "application/vnd.google-apps.folder",
      "parents": ["root"],
      "webViewLink": "https://drive.google.com/drive/folders/folder_def456"
    }
  ]
}
```

**Response (401):**
```json
{
  "message": "Not authorized with Google Drive"
}
```

**Implementation Notes:**
- Requires valid Google Drive token stored in Supabase
- Use Google Drive API: `GET https://www.googleapis.com/drive/v3/files`
- Query: `q: "mimeType='application/vnd.google-apps.folder' and parents in 'parentId' and trashed=false"`
- Return only folders, not files
- Paginate if > 50 results

---

### 4. Select Sync Folder

**Endpoint:** `POST /api/drive/select-folder`

**Request Body:**
```json
{
  "clientId": "client_123",
  "folderId": "folder_abc123",
  "folderName": "Q3 2026 Assets"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Folder selected for syncing"
}
```

**Response (400):**
```json
{
  "message": "Invalid folder ID"
}
```

**Implementation Notes:**
- Update `drive_connections` table: set `folder_id = folderId`, `folder_name = folderName`
- Store timestamp of when folder was selected
- Trigger initial sync if first time (optional)

---

### 5. Toggle Auto-Sync

**Endpoint:** `POST /api/drive/auto-sync`

**Request Body:**
```json
{
  "clientId": "client_123",
  "enabled": true
}
```

**Response (200):**
```json
{
  "success": true,
  "autoSyncEnabled": true,
  "message": "Auto-sync enabled"
}
```

**Implementation Notes:**
- Update `drive_connections` table: set `auto_sync_enabled = enabled`
- If enabling: set up webhook or scheduled sync job
- If disabling: remove webhook/cancel scheduled job
- Emit analytics event: "drive_autosync_toggled"

---

### 6. Manual Sync (Trigger)

**Endpoint:** `POST /api/drive/sync`

**Request Body:**
```json
{
  "clientId": "client_123"
}
```

**Response (200):**
```json
{
  "success": true,
  "syncStarted": true,
  "jobId": "sync_job_123",
  "documents": [
    {
      "id": "file_001",
      "fileName": "brand-book-v2.pdf",
      "mimeType": "application/pdf",
      "size": 2097152,
      "createdTime": "2026-07-16T10:00:00Z",
      "modifiedTime": "2026-07-16T10:15:00Z",
      "syncedAt": "2026-07-16T10:31:00Z",
      "status": "syncing",
      "error": null
    }
  ]
}
```

**Response (400):**
```json
{
  "message": "No folder selected for syncing"
}
```

**Implementation Notes:**
- Check if `folder_id` is set in `drive_connections`
- List all documents in the selected folder from Google Drive API
- For each document:
  - Check if already exists in `agent_documents` table
  - Download and process the file (extract text, generate embeddings)
  - Create/update `agent_documents` row with:
    - `source = 'google_drive'`
    - `google_drive_file_id` (for deduplication)
    - `status = 'syncing'` initially
  - Emit status update to client (optional: via WebSocket or polling)
- Return list of synced documents with status
- This operation can be async; return `202 Accepted` if processing in background

---

### 7. Disconnect Google Drive

**Endpoint:** `POST /api/drive/disconnect`

**Request Body:**
```json
{
  "clientId": "client_123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Google Drive disconnected"
}
```

**Implementation Notes:**
- Delete or revoke Google Drive access token
- Update `drive_connections`: set `is_authorized = false`, `access_token = null`
- Keep synced documents in `agent_documents` table (don't delete)
- Disable auto-sync
- Remove any scheduled sync jobs
- Don't delete the row; just mark as disconnected for audit trail

---

## Database Schema (Supabase)

### Table: `drive_connections`

```sql
CREATE TABLE drive_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- OAuth tokens
  access_token TEXT ENCRYPTED,
  refresh_token TEXT ENCRYPTED,
  token_expires_at TIMESTAMP,
  
  -- Folder selection
  folder_id TEXT,
  folder_name TEXT,
  
  -- Sync settings
  is_authorized BOOLEAN DEFAULT false,
  auto_sync_enabled BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(client_id)
);
```

### Updates to `agent_documents` Table

Add columns to track Drive origin:
```sql
ALTER TABLE agent_documents ADD COLUMN IF NOT EXISTS (
  source VARCHAR(50) DEFAULT 'manual',  -- 'manual' | 'google_drive' | 'email'
  google_drive_file_id TEXT UNIQUE,     -- For deduplication
  source_metadata JSONB                 -- { "folder_id", "synced_at", ... }
);

CREATE INDEX idx_agent_documents_source ON agent_documents(source);
CREATE INDEX idx_agent_documents_drive_file_id ON agent_documents(google_drive_file_id);
```

---

## Error Handling

All endpoints should follow this error response format:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

**Common Error Codes:**
- `UNAUTHORIZED_DRIVE` — Google Drive token invalid or expired
- `FOLDER_NOT_FOUND` — Selected folder no longer exists in Drive
- `QUOTA_EXCEEDED` — Google Drive API quota exceeded
- `FILE_ACCESS_DENIED` — Can't access file (permissions issue)
- `SYNC_IN_PROGRESS` — Another sync is already running
- `INVALID_CLIENT_ID` — Client not found

---

## Security Considerations

1. **OAuth2 PKCE Flow** — Use authorization code with PKCE for enhanced security
2. **Token Encryption** — All tokens stored in Supabase with `pgsql-crypto` extension
3. **Scope Limitation** — Request only `https://www.googleapis.com/auth/drive.readonly`
4. **RLS Policy** — Documents can only be accessed by the client that uploaded them
5. **Rate Limiting** — Implement rate limiting on sync endpoints (max 1 sync per 5 minutes)
6. **Audit Logging** — Log all connection/disconnection events

---

## Testing Checklist

- [ ] OAuth flow redirects correctly
- [ ] Token is stored encrypted
- [ ] Folder browser shows correct hierarchy
- [ ] Can select any folder depth
- [ ] Manual sync ingests documents
- [ ] Auto-sync toggle persists
- [ ] Disconnect revokes access
- [ ] Error handling shows user-friendly messages
- [ ] Duplicate files are not re-ingested
- [ ] Large files (> 50MB) are handled
- [ ] Rate limiting prevents spam syncs

---

## Example Backend Implementation (TypeScript + Next.js)

See `api/drive/` directory for implementations:
- `api/drive/authorize.ts`
- `api/drive/auth-status.ts`
- `api/drive/folders.ts`
- `api/drive/select-folder.ts`
- `api/drive/auto-sync.ts`
- `api/drive/sync.ts`
- `api/drive/disconnect.ts`
