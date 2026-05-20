# SF Ecosystem Monorepo

**Phase 2 Complete**: Turborepo + Monorepo Structure

## Directory Structure

```
Desktop/Claude/
├── apps/                    # All products & tools
│   ├── ai-agency-sf-next/   # AI Agency SF operations portal
│   ├── mira/                # MIRA SaaS portal (formerly agency-os)
│   ├── mira-landing/        # MIRA marketing website
│   ├── sf-cms/              # CMS for client landings
│   ├── sf-crm/              # CRM + Sales Engine (merged)
│   ├── sf-links/            # QR/link generation tool
│   ├── sf-reports/          # Deliverables hub
│   ├── sf-sales-engine/     # B2B discovery & lead intel (merges into sf-crm)
│   ├── startup-factory-web/ # SF landing + main website
│   └── ...
│
├── packages/                # Shared code
│   ├── auth/                # @sf/auth - Supabase SSR helpers
│   ├── supabase/            # @sf/supabase - Client + types
│   ├── ui/                  # @sf/ui - Shared React components
│   └── config/              # @sf/config - ESLint + TypeScript shared configs
│
├── clients/                 # Per-client projects (non-SF tools)
│   ├── discoolver/
│   ├── salsa-burgers/
│   ├── nc-global-assets/
│   └── ...
│
├── tools/                   # MCPs & local utilities
├── scripts/                 # Automation & deployment scripts
├── projects/                # Special projects (forma, etc.)
│
├── package.json             # Workspace root + Turborepo config
├── turbo.json               # Turborepo task definitions
├── CLAUDE.md                # Project guidelines
├── ARCHITECTURE.md          # System design
└── .gitignore               # Git ignore rules

```

## Workspace Setup

### Root `package.json`

Defines workspaces for all apps and packages:
```json
{
  "workspaces": ["apps/*", "packages/*"]
}
```

### `turbo.json`

Configures task execution across apps:
- `build`: Compile apps (dependencies: `^build`)
- `dev`: Start dev servers (no cache)
- `lint`: Check code quality
- `type-check`: Run TypeScript checks
- `test`: Run tests

## Shared Packages

### `@sf/auth`
Supabase authentication helpers via `@supabase/ssr`. Each app uses this instead of duplicating auth logic.

**Setup in an app:**
```json
{
  "dependencies": {
    "@sf/auth": "*"
  }
}
```

### `@sf/supabase`
Shared Supabase client, types, and utilities.

**Setup in an app:**
```ts
import { createClient } from '@sf/supabase';
import type { Database } from '@sf/supabase/types';
```

### `@sf/ui`
Common React components (buttons, cards, modals, forms, etc.). To be extracted from existing projects.

### `@sf/config`
TypeScript configs and ESLint rules shared across all projects.

## Running Commands

### Develop all apps
```bash
npm run dev
# Starts all dev servers (turbo runs in parallel)
```

### Build all apps
```bash
npm run build
# Compiles all apps with dependencies respected
```

### Build specific app
```bash
cd apps/sf-cms
npm run build
```

### Type-check all apps
```bash
npm run type-check
```

### Lint all apps
```bash
npm run lint
```

## Next Steps (Phase 3: Supabase Separation)

- Create 5 independent Supabase instances (one per product domain)
- Migrate schemas from shared `nnevhtfxuawexliwlbmh`
- Update `.env.local` in each app to point to correct instance
- Verify RLS policies are enforced

## Maintenance

### Adding a new app
1. Create `apps/your-app/`
2. Add `package.json` with `"name": "your-app"`
3. Create `.vercel/project.json` with correct `projectId`
4. Add build/dev scripts to `package.json`

### Adding a shared package
1. Create `packages/your-package/`
2. Add `package.json` with `"name": "@sf/your-package"`
3. Install in apps: `npm install @sf/your-package`

### Deploying from monorepo
Each app deploys independently via Vercel:
```bash
cd apps/your-app
vercel --prod --yes
```

Vercel will read `.vercel/project.json` to deploy to the correct project.

---

**Status**: Phase 2 ✅ Complete  
**Next Phase**: Phase 3 (Supabase Separation)
