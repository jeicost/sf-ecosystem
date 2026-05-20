# Workspace Patterns — Multi-Client Architecture

Guide for implementing workspace/client scoping in SF ecosystem apps.

---

## Pattern 1: User Metadata Scoping (MIRA Model)

**Best for:** Portal applications where a single user maps to one client.

### Architecture
```
Auth Flow:
  User logs in → auth.users.user_metadata.client_id set during signup
  ↓
  App initializes ClientContext with activeClient (from localStorage + user_metadata)
  ↓
  All queries filtered: .eq('client_id', activeClient.id)
```

### Implementation Steps

#### 1. Database Setup
Each table needs `client_id UUID` column:
```sql
CREATE TABLE brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES mira_clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ...
);

ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_profiles: client isolation" ON brand_profiles
  FOR ALL USING (client_id = (auth.jwt() -> 'user_metadata' ->> 'client_id')::UUID);
```

#### 2. Auth Setup (Supabase)
During user signup, set user_metadata:
```typescript
// In your auth signup handler
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      client_id: 'uuid-of-client',  // Set during signup
    }
  }
});
```

#### 3. App Context (Next.js)
Create a ClientContext for client switching:
```typescript
// lib/client-context.tsx
'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface ActiveClient {
  id: string
  name: string
  slug: string
}

interface ClientContextValue {
  activeClient: ActiveClient | null
  setActiveClient: (c: ActiveClient) => void
}

const ClientContext = createContext<ClientContextValue>({
  activeClient: null,
  setActiveClient: () => {},
})

const STORAGE_KEY = 'app_active_client'

export function ClientProvider({ children }: { children: ReactNode }) {
  const [activeClient, setActiveClientState] = useState<ActiveClient | null>(null)

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setActiveClientState(JSON.parse(raw))
    } catch {}
  }, [])

  function setActiveClient(c: ActiveClient) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c))
    setActiveClientState(c)
  }

  return (
    <ClientContext.Provider value={{ activeClient, setActiveClient }}>
      {children}
    </ClientContext.Provider>
  )
}

export function useActiveClient() {
  return useContext(ClientContext)
}
```

#### 4. Query Pattern
In any component:
```typescript
'use client'
import { useActiveClient } from '@/lib/client-context'
import { createClient } from '@/lib/supabase'

export default function BrandProfiles() {
  const { activeClient } = useActiveClient()
  const supabase = createClient()

  useEffect(() => {
    if (!activeClient) return // Wait for client context to load
    
    const query = supabase
      .from('brand_profiles')
      .select('*')
      .eq('client_id', activeClient.id)  // ← KEY: Filter by activeClient
    
    query.then(({ data }) => {
      // Data is automatically scoped to activeClient due to RLS + manual filter
    })
  }, [activeClient?.id])
}
```

#### 5. API Routes Pattern
In API routes, get client_id from user's auth metadata:
```typescript
// app/api/profiles/route.ts
import { adminClient } from '@/lib/supabase'

export async function GET(request: Request) {
  // Get authenticated user
  const { data: { user } } = await adminClient.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = user.user_metadata?.client_id
  if (!clientId) return Response.json({ error: 'Client ID not found' }, { status: 400 })

  // Query scoped to user's client_id
  const { data } = await adminClient
    .from('brand_profiles')
    .select('*')
    .eq('client_id', clientId)

  return Response.json(data)
}
```

#### 6. Client Switcher UI
Allow users to switch between clients they have access to:
```typescript
// components/ClientSwitcher.tsx
export function ClientSwitcher({ allClients }: { allClients: ActiveClient[] }) {
  const { activeClient, setActiveClient } = useActiveClient()

  return (
    <select 
      value={activeClient?.id || ''} 
      onChange={(e) => {
        const c = allClients.find(x => x.id === e.target.value)
        if (c) setActiveClient(c)
      }}
    >
      {allClients.map(c => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  )
}
```

---

## Pattern 2: URL-Based Workspace Scoping (SF-CRM Model)

