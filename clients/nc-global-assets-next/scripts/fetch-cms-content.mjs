/**
 * Fetches all CMS content (posts + pages) from SF-CMS.
 * Writes:
 *   src/content/posts.json   → blog posts
 *   src/content/pages.json   → page sections (hero, services, FAQ, etc.)
 *   public/sitemap.xml       → updated sitemap
 *
 * Required env vars:
 *   CMS_API_URL   — e.g. https://your-cms.vercel.app/api/public
 *   CMS_API_KEY   — project API key from SF-CMS Settings
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const HEADERS = { 'x-api-key': process.env.CMS_API_KEY }

const CMS_API_URL = process.env.CMS_API_URL
const CMS_API_KEY = process.env.CMS_API_KEY

if (!CMS_API_URL || !CMS_API_KEY) {
  console.log('⚠️   CMS_API_URL or CMS_API_KEY not set — skipping content fetch')
  console.log('   (Using existing content files, or provide env vars in Vercel)')
  process.exit(0)
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return res.json()
}

async function main() {
  try {
    console.log('📡  Fetching content from SF-CMS…')

    const [{ posts }, { pages }, settings] = await Promise.all([
      fetchJson(`${CMS_API_URL}/posts?status=published`),
      fetchJson(`${CMS_API_URL}/pages`),
      fetchJson(`${CMS_API_URL}/settings`).catch(() => ({})),
    ])

    console.log(`✅  Posts: ${posts.length} · Pages: ${pages.length}`)

    // Write posts.json
    const normalizedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? '',
      coverUrl: post.cover_url ?? '',
      contentHtml: post.content_html ?? '',
      category: post.category ?? '',
      author: post.author_name ?? 'Admin',
      date: post.published_at?.split('T')[0] ?? '',
      seoTitle: post.seo_title || post.title,
      seoDescription: post.seo_description ?? '',
      ogImage: post.og_image_url ?? post.cover_url ?? '',
    }))

    // Write pages.json — keyed by section id
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
          type:        seoData.schema_type        || 'ProfessionalService',
          name:        seoData.schema_name        || 'NC Global Assets',
          description: seoData.schema_description || '',
          telephone:   seoData.schema_telephone   || '',
          address:     seoData.schema_address     || '',
          city:        seoData.schema_city        || 'Bangkok',
          country:     seoData.schema_country     || 'TH',
          sameAs:      seoData.schema_sameAs      || '',
        },
        sections,
        updatedAt: page.updated_at,
      }
    }

    const contentDir = path.join(ROOT, 'src', 'content')
    fs.mkdirSync(contentDir, { recursive: true })

    // settings.json
    const normalizedSettings = { ga_measurement_id: settings?.ga_measurement_id ?? null }
    fs.writeFileSync(path.join(contentDir, 'settings.json'), JSON.stringify(normalizedSettings, null, 2))

    // Merge local posts
    const localPostsPath = path.join(contentDir, 'posts-local.json')
    const localPosts = fs.existsSync(localPostsPath) ? JSON.parse(fs.readFileSync(localPostsPath, 'utf8')) : []
    const cmsSlugs = new Set(normalizedPosts.map(p => p.slug))
    const merged = [...normalizedPosts, ...localPosts.filter(p => !cmsSlugs.has(p.slug))]
    merged.sort((a, b) => new Date(b.date) - new Date(a.date))

    fs.writeFileSync(path.join(contentDir, 'posts.json'),    JSON.stringify(merged, null, 2))
    fs.writeFileSync(path.join(contentDir, 'pages.json'),    JSON.stringify(normalizedPages, null, 2))
    console.log(`💾  Wrote posts.json (${normalizedPosts.length} CMS + ${localPosts.length} local) + pages.json + settings.json`)

    // ── Patch index.html with CMS SEO + GA4 ─────────────────
    const indexPath = path.join(ROOT, 'index.html')
    if (fs.existsSync(indexPath) && normalizedSettings.ga_measurement_id) {
      let html = fs.readFileSync(indexPath, 'utf8')
      // Replace existing GA4 measurement ID if present
      html = html.replace(/gtag\/js\?id=G-[A-Z0-9]+/g, `gtag/js?id=${normalizedSettings.ga_measurement_id}`)
      html = html.replace(/gtag\('config',\s*'G-[A-Z0-9]+'\)/g, `gtag('config', '${normalizedSettings.ga_measurement_id}')`)
      fs.writeFileSync(indexPath, html)
      console.log(`📊  GA4 ID patched: ${normalizedSettings.ga_measurement_id}`)
    }

    // ── Sitemap with CMS pages ───────────────────────────────
    const DOMAIN = 'https://www.ncglobalassets.com'
    const today = new Date().toISOString()
    const staticPages = [
      { path: '',                        priority: '1.0', freq: 'weekly' },
      { path: '/about',                  priority: '0.8', freq: 'monthly' },
      { path: '/services',               priority: '0.8', freq: 'monthly' },
      { path: '/contact',                priority: '0.7', freq: 'monthly' },
      { path: '/blog',                   priority: '0.7', freq: 'weekly' },
      { path: '/case-studies/salsa-burgers', priority: '0.6', freq: 'monthly' },
    ]

    const staticEntries = staticPages.map(p =>
      `  <url><loc>${DOMAIN}${p.path}</loc><lastmod>${today.split('T')[0]}</lastmod><changefreq>${p.freq}</changefreq><priority>${p.priority}</priority></url>`
    )
    const cmsPageEntries = Object.entries(normalizedPages)
      .filter(([slug]) => slug !== 'home')
      .map(([slug, p]) => `  <url><loc>${DOMAIN}/${slug}</loc><lastmod>${(p.updatedAt || today).split('T')[0]}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`)
    const postEntries = merged.map(p =>
      `  <url><loc>${DOMAIN}/blog/${p.slug}</loc><lastmod>${p.date}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`
    )

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticEntries, ...cmsPageEntries, ...postEntries].join('\n')}
</urlset>`
    fs.writeFileSync(path.join(ROOT, 'public', 'sitemap.xml'), sitemap)
    console.log('🗺   Updated sitemap.xml')

  } catch (err) {
    console.warn('⚠️  CMS fetch failed:', err.message, '— using local content only')

    // Fallback: write local posts + empty pages so build continues
    const contentDir = path.join(ROOT, 'src', 'content')
    fs.mkdirSync(contentDir, { recursive: true })
    const localPostsPath = path.join(contentDir, 'posts-local.json')
    const localPosts = fs.existsSync(localPostsPath) ? JSON.parse(fs.readFileSync(localPostsPath, 'utf8')) : []
    const existingPostsPath = path.join(contentDir, 'posts.json')
    const existingPosts = fs.existsSync(existingPostsPath) ? JSON.parse(fs.readFileSync(existingPostsPath, 'utf8')) : []
    const existingPagesPath = path.join(contentDir, 'pages.json')
    const existingPages = fs.existsSync(existingPagesPath) ? JSON.parse(fs.readFileSync(existingPagesPath, 'utf8')) : {}

    // Merge local posts with any previously fetched posts
    const cmsSlugs = new Set(existingPosts.map(p => p.slug))
    const merged = [...existingPosts, ...localPosts.filter(p => !cmsSlugs.has(p.slug))]
    merged.sort((a, b) => new Date(b.date) - new Date(a.date))
    fs.writeFileSync(existingPostsPath, JSON.stringify(merged, null, 2))
    if (!fs.existsSync(existingPagesPath)) {
      fs.writeFileSync(existingPagesPath, JSON.stringify(existingPages, null, 2))
    }
    console.log(`💾  Fallback: wrote ${merged.length} posts from local cache`)
  }
}

main()
