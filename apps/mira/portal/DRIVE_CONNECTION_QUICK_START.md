# Google Drive Connection: Quick Start Guide

## Files Created

1. **`components/DriveConnectionModal.tsx`** — Main React component (600 lines)
2. **`components/DriveConnectionModal.usage.tsx`** — Usage examples & patterns
3. **`lib/drive-connection.types.ts`** — Shared TypeScript types
4. **`DRIVE_CONNECTION_API_SPEC.md`** — Complete API endpoint specification
5. **`DRIVE_CONNECTION_ARCHITECTURE.md`** — Architecture & design guide
6. **`DRIVE_CONNECTION_QUICK_START.md`** — This file

---

## 5-Minute Setup

### 1. Add to Your Page

```tsx
'use client'

import { useState } from 'react'
import { useActiveClient } from '@/lib/client-context'
import DriveConnectionModal from '@/components/DriveConnectionModal'

export default function BrandBrainPage() {
  const { activeClient } = useActiveClient()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      {/* Your existing content */}
      <button onClick={() => setIsModalOpen(true)}>
        Connect Google Drive
      </button>

      {/* Add the modal */}
      <DriveConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clientId={activeClient?.id || ''}
      />
    </>
  )
}
```

### 2. Required Environment Variables

Add to `.env.local`:

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/drive/callback
GOOGLE_DRIVE_API_KEY=your_drive_api_key
```

### 3. Create Database Table

```sql
CREATE TABLE drive_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  folder_id TEXT,
  folder_name TEXT,
  is_authorized BOOLEAN DEFAULT false,
  auto_sync_enabled BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(client_id)
);

-- Add to agent_documents table
ALTER TABLE agent_documents ADD COLUMN IF NOT EXISTS (
  source VARCHAR(50) DEFAULT 'manual',
  google_drive_file_id TEXT UNIQUE,
  source_metadata JSONB
);
```

---

## Component Features at a Glance

| Feature | Status | Notes |
|---------|--------|-------|
| OAuth2 Authorization | ✅ Ready | Handles Google sign-in flow |
| Folder Browser | ✅ Ready | Navigate Drive folder hierarchy |
| Folder Selection | ✅ Ready | Pick sync target folder |
| Auto-Sync Toggle | ✅ Ready | Enable/disable auto ingestion |
| Manual Sync | ✅ Ready | Trigger sync on demand |
| Document List | ✅ Ready | Shows synced docs with status |
| Status Tracking | ✅ Ready | pending → syncing → completed |
| Error Handling | ✅ Ready | User-friendly error messages |
| Dark/Light Theme | ✅ Ready | Respects system theme |
| Disconnect | ✅ Ready | Revoke access cleanly |

---

## Backend Implementation Checklist

All backend is **NOT yet implemented**. You need to create these API routes:

### Must-Have Routes (Phase 1)

- [ ] `POST /api/drive/authorize` — Start OAuth2 flow
- [ ] `GET /api/drive/auth-status` — Check connection status
- [ ] `GET /api/drive/folders` — List folders in Drive
- [ ] `POST /api/drive/select-folder` — Store folder selection
- [ ] `POST /api/drive/sync` — Trigger document sync
- [ ] `POST /api/drive/auto-sync` — Toggle auto-sync
- [ ] `POST /api/drive/disconnect` — Revoke access

### Optional Routes (Phase 2)

- [ ] Webhook handler for Drive push notifications
- [ ] Sync job status polling endpoint
- [ ] Batch import handler

See `DRIVE_CONNECTION_API_SPEC.md` for detailed endpoint specs.

---

## Component Props

```typescript
interface DriveConnectionModalProps {
  isOpen: boolean                    // Show/hide modal
  onClose: () => void                // Called when user clicks "Done"
  clientId: string                   // Which client this sync belongs to
  onSyncStateChange?: (state: DriveConnectionState) => void  // Optional callback
}
```

---

## Example: Full Integration

```tsx
'use client'

import { useState } from 'react'
import { useActiveClient } from '@/lib/client-context'
import DriveConnectionModal from '@/components/DriveConnectionModal'
import { type DriveConnectionState } from '@/lib/drive-connection.types'

export default function BrandBrainSettings() {
  const { activeClient } = useActiveClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [syncState, setSyncState] = useState<DriveConnectionState | null>(null)

  const handleSyncStateChange = (newState: DriveConnectionState) => {
    setSyncState(newState)
    
    // Refresh documents when sync completes
    if (newState.lastSyncTime && newState.documents.length > 0) {
      refreshDocuments()
    }
  }

  const refreshDocuments = async () => {
    // Fetch documents from your API
    const res = await fetch(`/api/brand-brain/documents?clientId=${activeClient?.id}`)
    const { data } = await res.json()
    // Update your documents list
  }

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold mb-4">Google Drive Sync</h2>

      {syncState?.isAuthorized ? (
        <div className="space-y-3">
          <p className="text-sm text-green-400">✓ Connected to Google Drive</p>
          <p className="text-sm text-gray-400">
            Folder: <strong>{syncState.selectedFolderName}</strong>
          </p>
          <p className="text-sm text-gray-400">
            Auto-sync: <strong>{syncState.autoSyncEnabled ? 'On' : 'Off'}</strong>
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 rounded text-sm"
          >
            Manage Settings
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-indigo-600 rounded font-medium"
        >
          Connect Google Drive
        </button>
      )}

      <DriveConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clientId={activeClient?.id || ''}
        onSyncStateChange={handleSyncStateChange}
      />
    </div>
  )
}
```

---

## Component State

The component maintains full state internally. Key states:

```
DISCONNECTED (default)
  ↓