**Best for:** Multi-workspace tools where users access different workspaces via URL routing.

### Architecture
```
URL Flow:
  /[workspace]/ → extract workspace slug
  ↓
  Layout queries workspace record to get workspace_id
  ↓
  set_config('app.current_workspace_id', workspace_id)
  ↓
  All queries filtered: .eq('workspace_id', workspace_id)
```

### Implementation Steps

#### 1. Database Setup
Each table needs `workspace_id UUID` column:
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ...
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads: workspace isolation" ON leads
  FOR ALL USING (workspace_id = current_workspace_id())
  WITH CHECK (workspace_id = current_workspace_id());
```

#### 2. Helper Function (Supabase)
Create a SQL function to get workspace ID:
```sql
CREATE OR REPLACE FUNCTION current_workspace_id()
RETURNS UUID AS $$
BEGIN
  RETURN (current_setting('app.current_workspace_id', true))::UUID;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

#### 3. Middleware Setup
Set workspace context before rendering pages:
```typescript
// app/[workspace]/layout.tsx
import { getWorkspace, WORKSPACES } from "@/lib/workspaces"
import { adminClient } from "@/lib/supabase"

interface LayoutProps {
  params: Promise<{ workspace: string }>
  children: React.ReactNode
}

export default async function WorkspaceLayout({ 
  params, 
  children 
}: LayoutProps) {
  const { workspace: slug } = await params
  const ws = getWorkspace(slug)
  
  if (!ws) {
    notFound()
  }

  // Set workspace context for all queries in this subtree
  // This gets passed to Supabase via set_config
  const workspaceId = ws.id

  // Every server component/query in this layout now knows the workspace context
  return (
    <WorkspaceProvider workspaceId={workspaceId}>
      <Sidebar workspace={ws} />
      {children}
    </WorkspaceProvider>
  )
}
```

#### 4. Query Context Provider
Create a provider that sets the workspace context:
```typescript
// lib/workspace-provider.tsx
'use client'
import { useEffect } from 'react'
import { createContext, useContext } from 'react'

const WorkspaceContext = createContext<{ workspaceId: UUID | null }>({ workspaceId: null })

export function WorkspaceProvider({ 
  workspaceId, 
  children 
}: { 
  workspaceId: UUID
  children: React.ReactNode 
}) {
  return (
    <WorkspaceContext.Provider value={{ workspaceId }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspaceId() {
  return useContext(WorkspaceContext).workspaceId
}
```

#### 5. Query Pattern
In server components or API routes:
```typescript
// app/[workspace]/leads/page.tsx
import { adminClient } from '@/lib/supabase'

export default async function LeadsPage({ 
  params 
}: { 
  params: Promise<{ workspace: string }> 
}) {
  const { workspace: slug } = await params
  const ws = getWorkspace(slug)

  // Query with workspace scoping
  const { data: leads } = await adminClient
    .from('leads')
    .select('*')
    .eq('workspace_id', ws.id)  // ← Manual filter
    // RLS will also filter if set_config was called

  return (
    <LeadsList leads={leads} />
  )
}
```

#### 6. API Routes Pattern
```typescript
// app/api/[workspace]/leads/route.ts
export async function GET(
  request: Request,
  { params }: { params: { workspace: string } }
) {
  const ws = getWorkspace(params.workspace)
  if (!ws) return Response.json({ error: 'Not found' }, { status: 404 })

  const { data } = await adminClient
    .from('leads')
    .select('*')
    .eq('workspace_id', ws.id)

  return Response.json(data)
}
```

---

## Pattern 3: Hybrid (Coming Soon)

For apps that need both:
- User can belong to multiple workspaces
- User has different roles/permissions per workspace

Structure:
```
auth.users
  ↓
user_roles (junction table)
  - user_id
  - workspace_id
  - role ('admin', 'editor', 'viewer')
```

RLS: `EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND workspace_id = ...)`

---

## Decision Tree: Which Pattern?

