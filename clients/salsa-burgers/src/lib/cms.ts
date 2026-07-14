/**
 * SF-CMS Integration for Salsa Burgers
 *
 * Fetches pages, posts, and settings from https://cms.startupsfactory.es
 * Supports ISR (Incremental Static Regeneration) via /api/revalidate webhook
 */

export interface Page {
  id: string
  slug: string
  title: string
  seo_title?: string
  seo_description?: string
  og_image_url?: string
  sections_json: any[]
  sections?: any[]
  updated_at?: string
  [key: string]: any
}

export interface Post {
  id: string
  slug: string
  title: string
  excerpt?: string
  content_html?: string
  cover_url?: string
  published_at?: string
  author_name?: string
  seo_title?: string
  seo_description?: string
  og_image_url?: string
  [key: string]: any
}

interface FetcherConfig {
  apiUrl: string
  apiKey: string
  projectSlug: string
}

let config: FetcherConfig | null = null

function initCmsClient(cfg: FetcherConfig) {
  config = cfg
}

function getConfig(): FetcherConfig {
  if (!config) throw new Error('@sf/cms-client not initialized')
  return config
}

async function cmsFetch<T>(path: string, opts?: any): Promise<T> {
  const cfg = getConfig()
  const url = new URL(path, cfg.apiUrl)
  url.searchParams.set('project', cfg.projectSlug)

  const res = await fetch(url.toString(), {
    headers: { 'x-api-key': cfg.apiKey, 'Content-Type': 'application/json' },
    next: { revalidate: opts?.revalidate ?? 60 },
  })

  if (!res.ok) throw new Error(`CMS API error (${res.status}): ${res.statusText}`)
  return res.json()
}

async function fetchPages(opts?: any): Promise<Page[]> {
  const response = await cmsFetch<any>('/api/public/pages', opts)
  const pages = response.pages || response || []
  return pages.map((page: any) => ({
    ...page,
    sections: page.sections_json || [],
  }))
}

async function fetchPosts(opts?: any): Promise<Post[]> {
  const response = await cmsFetch<any>('/api/public/posts', opts)
  return response.posts || response || []
}

const apiUrl = process.env.SF_CMS_API_URL || 'https://cms.startupsfactory.es'
const apiKey = process.env.SF_CMS_API_KEY || ''
const projectSlug = process.env.SF_CMS_PROJECT_SLUG || 'salsaburgers'

if (!apiKey) {
  console.warn('[CMS] SF_CMS_API_KEY is not set — CMS content will not load')
}

initCmsClient({ apiUrl, apiKey, projectSlug })

/**
 * Fetch all pages for this project from CMS
 * Results are cached with ISR revalidation
 */
export async function getPages() {
  if (!apiKey) return []
  try {
    return await fetchPages({ revalidate: 60 })
  } catch (err) {
    console.error('[CMS] Failed to fetch pages:', err)
    return []
  }
}

/**
 * Fetch all blog posts from CMS
 * Results are cached with ISR revalidation
 */
export async function getPosts() {
  if (!apiKey) return []
  try {
    return await fetchPosts({ revalidate: 60 })
  } catch (err) {
    console.error('[CMS] Failed to fetch posts:', err)
    return []
  }
}

/**
 * Fetch a single page by slug
 */
export async function getPageBySlug(slug: string) {
  const pages = await getPages()
  return pages.find((p) => p.slug === slug)
}

/**
 * Fetch a single post by slug
 */
export async function getPostBySlug(slug: string) {
  const posts = await getPosts()
  return posts.find((p) => p.slug === slug)
}
