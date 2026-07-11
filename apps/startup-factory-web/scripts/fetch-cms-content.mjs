/**
 * Fetches all CMS content from SF-CMS for Startup Factory.
 * Writes:
 *   content/posts.json    — blog posts
 *   content/pages.json    — page sections keyed by id
 *   content/settings.json — GA4 measurement ID + project config
 *   public/sitemap.xml    — full sitemap with hreflang entries
 *
 * Env vars required:
 *   CMS_API_URL  — https://cms.startupsfactory.es/api/public
 *   CMS_API_KEY  — project API key from SF-CMS Settings
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const CMS_API_URL = process.env.CMS_API_URL
const CMS_API_KEY = process.env.CMS_API_KEY
const PROJECT_SLUG = process.env.CMS_PROJECT || process.env.PROJECT_SLUG || 'sf' // client slug for SF-CMS authentication

if (!CMS_API_URL || !CMS_API_KEY) {
  console.warn('⚠️  CMS_API_URL or CMS_API_KEY not set — skipping CMS fetch')
  process.exit(0)
}

const HEADERS = { 'x-api-key': CMS_API_KEY }
const DOMAIN  = 'https://startupsfactory.es'
const LOCALES = ['es', 'en', 'th']

async function fetchJson(url) {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return res.json()
}

function buildSitemapUrl(loc, lastmod, priority = '0.8', changefreq = 'monthly', alternates = []) {
  const date = lastmod ? lastmod.split('T')[0] : new Date().toISOString().split('T')[0]
  const altTags = alternates.map(a => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${a.href}" />`).join('\n')
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${altTags}
  </url>`
}

async function main() {
  try {
    console.log('📡  Fetching content from SF-CMS for Startup Factory…')

    const [{ posts }, { pages }, settings] = await Promise.all([
      fetchJson(`${CMS_API_URL}/posts?status=published&project=${PROJECT_SLUG}`),
      fetchJson(`${CMS_API_URL}/pages?project=${PROJECT_SLUG}`),
      fetchJson(`${CMS_API_URL}/settings`).catch(() => ({})),
    ])

    console.log(`✅  Posts: ${posts.length} · Pages: ${pages.length}`)

    // ── posts.json ────────────────────────────────────────────
    const normalizedPosts = posts.map(post => ({
      id:             post.id,
      title:          post.title,
      slug:           post.slug,
      excerpt:        post.excerpt ?? '',
      coverUrl:       post.cover_url ?? '',
      contentHtml:    post.content_html ?? '',
      category:       post.category ?? '',
      author:         post.author_name ?? 'Startup Factory',
      date:           post.published_at?.split('T')[0] ?? '',
      seoTitle:       post.seo_title || post.title,
      seoDescription: post.seo_description ?? '',
      ogImage:        post.og_image_url ?? post.cover_url ?? '',
    }))

    // ── pages.json ────────────────────────────────────────────
    const normalizedPages = {}
    for (const page of pages) {
      const sections = {}
      for (const section of (page.sections_json ?? [])) {
        const key = section.id ?? section.type
        sections[key] = { type: section.type, data: section.data }
      }
      const seoData = (page.sections_json ?? []).find(s => s.type === 'seo')?.data ?? {}
      normalizedPages[page.slug] = {
        title:          page.title,
        seoTitle:       seoData.seo_title       || page.seo_title       || page.title,
        seoDescription: seoData.seo_description || page.seo_description || '',
        ogImage:        seoData.og_image        || page.og_image_url    || '',
        keywords:       seoData.keywords        || '',
        schema: {
          type:         seoData.schema_type        || 'Organization',
          name:         seoData.schema_name        || 'Startup Factory',
          description:  seoData.schema_description || '',
          telephone:    seoData.schema_telephone   || '',
          address:      seoData.schema_address     || '',
          city:         seoData.schema_city        || 'Bangkok',
          country:      seoData.schema_country     || 'TH',
          sameAs:       seoData.schema_sameAs      || '',
          logo:         seoData.schema_logo        || '',
        },
        sections,
        updatedAt: page.updated_at,
      }
    }

    // ── settings.json ─────────────────────────────────────────
    const normalizedSettings = {
      ga_measurement_id: settings?.ga_measurement_id ?? null,
      gtm_container_id:  settings?.gtm_container_id  ?? null,
    }

    // ── write files ───────────────────────────────────────────
    const contentDir = path.join(ROOT, 'content')
    fs.mkdirSync(contentDir, { recursive: true })
    fs.writeFileSync(path.join(contentDir, 'posts.json'),    JSON.stringify(normalizedPosts, null, 2))
    fs.writeFileSync(path.join(contentDir, 'pages.json'),    JSON.stringify(normalizedPages, null, 2))
    fs.writeFileSync(path.join(contentDir, 'settings.json'), JSON.stringify(normalizedSettings, null, 2))
    console.log('💾  content/posts.json + pages.json + settings.json updated')

    // ── sitemap.xml with i18n hreflang ────────────────────────
    const today = new Date().toISOString()

    // Root (defaults to /es)
    const rootAlternates = LOCALES.map(l => ({ lang: l, href: `${DOMAIN}/${l}` }))
    rootAlternates.push({ lang: 'x-default', href: DOMAIN })

    const entries = [
      buildSitemapUrl(DOMAIN, today, '1.0', 'weekly', rootAlternates),
      ...LOCALES.map(locale =>
        buildSitemapUrl(`${DOMAIN}/${locale}`, today, '0.9', 'weekly',
          LOCALES.map(l => ({ lang: l, href: `${DOMAIN}/${l}` }))
        )
      ),
    ]

    // CMS pages (non-home)
    for (const [slug, p] of Object.entries(normalizedPages)) {
      if (slug === 'home') continue
      entries.push(buildSitemapUrl(`${DOMAIN}/${slug}`, p.updatedAt, '0.8', 'monthly'))
    }

    // Blog posts
    for (const p of normalizedPosts) {
      entries.push(buildSitemapUrl(`${DOMAIN}/blog/${p.slug}`, p.date, '0.7', 'monthly'))
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>`

    fs.writeFileSync(path.join(ROOT, 'public', 'sitemap.xml'), sitemap)
    console.log('🗺   public/sitemap.xml updated')

  } catch (err) {
    console.error('❌  CMS fetch failed:', err.message)
    // Fallback: use cached content
    const pagesPath = path.join(ROOT, 'content', 'pages.json')
    if (!fs.existsSync(pagesPath)) process.exit(1)
    console.warn('⚠️  Using cached content from previous build')
  }
}

main()
