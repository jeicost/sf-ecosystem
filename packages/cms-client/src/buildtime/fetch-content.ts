/**
 * Shared build-time CMS fetcher — the pattern every client site's
 * scripts/fetch-cms-content.mjs duplicated ~80% of. Runs before `next build`,
 * writes content/{posts,pages,settings}.json + public/sitemap.xml, and NEVER
 * exits the process on failure — it warns and keeps whatever was cached, so
 * a CMS outage can never fail a site's deploy (see plan Track D3).
 *
 * Requires Node (fs/path) — import from '@sf/cms-client/build', not the
 * package root, so browser bundles never pull this in.
 */
import fs from 'node:fs'
import path from 'node:path'

export interface SchemaDefaults {
  type?: string
  name?: string
  description?: string
  telephone?: string
  address?: string
  city?: string
  country?: string
  sameAs?: string
  logo?: string
}

export interface BuildFetchConfig {
  /** Site's public domain, no trailing slash, e.g. https://www.example.com */
  domain: string
  /** Project slug in the CMS `projects` table */
  projectSlug: string
  /** Absolute path to the directory content/{posts,pages,settings}.json get written to */
  contentDir: string
  /** Absolute path to the directory sitemap.xml gets written to (defaults to no sitemap) */
  publicDir?: string
  /** Locales for hreflang alternates in the sitemap; single-element/omitted = no i18n */
  locales?: string[]
  /** Fallback author name for posts missing author_name */
  defaultAuthor?: string
  /** schema.org defaults merged under each page's seo section overrides */
  schemaDefaults?: SchemaDefaults
  /** Extra static routes to include in the sitemap: {path, priority?, changefreq?} */
  staticRoutes?: { path: string; priority?: string; changefreq?: string }[]
  /** Path to a local posts JSON file to merge in (dedup by slug) — nc-global-assets pattern */
  mergeLocalPostsPath?: string
  /** Defaults to process.env.CMS_API_URL */
  apiUrl?: string
  /** Defaults to process.env.CMS_API_KEY */
  apiKey?: string
}

