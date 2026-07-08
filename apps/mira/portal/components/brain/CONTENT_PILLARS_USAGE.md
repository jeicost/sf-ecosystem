# ContentPillars Component Usage

## Import

```tsx
import ContentPillars from '@/components/brain/ContentPillars'
```

## Basic Usage

```tsx
export default function BrainPage({ params }: { params: { clientId: string } }) {
  return (
    <div>
      <h1>Content Strategy</h1>
      <ContentPillars clientId={params.clientId} />
    </div>
  )
}
```

## Features

### Create
- Click "New Pillar" button to open creation form
- Enter pillar name (required), description, weight (1-10)
- Add sub-topics, example hooks, and CTA patterns using the tag input
- Toggle "Active" status
- Click "Create Pillar" to save

### Read
- Displays all pillars for the client in a grid layout
- Shows pillar name, description, weight bar, and tag lists
- Filters automatically by clientId

### Update (Inline Edit)
- Click the edit icon on any pillar
- Modify all fields in the form
- Click "Save" to update (optimistic updates show immediately)
- Click "Cancel" to discard changes

### Delete
- Click the trash icon on any pillar
- Confirm deletion in the modal
- Pillar is deleted and list updates immediately

## Features

- **Optimistic Updates**: Changes show immediately, revert on error
- **Toast Notifications**: Success/error messages appear in top-right corner
- **Type-Safe**: Full TypeScript support with ContentPillar type from lib/types
- **Styling**: Matches BrainResources component design with tailwind dark theme
- **Icons**: Uses lucide-react (Edit2, Trash2, Plus, Check, X)
- **Security**: Always filters by clientId to prevent cross-workspace data access

## Component Structure

### ContentPillars.tsx
Main component with full CRUD operations:
- State: pillars, isLoading, showCreateForm, editingId, deleteConfirming
- Notifications: Simple toast system with auto-dismiss after 3 seconds
- Database: Uses Supabase with typed queries

### EditableTagList.tsx
Helper component for editing string arrays:
- Add/remove tags with keyboard support (Enter to add)
- Prevents duplicates
- Styled to match the design system

## Database Integration

Queries the `content_pillars` table:
```sql
-- Create
INSERT INTO content_pillars (client_id, name, description, weight, sub_topics, example_hooks, cta_patterns, is_active)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)

-- Read
SELECT * FROM content_pillars WHERE client_id = ? ORDER BY created_at DESC

-- Update
UPDATE content_pillars SET ... WHERE id = ? AND client_id = ?

-- Delete
DELETE FROM content_pillars WHERE id = ? AND client_id = ?
```

All queries include `client_id` filter for security.
