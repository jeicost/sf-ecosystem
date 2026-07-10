# MIRA Integrations — Tools Marketplace

## Overview

The Integrations section is a marketplace where users connect third-party tools and services to unlock agent capabilities and extend system functionality. Tools are organized by category, show pricing tiers, and track adoption metrics.

## Architecture

### Database Schema

**`tool_connections`** — Tracks which tools are connected for each client
- `id`: UUID primary key
- `client_id`: Links to brand_profiles
- `tool_id`: Unique identifier (e.g., 'canva', 'salesforce')
- `status`: 'connected' | 'disconnected' | 'pending'
- `account_email`: User's email for the connected account
- `account_handle`: Username or handle (e.g., @handle on Twitter)
- `auth_token`: Encrypted API key/token for the service
- `metadata`: JSONB for flexible tool-specific data
- `connected_at`, `disconnected_at`: Timestamps
- Unique constraint: (client_id, tool_id)

**`affiliate_tracking`** — Revenue tracking via affiliate links
- `id`: UUID primary key
- `client_id`: Links to brand_profiles
- `tool_id`: Which tool was clicked
- `utm_source`, `utm_medium`, `utm_campaign`: UTM tracking
- `referral_url`: Full URL from click
- `clicked_at`: When the referral link was clicked
- `converted_at`: When user completed signup (manual or webhook)

**`tool_setup_progress`** — Dashboard metrics for onboarding
- `client_id`: Links to brand_profiles
- `critical_tools_connected`: Count of connected critical tools
- `total_critical_tools`: Total critical tools in system (currently 4)
- `setup_percentage`: Calculated percentage
- `last_checked`: When metrics were last updated

### Components

#### `ToolsMarketplace.tsx`
Main marketplace component displaying tool catalog with:
- Category filtering
- Tool cards with emoji, name, description, agents unlocked
- Pricing display (free, paid, via_subscription)
- Critical tools progress bar
- Status-aware buttons (Connected, Connect Account, Upgrade Plan)
- Subscription-aware access control

**Props:**
```tsx
interface ToolsMarketplaceProps {
  connectedTools: string[]              // Array of tool IDs
  userSubscriptionPlan?: 'free' | 'scale' | 'enterprise'
  onToolConnect?: (toolId: string) => Promise<void>
  onToolDisconnect?: (toolId: string) => Promise<void>
}
```

#### `ToolConnectionModal.tsx`
Modal for entering tool authentication credentials:
- Email/account field
- Username/handle field (optional)
- API key/token field (optional, password input)
- Link to create account if needed
- Encryption notice

#### Integrations Page
Route: `/integrations`
- Displays ToolsMarketplace
- Manages modal state
- Tracks affiliate clicks
- Calls connectTool/disconnectTool hooks

### Hooks

#### `useToolConnections(clientId: string)`
Manages tool connection state and API calls

**Returns:**
```tsx
{
  connectedTools: string[]              // Cached list of connected tool IDs
  userSubscriptionPlan: 'free' | 'scale' | 'enterprise'
  isLoading: boolean
  error: string | null
  connectTool(data: ToolConnectionData): Promise<boolean>
  disconnectTool(toolId: string): Promise<boolean>
}
```

### API Routes

#### `GET /api/integrations/tools?clientId=...`
Returns connected tools and subscription plan
```json
{
  "connectedTools": ["canva", "buffer"],
  "userSubscriptionPlan": "scale"
}
```

#### `POST /api/integrations/tools`
Connect a tool for a client
```json
{
  "clientId": "uuid",
  "toolId": "canva",
  "accountEmail": "user@example.com",
  "accountHandle": "@handle",
  "authToken": "sk-...",
  "metadata": {}
}
```

#### `DELETE /api/integrations/tools`
Disconnect a tool
```json
{
  "clientId": "uuid",
  "toolId": "canva"
}
```

#### `POST /api/integrations/affiliate`
Track affiliate link clicks
```json
{
  "clientId": "uuid",
  "toolId": "canva",
  "utmSource": "mira",
  "utmMedium": "integrations_modal",
  "utmCampaign": "canva_onboarding",
  "referralUrl": "https://canva.com?utm_..."
}
```

## Tool Catalog

Currently 8 tools are available:

| Tool | ID | Category | Pricing | Critical | Agents |
|------|----|---------|---------|---------|-|
| Canva | canva | Design | via_subscription | ✓ | zoe, nova, luna |
| Figma | figma | Design | via_subscription | | zoe, spark |
| Buffer | buffer | Social Media | via_subscription | ✓ | noa, herald |
| Hootsuite | hootsuite | Social Media | via_subscription | | noa, herald, luna |
| LinkedIn Navigator | linkedin-navigator | Sales | via_subscription | ✓ | rex, vera, finn |
| Salesforce | salesforce | CRM | paid | ✓ | quinn, nova, ledger |
| Slack | slack | Communication | via_subscription | | herald, pulse, compliance |
| Google Workspace | google-workspace | Productivity | via_subscription | | onboard, midas, quant |

## Adding New Tools

1. Add tool object to `MARKETPLACE_TOOLS` array in ToolsMarketplace.tsx:
```tsx
{
  id: 'new-tool',
  name: 'New Tool',
  emoji: '🔧',
  category: 'Category Name',
  description: 'What it does and why agents need it',
  pricing: 'free' | 'paid' | 'via_subscription',
  setupUrl: 'https://tool.com/signup',
  agentsUnlocked: ['agent1', 'agent2'],
  departments: ['dept1', 'dept2'],
  isCritical: false,
  affiliateUrl: 'https://tool.com/affiliate',
  status: 'disconnected',
}
```

2. Update critical tools list in `/api/integrations/tools` if applicable:
```ts
const criticalTools = [
  'canva',
  'buffer',
  'linkedin-navigator',
  'salesforce',
]
```

## Pricing Models

### Model 1: User Pays Tool Provider
- Users have their own accounts
- We get affiliate revenue
- Tool access via subscription gate

### Model 2: MIRA Pays Provider
- We negotiate wholesale pricing
- User accesses via MIRA subscription
- Included in MIRA Scale/Enterprise plans
- Better user experience, higher cost to us

## Subscription Gating

**Free Plan:**
- Can view all tools
- Can only connect: free tools
- Via_subscription tools show "Upgrade Plan"

**Scale Plan:**
- Can connect all via_subscription tools
- Can connect paid tools (if configured)
- Affiliate revenue flows to MIRA

**Enterprise Plan:**
- Unlimited tool access
- Custom integrations support

## Migration

Run migration before deployment:
```bash
psql $DATABASE_URL < supabase/migrations/0010_tool_integrations.sql
```

## Future Enhancements

- [ ] Tool usage analytics per agent
- [ ] Custom tool builder (no-code connectors)
- [ ] Tool marketplace rating system
- [ ] Bulk tool onboarding wizard
- [ ] Tool health monitoring (API uptime, quota usage)
- [ ] Revenue dashboard for affiliate tracking
- [ ] OAuth2 flow for tools that support it
- [ ] Tool webhook support for real-time updates