function buildSitemapUrl(
  loc: string,
  lastmod: string | undefined,
  priority = '0.8',
  changefreq = 'monthly',
  alternates: { lang: string; href: string }[] = []
) {
  const date = lastmod ? lastmod.split('T')[0] : new Date().toISOString().split('T')[0]
  const altTags = alternates
    .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${a.href}" />`)
    .join('\n')
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${altTags}
  </url>`
}

async function fetchJson(url: string, headers: Record<string, string>) {
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return res.json()
}

export async function fetchCmsContent(config: BuildFetchConfig): Promise<void> {
  const apiUrl = config.apiUrl ?? process.env.CMS_API_URL
  const apiKey = config.apiKey ?? process.env.CMS_API_KEY

  if (!apiUrl || !apiKey) {
    console.warn('⚠️  CMS_API_URL or CMS_API_KEY not set — skipping CMS fetch')
    return
  }

  const headers = { 'x-api-key': apiKey }
  const locales = config.locales?.length ? config.locales : undefined

  try {
    console.log(`📡  Fetching content from SF-CMS for ${config.projectSlug}…`)

    const [{ posts }, { pages }, settings] = await Promise.all([
      fetchJson(`${apiUrl}/posts?status=published&project=${config.projectSlug}`, headers),
      fetchJson(`${apiUrl}/pages?project=${config.projectSlug}`, headers),
      fetchJson(`${apiUrl}/settings?project=${config.projectSlug}`, headers).catch(() => ({})),
    ])

    console.log(`✅  Posts: ${posts.length} · Pages: ${pages.length}`)

    // ── posts.json ──────────────────────────────────────────────
    let normalizedPosts = posts.map((post: any) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? '',
      coverUrl: post.cover_url ?? '',
      contentHtml: post.content_html ?? '',
      category: post.category ?? '',
      author: post.author_name ?? config.defaultAuthor ?? 'Admin',
      date: post.published_at?.split('T')[0] ?? '',
      seoTitle: post.seo_title || post.title,
      seoDescription: post.seo_description ?? '',
      ogImage: post.og_image_url ?? post.cover_url ?? '',
    }))

    if (config.mergeLocalPostsPath && fs.existsSync(config.mergeLocalPostsPath)) {
      const localPosts = JSON.parse(fs.readFileSync(config.mergeLocalPostsPath, 'utf8'))
      const cmsSlugs = new Set(normalizedPosts.map((p: any) => p.slug))
      normalizedPosts = [
        ...normalizedPosts,
        ...localPosts.filter((p: any) => !cmsSlugs.has(p.slug)),
      ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }

    // ── pages.json ──────────────────────────────────────────────
    const normalizedPages: Record<string, any> = {}
    for (const page of pages) {
      const sections: Record<string, any> = {}
      for (const section of page.sections_json ?? []) {
        const key = section.id ?? section.type
        sections[key] = { type: section.type, data: section.data }
      }
      const seoData = (page.sections_json ?? []).find((s: any) => s.type === 'seo')?.data ?? {}
      const sd = config.schemaDefaults ?? {}
      normalizedPages[page.slug] = {
        title: page.title,
        seoTitle: seoData.seo_title || page.seo_title || page.title,
        seoDescription: seoData.seo_description || page.seo_description || '',
        ogImage: seoData.og_image || page.og_image_url || '',
        keywords: seoData.keywords || '',
        canonicalUrl: page.canonical_url || null,
        schema: {
          type: seoData.schema_type || sd.type || 'Organization',
          name: seoData.schema_name || sd.name || '',
          description: seoData.schema_description || sd.description || '',
          telephone: seoData.schema_telephone || sd.telephone || '',
          address: seoData.schema_address || sd.address || '',
          city: seoData.schema_city || sd.city || '',
          country: seoData.schema_country || sd.country || '',
          sameAs: seoData.schema_sameAs || sd.sameAs || '',
          logo: seoData.schema_logo || sd.logo || '',
        },
        sections,
        updatedAt: page.updated_at,
      }
    }

    // ── settings.json ───────────────────────────────────────────
    const normalizedSettings = {
      ga_measurement_id: settings?.ga_measurement_id ?? null,
      gtm_container_id: settings?.gtm_container_id ?? null,
    }

    // ── write content files ─────────────────────────────────────
    fs.mkdirSync(config.contentDir, { recursive: true })
    fs.writeFileSync(
      path.join(config.contentDir, 'posts.json'),
      JSON.stringify(normalizedPosts, null, 2)
    )
    fs.writeFileSync(
      path.join(config.contentDir, 'pages.json'),
      JSON.stringify(normalizedPages, null, 2)
    )
    fs.writeFileSync(
      path.join(config.contentDir, 'settings.json'),
      JSON.stringify(normalizedSettings, null, 2)
    )
    console.log('💾  content/posts.json + pages.json + settings.json updated')

    // ── sitemap.xml ─────────────────────────────────────────────
    if (config.publicDir) {
      const today = new Date().toISOString()
      const entries: string[] = []

      if (locales) {
        const rootAlternates = locales.map((l) => ({ lang: l, href: `${config.domain}/${l}` }))
        rootAlternates.push({ lang: 'x-default', href: config.domain })
        entries.push(buildSitemapUrl(config.domain, today, '1.0', 'weekly', rootAlternates))
        for (const locale of locales) {
          entries.push(
            buildSitemapUrl(`${config.domain}/${locale}`, today, '0.9', 'weekly', rootAlternates)
          )
        }
      } else {
        entries.push(buildSitemapUrl(config.domain, today, '1.0', 'weekly'))
      }

      for (const route of config.staticRoutes ?? []) {
        entries.push(
          buildSitemapUrl(`${config.domain}${route.path}`, today, route.priority, route.changefreq)
        )
      }

      for (const [slug, p] of Object.entries(normalizedPages)) {
        if (slug === 'home') continue
        entries.push(buildSitemapUrl(`${config.domain}/${slug}`, (p as any).updatedAt, '0.8', 'monthly'))
      }

      for (const p of normalizedPosts) {
        entries.push(buildSitemapUrl(`${config.domain}/blog/${p.slug}`, p.date, '0.7', 'monthly'))
      }

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>`

      fs.mkdirSync(config.publicDir, { recursive: true })
      fs.writeFileSync(path.join(config.publicDir, 'sitemap.xml'), sitemap)
      console.log('🗺   public/sitemap.xml updated')
    }
  } catch (err) {
    console.warn('⚠️  CMS fetch failed:', (err as Error).message, '— keeping cached content')
    // Never exit(1): a CMS outage must never fail a site's build.
  }
}
