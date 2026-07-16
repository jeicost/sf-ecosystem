# Google Drive Connection: Architecture & Component Reference

## Overview

The Google Drive Connection system enables MIRA clients to sync documents from their Google Drive directly into the Brand Brain knowledge base. This guide covers component architecture, state management, UI flows, and integration patterns.

---

## Component Architecture

### `DriveConnectionModal` Component

**Purpose:** A reusable, modal-based UI for managing Google Drive authorization and document syncing.

**Key Features:**
- OAuth2 authorization flow (redirect-based)
- Folder browser with breadcrumb navigation
- Auto-sync toggle with persistent state
- Document sync status tracking
- Manual sync trigger
- Disconnect capability

**File Location:** `/apps/mira/portal/components/DriveConnectionModal.tsx`

**Size:** ~600 lines

---

## State Management

### Component State Structure

```typescript
interface DriveConnectionState {
  // Authorization
  isAuthorized: boolean
  isAuthorizing: boolean
  
  // Folder selection
  selectedFolderId: string | null
  selectedFolderName: string | null
  
  // Sync settings
  autoSyncEnabled: boolean
  isSyncing: boolean
  lastSyncTime: string | null
  
  // Documents and errors
  documents: SyncedDocument[]
  error: string | null
}
```

### State Flow Diagram

```
┌─────────────────┐
│   DISCONNECTED  │  (initial)
│  isAuthorized:  │
│     false       │
└────────┬────────┘
         │ click "Sign in"
         ↓
┌─────────────────┐
│ AUTHORIZING     │  (isAuthorizing: true)
│ (OAuth flow)    │
└────────┬────────┘
         │ callback returned
         ├─ success → AUTHORIZED
         └─ error → error state
         ↓
┌─────────────────┐
│  AUTHORIZED     │  (can select folder)
│  (no folder)    │
└────────┬────────┘
         │ select folder
         ↓
┌─────────────────┐
│  SYNCING        │  (documents ingested)
│  (auto or       │
│   manual)       │
└─────────────────┘
```

---

## UI Sections

### Section 1: Connection Status

**When Disconnected:**
- Large CTA button: "Sign in with Google"
- Icon + descriptive text
- Handles OAuth initiation

**When Authorized:**
- Green success indicator
- Current folder name
- Disconnect button (red, hover)

### Section 2: Folder Selection

**Folder Browser:**
- Breadcrumb navigation (Root > Folder > Subfolder)
- Clickable breadcrumbs to navigate back
- Folder list (max 50 at a time)
- Double-click to select, single-click to open

**Visual Feedback:**
- Active folder highlighted
- Hover state on folders
- Loading spinner while fetching
- "No folders" empty state

### Section 3: Sync Settings

**Auto-Sync Toggle:**
- Toggle2 icon from lucide-react
- Label + description
- Persists on backend
- Shows sync status

### Section 4: Synced Documents

**Document List:**
- File icon (color-coded by status)
- File name, size, status
- Status badge: ✓ Synced / ⚠ Failed / ◐ Syncing / – Pending
- Error message if failed
- Manual sync button (top right)

---

## Event Flow

### Authorization Flow

```
User clicks "Sign in with Google"
  ↓
Component calls POST /api/drive/authorize
  ↓
Backend generates OAuth URL with state
  ↓
Component redirects to Google
  ↓
User grants permission
  ↓
Google redirects to callback URL with ?code=XXX&state=YYY
  ↓
Backend exchanges code for tokens
  ↓
Component checks auth status (POST /api/drive/auth-status)
  ↓
State updates: isAuthorized = true
  ↓
Folder browser becomes available
```

### Sync Flow

```
User clicks sync button
  ↓
Component sets isSyncing = true
  ↓
Component calls POST /api/drive/sync
  ↓
Backend fetches files from Google Drive API
  ↓
For each file:
  - Download and parse content
  - Generate embeddings
  - Store in agent_documents table
  ↓
Backend returns updated documents list
  ↓
Component updates state with new documents
  ↓
Each document shows status: pending → syncing → completed (or error)
```

---

## Integration Points

### Props Interface