AUTHORIZING (OAuth in progress)
  ↓
AUTHORIZED (no folder selected)
  ↓
SYNCING (documents being ingested)
  ↓
SYNCED (folder selected, auto-sync ready)
```

---

## API Request Examples

### Authorize
```bash
curl -X POST http://localhost:3000/api/drive/authorize \
  -H "Content-Type: application/json" \
  -d '{"clientId":"client-123","redirectUrl":"http://localhost:3000"}'
```

Response:
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### Check Status
```bash
curl http://localhost:3000/api/drive/auth-status?clientId=client-123
```

Response:
```json
{
  "authorized": true,
  "selectedFolderId": "folder_abc123",
  "selectedFolderName": "Brand Assets",
  "autoSyncEnabled": true,
  "lastSyncTime": "2026-07-16T10:30:00Z",
  "documents": [...]
}
```

### List Folders
```bash
curl "http://localhost:3000/api/drive/folders?clientId=client-123&parentId=root"
```

### Trigger Sync
```bash
curl -X POST http://localhost:3000/api/drive/sync \
  -H "Content-Type: application/json" \
  -d '{"clientId":"client-123"}'
```

---

## Styling Reference

The component uses these CSS custom properties (already defined in globals.css):

- `--bg-card` — Modal background
- `--bg-surface` — Section backgrounds
- `--border` — Subtle borders
- `--text-primary` — Main text
- `--text-secondary` — Secondary text
- `--text-tertiary` — Muted text

**No additional CSS needed** — it adapts to your theme automatically.

---

## Testing

### Quick Test

1. Import component into a test page
2. Click "Connect Google Drive"
3. Should redirect to Google login
4. After login, should show folder browser
5. Select a folder
6. Toggle auto-sync
7. Click "Done"

### Debug Logs

Add to component if needed:

```typescript
useEffect(() => {
  console.debug('[Drive] State:', state)
}, [state])
```

---

## Common Issues & Fixes

### "Not authorized with Google Drive"
- Token expired → re-authorize
- Scope insufficient → request `drive.readonly`
- Token not stored → check DB

### Modal won't open
- Is `isOpen={true}`? ✓
- Is `clientId` provided? ✓
- Check browser console ✓

### Folder browser shows nothing
- Are you authorized? ✓
- Does folder have subfolders? ✓
- Check API response in Network tab ✓

### Sync never completes
- Check backend `/api/drive/sync` endpoint
- Is it processing files? (add logging)
- Timeout too short? (increase to 60s)

---

## Next Steps

1. **Implement Backend Routes** — Start with `/api/drive/authorize`
2. **Set Up Database** — Create `drive_connections` table
3. **Test OAuth Flow** — Verify authorization works
4. **Test Sync** — Document ingestion into `agent_documents`
5. **Enable Auto-Sync** — Implement periodic sync or webhooks
6. **Deploy** — Push to production

---

## Architecture Overview

```
┌──────────────────────────────────────────┐
│      DriveConnectionModal (Component)     │
│  - UI for auth, folder selection, sync   │
│  - Manages local state                   │
│  - Makes API calls                       │
└──────────────┬───────────────────────────┘
               │
               ↓ (API calls)
┌──────────────────────────────────────────┐
│    Google Drive API Routes (Backend)      │
│  - /api/drive/authorize                  │
│  - /api/drive/folders                    │
│  - /api/drive/sync                       │
└──────────────┬───────────────────────────┘
               │
               ↓ (OAuth tokens, folder IDs)
┌──────────────────────────────────────────┐
│    Supabase Database                     │
│  - drive_connections (auth state)        │
│  - agent_documents (synced files)        │
└──────────────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────┐
│    Google Drive API (googleapis)          │
│  - List folders                          │
│  - Download files                        │
└──────────────────────────────────────────┘
```

---

## Key Types to Use

```typescript
import {
  DriveConnectionState,      // Full state object
  SyncedDocument,            // A synced file
  DriveFolder,               // A folder in Drive
  type SyncStatus,           // 'pending' | 'syncing' | 'completed' | 'error'
  createDriveConfig,         // Helper function
  isSyncInProgress,          // Utility
  calculateSyncProgress,     // Utility
} from '@/lib/drive-connection.types'
```

---

## Support

- **Component questions** → See `DRIVE_CONNECTION_ARCHITECTURE.md`
- **API specs** → See `DRIVE_CONNECTION_API_SPEC.md`
- **Usage examples** → See `components/DriveConnectionModal.usage.tsx`
- **Types** → See `lib/drive-connection.types.ts`

---

## Files Summary

| File | Size | Purpose |
|------|------|---------|
| `DriveConnectionModal.tsx` | 600 LOC | Main component |
| `DriveConnectionModal.usage.tsx` | 150 LOC | 4 usage examples |
| `drive-connection.types.ts` | 250 LOC | Types + utilities |
| `DRIVE_CONNECTION_API_SPEC.md` | 400 LOC | API reference |
| `DRIVE_CONNECTION_ARCHITECTURE.md` | 500 LOC | Design guide |
| `DRIVE_CONNECTION_QUICK_START.md` | This file | Quick reference |

**Total:** ~2000 lines of production-ready documentation & component code.

---

## Ready to Go!

The component is **production-ready from a UI perspective**. 

**What's left:** Implement the 7 backend API routes (Phase 1 in the checklist above).

**Estimated Backend Time:** 8-12 hours for full implementation with document processing + embed generation.

Need help with backend? See `DRIVE_CONNECTION_API_SPEC.md` for detailed endpoint specs.
