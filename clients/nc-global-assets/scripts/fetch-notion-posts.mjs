import { Client } from '@notionhq/client'
import { NotionToMarkdown } from 'notion-to-md'
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const notion = new Client({ auth: process.env.NOTION_TOKEN })
const n2m = new NotionToMarkdown({ notionClient: notion })

async function fetchPosts() {
  const dbId = process.env.NOTION_BLOG_DB_ID
  if (!dbId) { console.error('❌ NOTION_BLOG_DB_ID not set'); process.exit(1) }
  if (!process.env.NOTION_TOKEN) { console.error('❌ NOTION_TOKEN not set'); process.exit(1) }

  console.log('📥 Fetching posts from Notion...')

  const response = await notion.databases.query({
    database_id: dbId,
    filter: { property: 'Status', select: { equals: 'Published' } },
    sorts: [{ property: 'Published', direction: 'descending' }],
  })

  const posts = []

  for (const page of response.results) {
    const props = page.properties
    const title = props.Title?.title?.[0]?.plain_text ?? 'Untitled'
    const slug = props.Slug?.rich_text?.[0]?.plain_text ?? ''
    const date = props.Published?.date?.start ?? ''
    const category = props.Category?.select?.name ?? ''
    const excerpt = props.Excerpt?.rich_text?.[0]?.plain_text ?? ''
    const author = props.Author?.select?.name ?? ''
    const coverUrl = props['Cover URL']?.url ?? ''

    if (!slug) { console.warn(`⚠️  Post "${title}" has no slug — skipping`); continue }

    const mdBlocks = await n2m.pageToMarkdown(page.id)
    const contentMarkdown = n2m.toMarkdownString(mdBlocks).parent

    posts.push({ slug, title, date, category, excerpt, author, coverUrl, contentMarkdown })
    console.log(`  ✅ "${title}" → /blog/${slug}`)
  }

  writeFileSync(join(ROOT, 'src/content/posts.json'), JSON.stringify(posts, null, 2))
  console.log(`\n✅ Saved ${posts.length} post(s) to src/content/posts.json`)

  updateSitemap(posts)
}

function updateSitemap(posts) {
  const base = 'https://www.ncglobalassets.com'
  const today = new Date().toISOString().split('T')[0]

  const staticUrls = [
    { loc: `${base}/`, priority: '1.0' },
    { loc: `${base}/about`, priority: '0.8' },
    { loc: `${base}/contact`, priority: '0.8' },
    { loc: `${base}/blog`, priority: '0.9' },
  ]

  const postUrls = posts.map(p => ({
    loc: `${base}/blog/${p.slug}`,
    lastmod: p.date || today,
    priority: '0.7',
  }))

  const allUrls = [...staticUrls, ...postUrls]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod ?? today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  writeFileSync(join(ROOT, 'public/sitemap.xml'), xml)
  console.log(`✅ Updated sitemap.xml with ${allUrls.length} URLs`)
}

fetchPosts().catch(e => { console.error(e.message); process.exit(1) })