```typescript
interface DriveConnectionModalProps {
  isOpen: boolean                          // Modal visibility
  onClose: () => void                      // Close handler
  clientId: string                         // Required: which client owns sync
  onSyncStateChange?: (state: DriveConnectionState) => void  // Optional callback
}
```

### Usage Patterns

#### Pattern 1: Settings Page

```tsx
// In a settings or admin panel
const [isModalOpen, setIsModalOpen] = useState(false)

return (
  <>
    <button onClick={() => setIsModalOpen(true)}>
      Configure Drive Sync
    </button>
    <DriveConnectionModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      clientId={activeClient.id}
    />
  </>
)
```

#### Pattern 2: With State Callback

```tsx
// When you need to react to sync completion
const [syncState, setSyncState] = useState<DriveConnectionState | null>(null)

const handleSyncStateChange = (newState: DriveConnectionState) => {
  setSyncState(newState)
  if (newState.documents.length > 0) {
    // Refresh documents list in parent
    refreshDocuments()
  }
}

return (
  <DriveConnectionModal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    clientId={activeClient.id}
    onSyncStateChange={handleSyncStateChange}
  />
)
```

---

## API Contract

### Backend Endpoints Required

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/drive/authorize` | Initiate OAuth2 flow |
| GET | `/api/drive/auth-status` | Check current auth & sync state |
| GET | `/api/drive/folders` | List folders (with pagination) |
| POST | `/api/drive/select-folder` | Set sync target folder |
| POST | `/api/drive/auto-sync` | Toggle auto-sync on/off |
| POST | `/api/drive/sync` | Trigger manual sync |
| POST | `/api/drive/disconnect` | Revoke access & cleanup |

See `DRIVE_CONNECTION_API_SPEC.md` for detailed request/response schemas.

---

## Styling & Theme

### Design System Integration

The component uses MIRA's existing design tokens:

**Color Variables:**
- `--bg-card` — Modal background
- `--bg-surface` — Section backgrounds
- `--border` — Subtle borders
- `--text-primary` — Main text
- `--text-secondary` — Secondary text
- `--text-tertiary` — Muted text

**Accent Color:**
- `#6366F1` (Indigo-500) for interactive elements

**Semantic Colors:**
- `#22C55E` (Green) for success states
- `#EF4444` (Red) for errors
- `#F59E0B` (Amber) for warnings/syncing
- `#FBBF24` (Yellow) for info

### Dark/Light Mode

Component respects `data-theme` attribute:
- Dark mode (default): Uses CSS variables with dark surfaces
- Light mode: CSS tokens automatically override for light backgrounds

All inline styles use CSS variables or Tailwind, ensuring theme compatibility.

---

## Error Handling

### User-Facing Errors

1. **Authorization Failed**
   ```
   Error: "Authorization failed"
   → Show alert, provide retry button
   ```

2. **Folder Not Found**
   ```
   Error: "Selected folder no longer exists"
   → Show in alert, user must reselect
   ```

3. **Sync Failed**
   ```
   Error: "Failed to sync documents"
   → Mark documents as 'error' status
   → Show error message in document row
   ```

4. **Token Expired**
   ```
   Error: "Google Drive access expired"
   → Show re-authorization prompt
   → Button: "Reconnect with Google"
   ```

### Error Recovery

- All errors are dismissible via close alert or retry
- Sync failures don't prevent selecting a different folder
- Disconnect is always available even in error state

---

## Performance Considerations

### Optimizations

1. **Folder Pagination** — Max 50 folders per request
2. **Document List** — Max 100 documents shown; use overflow-y-auto
3. **Lazy Loading** — Folders only fetched when browser opened
4. **Debounced Sync** — Only 1 sync per 5 minutes per client
5. **Token Refresh** — Handle automatic refresh on 401

### Large Folder Handling

If a folder has 1000+ files:
- Return first 50, show "Load more" button
- Or paginate: handle `pageToken` in API
- Show progress: "Syncing file 47 of 234..."

---

## Testing Strategy

### Unit Tests

```typescript
describe('DriveConnectionModal', () => {
  it('shows authorization button when not authorized')
  it('shows folder browser when authorized')
  it('calls onSyncStateChange on state changes')
  it('disables sync button while syncing')
  it('shows error alert on API failure')
  it('navigates folder hierarchy correctly')
})
```

