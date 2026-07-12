/**
 * Fetches blog posts from SF-CMS and writes them to src/content/posts.json
 * Also regenerates public/sitemap.xml with all blog URLs.
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

const CMS_API_URL = process.env.CMS_API_URL
const CMS_API_KEY = process.env.CMS_API_KEY

if (!CMS_API_URL || !CMS_API_KEY) {
  console.error('❌  Missing CMS_API_URL or CMS_API_KEY in environment.')
  console.error('   Add them to .env or Vercel environment variables.')
  process.exit(1)
}

async function fetchPosts() {
  console.log('📡  Fetching posts from SF-CMS…')

  const res = await fetch(`${CMS_API_URL}/posts?status=published`, {
    headers: { 'x-api-key': CMS_API_KEY },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`CMS API error ${res.status}: ${text}`)
  }

  const { posts } = await res.json()
  console.log(`✅  Got ${posts.length} published post(s)`)
  return posts
}

function buildSitemap(posts) {
  const DOMAIN = 'https://www.ncglobalassets.com'
  const staticPages = ['', '/about', '/services', '/contact', '/blog']

  const staticUrls = staticPages.map(page => `
  <url>
    <loc>${DOMAIN}${page}</loc>
    <changefreq>monthly</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('')

  const postUrls = posts.map(post => `
  <url>
    <loc>${DOMAIN}/blog/${post.slug}</loc>
    <lastmod>${post.published_at?.split('T')[0] ?? new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${postUrls}
</urlset>`
}

async function main() {
  try {
    const posts = await fetchPosts()

    // Normalize to the same format NC Global expects
    const normalized = posts.map(post => ({
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

    // Write posts.json
    const postsPath = path.join(ROOT, 'src', 'content', 'posts.json')
    fs.mkdirSync(path.dirname(postsPath), { recursive: true })
    fs.writeFileSync(postsPath, JSON.stringify(normalized, null, 2))
    console.log(`💾  Wrote ${normalized.length} post(s) to src/content/posts.json`)

    // Regenerate sitemap
    const sitemapPath = path.join(ROOT, 'public', 'sitemap.xml')
    fs.writeFileSync(sitemapPath, buildSitemap(posts))
    console.log('🗺   Updated public/sitemap.xml')

  } catch (err) {
    console.error('❌  Fetch failed:', err.message)
    process.exit(1)
  }
}

main()