```
┌─ Is it a single-client admin tool?
│  └─ Yes → No scoping needed (SF-CMS model)
│
├─ Does a single user manage one client?
│  └─ Yes → Pattern 1: User Metadata Scoping (MIRA model)
│     └─ Best for: Multi-client SaaS portals
│
├─ Does a single user manage multiple workspaces?
│  └─ Yes → Pattern 2: URL-Based Scoping (SF-CRM model)
│     └─ Best for: Multi-workspace B2B tools
│
└─ Does a user have different roles per workspace?
   └─ Yes → Pattern 3: Hybrid (work in progress)
```

---

## Common Pitfalls

### Pitfall 1: Forgetting to set client_id/workspace_id on INSERT
```typescript
// ❌ WRONG — missing client_id
const { error } = await supabase
  .from('brand_profiles')
  .insert({ name: 'My Brand' })

// ✅ CORRECT
const { activeClient } = useActiveClient()
const { error } = await supabase
  .from('brand_profiles')
  .insert({ 
    name: 'My Brand',
    client_id: activeClient.id  // ← Always include
  })
```

### Pitfall 2: Using unauthenticated key (anon key) with RLS
```typescript
// ❌ WRONG — anon key can't bypass RLS if user has no client_id
const supabase = createBrowserClient(url, anonKey)

// ✅ CORRECT — anon key is fine IF user_metadata.client_id is set
// Just make sure to set it during signup
```

### Pitfall 3: Not filtering in application code (relying only on RLS)
```typescript
// ⚠️ RISKY — service role bypasses RLS
const { data } = await adminClient
  .from('brand_profiles')
  .select('*')
  // Missing .eq('client_id', clientId)!

// ✅ BETTER
const { data } = await adminClient
  .from('brand_profiles')
  .select('*')
  .eq('client_id', clientId)  // Always filter, even with service role
```

### Pitfall 4: Storing client selection in session instead of localStorage
```typescript
// ❌ WRONG — session lost on page refresh
const [activeClient, setActiveClient] = useState<ActiveClient | null>(null)

// ✅ CORRECT
useEffect(() => {
  const raw = localStorage.getItem('app_active_client')
  if (raw) setActiveClient(JSON.parse(raw))  // Persists across page refreshes
}, [])
```

---

## Testing Workspace Isolation

### Test Case 1: Cross-Client Access (MIRA)
```typescript
// Login as client A
const { data: dataA } = await clientA
  .from('brand_profiles')
  .select('*')
// Should return profiles for client A only

// Switch to client B (change activeClient)
const { data: dataB } = await clientB
  .from('brand_profiles')
  .select('*')
// Should return profiles for client B only (different data)

// dataA and dataB should not overlap
```

### Test Case 2: Cross-Workspace Access (SF-CRM)
```typescript
// Query SF workspace
const { data: sf } = await adminClient
  .from('crm_contacts')
  .select('*')
  .eq('workspace_id', sfWorkspaceId)
// Returns SF contacts

// Query Discoolver workspace
const { data: disc } = await adminClient
  .from('crm_contacts')
  .select('*')
  .eq('workspace_id', discoolvlerWorkspaceId)
// Returns Discoolver contacts (different data)

// sf and disc should not overlap
```

### Test Case 3: Unauthorized Access
```typescript
// Try to query another client's data directly
const { data, error } = await supabase
  .from('brand_profiles')
  .select('*')
  .eq('client_id', 'some-other-client-id')

// Should return empty array (RLS blocks it)
expect(data?.length).toBe(0)
```

---

## Adding a New App: Checklist

- [ ] Decide: Pattern 1 (user metadata) or Pattern 2 (URL-based)?
- [ ] Add `client_id` or `workspace_id` column to all tables
- [ ] Enable RLS on all tables
- [ ] Create RLS policies for isolation
- [ ] Implement auth setup (Pattern 1) or middleware (Pattern 2)
- [ ] Create context provider (ClientContext or WorkspaceProvider)
- [ ] Test cross-client/workspace isolation
- [ ] Document pattern choice in app's CLAUDE.md