### Integration Tests

```typescript
describe('Drive Integration', () => {
  it('completes full OAuth flow')
  it('selects folder and syncs documents')
  it('auto-sync toggle persists')
  it('disconnects and clears state')
  it('handles network errors gracefully')
})
```

### E2E Tests

- User authorizes with Google
- User selects a folder
- Documents appear in list
- User enables auto-sync
- New documents in Drive appear in list
- User disconnects

---

## Security & Compliance

### OAuth2 Implementation

- Use authorization code flow with PKCE
- Store tokens encrypted in Supabase
- Refresh tokens before expiry
- Revoke access on disconnect
- No tokens exposed to client

### Data Privacy

- Only read-only access to Drive (`drive.readonly` scope)
- User controls which folder to sync
- Documents stored in Supabase (encrypted at rest)
- Audit logs for all sync operations
- GDPR-compliant: users can request data deletion

### Rate Limiting

- Max 1 sync per 5 minutes per client
- Max 100 API calls per hour per client
- Prevent sync spam with debounce

---

## Future Enhancements

### Phase 2 Features

- [ ] Selective file filtering (*.pdf only, size limits, etc.)
- [ ] Real-time sync via Google Drive webhooks
- [ ] Conflict resolution (file modified locally vs in Drive)
- [ ] Multiple folder sync (sync 2+ folders simultaneously)
- [ ] File preview in modal
- [ ] Sync history timeline
- [ ] Sync schedule (daily, weekly)

### Phase 3 Features

- [ ] Bi-directional sync (upload documents back to Drive)
- [ ] Folder sharing (sync shared drives)
- [ ] Advanced filters (date range, owner, etc.)
- [ ] Sync analytics (files processed, storage used)
- [ ] Integration with other cloud providers (OneDrive, Dropbox)

---

## Debugging

### Check Auth Status
```bash
curl -X GET "http://localhost:3000/api/drive/auth-status?clientId=CLIENT_ID"
```

### Check Stored Connection
```sql
SELECT * FROM drive_connections WHERE client_id = 'CLIENT_ID';
```

### Check Synced Documents
```sql
SELECT * FROM agent_documents WHERE source = 'google_drive' AND client_id = 'CLIENT_ID';
```

### Enable Debug Logging

In component:
```typescript
// Add console logs
console.debug('Sync state:', state)
console.debug('API request:', { clientId, folderId })
console.debug('API response:', response)
```

---

## File Structure

```
apps/mira/portal/
├── components/
│   ├── DriveConnectionModal.tsx             # Main component
│   └── DriveConnectionModal.usage.tsx       # Usage examples
├── lib/
│   └── drive-connection.types.ts            # Shared types
├── app/api/drive/
│   ├── authorize/route.ts                   # POST /api/drive/authorize
│   ├── auth-status/route.ts                 # GET /api/drive/auth-status
│   ├── folders/route.ts                     # GET /api/drive/folders
│   ├── select-folder/route.ts               # POST /api/drive/select-folder
│   ├── auto-sync/route.ts                   # POST /api/drive/auto-sync
│   ├── sync/route.ts                        # POST /api/drive/sync
│   └── disconnect/route.ts                  # POST /api/drive/disconnect
├── DRIVE_CONNECTION_API_SPEC.md             # API documentation
└── DRIVE_CONNECTION_ARCHITECTURE.md         # This file
```

---

## Troubleshooting

### "Not authorized with Google Drive"
- Check if access token is stored in DB
- Verify token hasn't expired
- Trigger re-authorization

### "Folder not found"
- Folder was deleted
- Permissions revoked
- Ask user to select a new folder

### "Sync timeout"
- Folder has too many files
- Network is slow
- Implement pagination

### Modal doesn't open
- Check if `isOpen` prop is true
- Verify `clientId` is passed
- Check browser console for errors

---

## Resources

- [Google Drive API Docs](https://developers.google.com/drive/api)
- [OAuth 2.0 PKCE Flow](https://tools.ietf.org/html/rfc7636)
- [Supabase Encryption](https://supabase.com/docs/guides/database/encryption)
- [Next.js API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)
