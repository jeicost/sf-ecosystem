/**
 * SF-CMS API Fetchers
 *
 * All functions return fresh data with Next.js caching directives (tags-based).
 * Each function can be used in Server Components with next: { tags } for ISR.
 */

import { Page, Post, Settings, CmsApiResponse, FetchOptions } from '../types/index'

export interface FetcherConfig {
  apiUrl: string
  apiKey: string
  projectSlug: string
}

let config: FetcherConfig | null = null

/**
 * Initialize the CMS client with API credentials.
 * Call this once at app startup (e.g., in app/layout.tsx).
 */
export function initCmsClient(cfg: FetcherConfig) {
  config = cfg
}

/**
 * Get config, throw if not initialized
 */
function getConfig(): FetcherConfig {
  if (!config) {
    throw new Error(
      '@sf/cms-client not initialized. Call initCmsClient() once at app startup.',
    )
  }
  return config
}

/**
 * Base fetch with CMS auth + Next.js caching
 */
async function cmsFetch<T>(
  path: string,
  options?: FetchOptions,
): Promise<T> {
  const cfg = getConfig()
  const url = new URL(path, cfg.apiUrl)
  url.searchParams.set('project', cfg.projectSlug)

  const fetchOptions: RequestInit & { next?: any } = {
    headers: {
      'x-api-key': cfg.apiKey,
      'Content-Type': 'application/json',
    },
  }

  // ISR caching configuration
  if (typeof options?.revalidate === 'number' || options?.revalidate === false) {
    fetchOptions.next = { revalidate: options.revalidate }
  } else if (options?.next?.revalidate) {
    fetchOptions.next = { revalidate: options.next.revalidate }
  }

  const res = await fetch(url.toString(), fetchOptions)

  if (!res.ok) {
    throw new Error(
      `CMS API error (${res.status}): ${res.statusText} (path: ${path})`,
    )
  }

  return res.json()
}

/**
 * Fetch a single page by slug (with all its sections)
 */
export async function fetchPage(
  slug: string,
  options?: FetchOptions,
): Promise<Page> {
  const data = await cmsFetch<CmsApiResponse<Page>>(
    `/api/public/pages/${slug}`,
    options,
  )

  if (data.error) {
    throw new Error(`Failed to fetch page "${slug}": ${data.error}`)
  }

  return data.data
}

/**
 * Fetch all pages (or filtered by status)
 */
export async function fetchPages(
  options?: FetchOptions & { status?: 'draft' | 'published' },
): Promise<Page[]> {
  const url =
    options?.status ? `/api/public/pages?status=${options.status}` : '/api/public/pages'

  const data = await cmsFetch<CmsApiResponse<Page[]>>(url, options)

  if (data.error) {
    throw new Error(`Failed to fetch pages: ${data.error}`)
  }

  return data.data
}

/**
 * Fetch a single blog post by slug
 */
export async function fetchPost(
  slug: string,
  options?: FetchOptions,
): Promise<Post> {
  const data = await cmsFetch<CmsApiResponse<Post>>(
    `/api/public/posts/${slug}`,
    options,
  )

  if (data.error) {
    throw new Error(`Failed to fetch post "${slug}": ${data.error}`)
  }

  return data.data
}

/**
 * Fetch all blog posts (or filtered by status)
 */
export async function fetchPosts(
  options?: FetchOptions & { status?: 'draft' | 'published' },
): Promise<Post[]> {
  const url =
    options?.status ? `/api/public/posts?status=${options.status}` : '/api/public/posts'

  const data = await cmsFetch<CmsApiResponse<Post[]>>(url, options)

  if (data.error) {
    throw new Error(`Failed to fetch posts: ${data.error}`)
  }

  return data.data
}

/**
 * Fetch global site settings (GA4 ID, GTM container, etc.)
 */
export async function fetchSettings(
  options?: FetchOptions,
): Promise<Settings> {
  const data = await cmsFetch<CmsApiResponse<Settings>>(
    '/api/public/settings',
    options,
  )

  if (data.error) {
    throw new Error(`Failed to fetch settings: ${data.error}`)
  }

  return data.data
}
