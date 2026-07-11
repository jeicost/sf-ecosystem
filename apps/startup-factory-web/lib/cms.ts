const BASE = process.env.CMS_BASE_URL ?? 'https://sf-cms.vercel.app'
const KEY  = process.env.CMS_API_KEY ?? ''
const PROJ = process.env.CMS_PROJECT ?? 'startupsfactory'

export interface CmsPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_url: string | null
  content_html: string | null
  category: string | null
  author_name: string | null
  published_at: string | null
  seo_title: string | null
  seo_description: string | null
  og_image_url: string | null
}

async function fetchCms<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'x-api-key': KEY },
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error(`CMS error ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

export async function getPosts(): Promise<CmsPost[]> {
  const data = await fetchCms<{ posts: CmsPost[] }>(
    `/api/public/posts?project=${PROJ}&status=published`
  )
  return data.posts ?? []
}

export async function getPost(slug: string): Promise<CmsPost | null> {
  try {
    const data = await fetchCms<{ post: CmsPost }>(
      `/api/public/posts?project=${PROJ}&slug=${slug}`
    )
    return data.post ?? null
  } catch {
    return null
  }
}
