/**
 * Fetches all CMS content from SF-CMS for Salsa Burgers.
 * Writes:
 *   content/posts.json    — blog posts
 *   content/pages.json    — page sections keyed by id
 *   content/settings.json — GA4 measurement ID + project config
 *   public/sitemap.xml    — full sitemap (CMS pages + posts + static)
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

// Accept both the canonical SF_CMS_* names and the legacy CMS_* names.
const CMS_API_URL = process.env.SF_CMS_API_URL || process.env.CMS_API_URL
const CMS_API_KEY = process.env.SF_CMS_API_KEY || process.env.CMS_API_KEY
const PROJECT_SLUG = process.env.SF_CMS_PROJECT_SLUG || process.env.PROJECT_SLUG || 'salsaburgers' // client slug for SF-CMS authentication

if (!CMS_API_URL || !CMS_API_KEY) {
  console.warn('⚠️  CMS_API_URL or CMS_API_KEY not set — skipping CMS fetch')
  process.exit(0)
}

const HEADERS = { 'x-api-key': CMS_API_KEY }
const DOMAIN  = 'https://www.salsaburgers.com'

async function fetchJson(url) {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return res.json()
}

async function fetchText(url) {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) return null
  return res.text()
}

function buildSitemapUrl(loc, lastmod, priority = '0.8', changefreq = 'monthly') {
  const date = lastmod ? lastmod.split('T')[0] : new Date().toISOString().split('T')[0]
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

async function main() {
  try {
    console.log('📡  Fetching content from SF-CMS for Salsa Burgers…')

    // Sentinel en el catch (no {}): si el fetch de settings falla NO hay que
    // sobreescribir content/settings.json con nulls — eso apaga TODOS los
    // pixels de producción en silencio en el siguiente build (pasó de verdad:
    // GA4/GTM estuvieron caídos sin que nadie lo viera).
    const SETTINGS_FETCH_FAILED = Symbol('settings-fetch-failed')
    const [{ posts }, { pages }, settings] = await Promise.all([
      fetchJson(`${CMS_API_URL}/posts?status=published&project=${PROJECT_SLUG}`),
      fetchJson(`${CMS_API_URL}/pages?project=${PROJECT_SLUG}`),
      fetchJson(`${CMS_API_URL}/settings?project=${PROJECT_SLUG}`).catch(() => SETTINGS_FETCH_FAILED),
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
      author:         post.author_name ?? 'Salsa Burgers',
      date:           post.published_at?.split('T')[0] ?? '',
      seoTitle:       post.seo_title || post.title,
      seoDescription: post.seo_description ?? '',
      ogImage:        post.og_image_url ?? post.cover_url ?? '',
    }))

    // ── pages.json — keyed by section id ─────────────────────
    const normalizedPages = {}
    for (const page of pages) {
      const sections = {}
      for (const section of (page.sections_json ?? [])) {
        const key = section.id ?? section.type
        sections[key] = { type: section.type, data: section.data }
      }
      // Extract schema fields from seo section
      const seoData = (page.sections_json ?? []).find(s => s.type === 'seo')?.data ?? {}
      normalizedPages[page.slug] = {
        title:          page.title,
        seoTitle:       seoData.seo_title       || page.seo_title       || page.title,
        seoDescription: seoData.seo_description || page.seo_description || '',
        ogImage:        seoData.og_image        || page.og_image_url    || '',
        keywords:       seoData.keywords        || '',
        schema: {
          type:          seoData.schema_type         || 'WebPage',
          name:          seoData.schema_name         || page.title,
          description:   seoData.schema_description  || '',
          telephone:     seoData.schema_telephone     || '',
          address:       seoData.schema_address       || '',
          city:          seoData.schema_city          || '',
          country:       seoData.schema_country       || 'TH',
          priceRange:    seoData.schema_priceRange    || '',
          cuisine:       seoData.schema_cuisine       || '',
          openingHours:  seoData.schema_openingHours  || '',
          sameAs:        seoData.schema_sameAs        || '',
          logo:          seoData.schema_logo          || '',
          image:         seoData.schema_image         || '',
        },
        sections,
        updatedAt: page.updated_at,
      }
    }

    // ── settings.json ─────────────────────────────────────────
    const settingsPath = path.join(ROOT, 'content', 'settings.json')
    let normalizedSettings
    if (settings === SETTINGS_FETCH_FAILED) {
      // Conservar el fichero anterior si existe; solo escribir nulls si no
      // hay nada previo (primer build sin CMS accesible).
      if (fs.existsSync(settingsPath)) {
        normalizedSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
        console.warn('⚠️  Settings fetch failed — keeping previous content/settings.json')
      } else {
        normalizedSettings = {}
        console.warn('⚠️  Settings fetch failed and no previous settings.json — pixels disabled this build')
      }
    } else {
      normalizedSettings = {
        ga_measurement_id:           settings?.ga_measurement_id           ?? null,
        gtm_container_id:            settings?.gtm_container_id            ?? null,
        meta_pixel_id:               settings?.meta_pixel_id               ?? null,
        google_ads_id:               settings?.google_ads_id               ?? null,
        google_ads_conversion_label: settings?.google_ads_conversion_label ?? null,
        tiktok_pixel_id:             settings?.tiktok_pixel_id             ?? null,
      }
    }

    // ── write files ───────────────────────────────────────────
    const contentDir = path.join(ROOT, 'content')
    fs.mkdirSync(contentDir, { recursive: true })

    // Merge: keep local-only posts (added manually) that aren't in CMS
    const existingPostsRaw = fs.existsSync(path.join(contentDir, 'posts.json'))
      ? JSON.parse(fs.readFileSync(path.join(contentDir, 'posts.json'), 'utf-8'))
      : []
    const cmsSlugs = new Set(normalizedPosts.map(p => p.slug))
    const localOnlyPosts = existingPostsRaw.filter(p => p.local === true && !cmsSlugs.has(p.slug))
    const mergedPosts = [...normalizedPosts, ...localOnlyPosts]

    fs.writeFileSync(path.join(contentDir, 'posts.json'),    JSON.stringify(mergedPosts, null, 2))
    fs.writeFileSync(path.join(contentDir, 'pages.json'),    JSON.stringify(normalizedPages, null, 2))
    fs.writeFileSync(path.join(contentDir, 'settings.json'), JSON.stringify(normalizedSettings, null, 2))
    console.log('💾  content/posts.json + pages.json + settings.json updated')

    // ── sitemap.xml ───────────────────────────────────────────
    const today = new Date().toISOString()
    const staticEntries = [
      buildSitemapUrl(DOMAIN, today, '1.0', 'weekly'),
      buildSitemapUrl(`${DOMAIN}/menu`, today, '0.9', 'weekly'),
    ]

    const pageEntries = Object.entries(normalizedPages)
      .filter(([slug]) => slug !== 'home')
      .map(([slug, p]) => buildSitemapUrl(`${DOMAIN}/${slug}`, p.updatedAt, '0.8', 'monthly'))

    const postEntries = mergedPosts.map(p =>
      buildSitemapUrl(`${DOMAIN}/blog/${p.slug}`, p.date, '0.7', 'monthly')
    )

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[...staticEntries, ...pageEntries, ...postEntries].join('\n')}
</urlset>`

    fs.writeFileSync(path.join(ROOT, 'public', 'sitemap.xml'), sitemap)
    console.log('🗺   public/sitemap.xml updated')

  } catch (err) {
    console.error('❌  CMS fetch failed:', err.message)
    // Don't exit 1 — use cached content/pages.json if it exists
    const pagesPath = path.join(ROOT, 'content', 'pages.json')
    if (fs.existsSync(pagesPath)) {
      console.warn('⚠️  Using cached content from previous build')
    }
  }
}

main()
