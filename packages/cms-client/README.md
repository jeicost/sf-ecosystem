# @sf/cms-client

Shared CMS client library for Startup Factory landing sites. Provides a unified contract for:

- **Types**: `Project`, `Page`, `Section`, `Post`, `Settings`
- **Fetchers**: `fetchPage()`, `fetchPages()`, `fetchPost()`, `fetchPosts()`, `fetchSettings()`
- **Rendering**: `RenderSections()` generic section renderer + registry pattern
- **Revalidation**: `createRevalidateHandler()` factory for `/api/revalidate` endpoints

## Installation

```bash
pnpm add @sf/cms-client
```

## Quick Start

### 1. Initialize the CMS client

In your app's root layout or entry point:

```ts
// app/layout.tsx
import { initCmsClient } from '@sf/cms-client'

export default function RootLayout({ children }) {
  initCmsClient({
    apiUrl: process.env.SF_CMS_API_URL || 'https://cms.startupsfactory.es/api/public',
    apiKey: process.env.SF_CMS_API_KEY!,
    projectSlug: process.env.SF_CMS_PROJECT_SLUG!,
  })

  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
```

### 2. Fetch and render a page

```tsx
// app/page.tsx
import { fetchPage, RenderSections } from '@sf/cms-client'
import * as sections from '@/components/sections'

const sectionRegistry = {
  hero: sections.Hero,
  features: sections.Features,
  testimonials: sections.Testimonials,
  // ...register all your section components
}

export default async function HomePage() {
  const page = await fetchPage('home')

  return (
    <main>
      <RenderSections
        sections={page.sections}
        registry={sectionRegistry}
        locale="es"
      />
    </main>
  )
}
```

### 3. Set up revalidation

```ts
// app/api/revalidate/route.ts
import { createRevalidateHandler } from '@sf/cms-client'

export const POST = createRevalidateHandler()
```

The Supabase webhook will send a POST request with:
```json
{
  "paths": ["page:home", "page:about"]
}
```

Or the legacy format:
```json
{
  "type": "post",
  "slug": "my-article"
}
```

Both are supported automatically.

## Environment Variables

Required in Vercel/local `.env.local`:

```env
SF_CMS_API_URL=https://cms.startupsfactory.es/api/public
SF_CMS_API_KEY=<your-project-api-key>
SF_CMS_PROJECT_SLUG=<your-client-slug>
```

## API

### `initCmsClient(config)`

Initialize the CMS client globally. Must be called once at app startup.

### `fetchPage(slug, options?)`

Fetch a single page by slug, including all its sections.

### `fetchPages(options?)`

Fetch all pages (optionally filtered by `status: 'published'`).

### `fetchPost(slug, options?)`

Fetch a single blog post by slug.

### `fetchPosts(options?)`

Fetch all blog posts (optionally filtered by `status: 'published'`).

### `fetchSettings(options?)`

Fetch global site settings (GA4 ID, GTM container, etc.).

### `RenderSections({ sections, registry, locale?, fallbackComponent? })`

Render an array of CMS sections using a React component registry.

If a section type is not found in the registry, renders an error div by default. Pass `fallbackComponent` to customize.

### `mergeCmsData(hardcodedDict, cmsData, locale)`

Helper for migrating from fully-hardcoded sites to CMS-backed. Merges CMS values over hardcoded i18n dict, respecting locale-specific fields (`fieldName_en`, `fieldName_es`, etc.).

### `createRevalidateHandler(config?)`

Factory to create a Next.js route handler for `POST /api/revalidate`.

Supports both webhook payload formats and validates the `x-revalidate-secret` header. Uses tag-based revalidation for precise ISR.

## Architecture Notes

- **Fetch strategy**: All fetchers use Next.js `fetch()` with `next: { tags }` for ISR
- **No snapshots**: Unlike older sites, there's no build-time snapshot — all content is fresh per-request (with ISR caching)
- **Section registry**: Each site registers its own React components; new section types work automatically
- **Backwards compat**: `mergeCmsData()` helper for gradual migration from hardcoded → CMS-driven content

## Testing

```bash
pnpm test
pnpm test:watch
```

## License

MIT
