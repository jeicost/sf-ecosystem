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
 * Maps sections_json → sections for the Page interface
 */
export async function fetchPage(
  slug: string,
  options?: FetchOptions,
): Promise<Page> {
  const url = `/api/public/pages?slug=${encodeURIComponent(slug)}`
  const rawPage = await cmsFetch<any>(url, options)

  if (!rawPage) {
    throw new Error(`Failed to fetch page "${slug}": not found`)
  }

  return {
    ...rawPage,
    sections: rawPage.sections_json || [],
  }
}

/**
 * Fetch all pages (or filtered by status)
 * Maps sections_json → sections for each Page
 */
export async function fetchPages(
  options?: FetchOptions & { status?: 'draft' | 'published' },
): Promise<Page[]> {
  const url =
    options?.status ? `/api/public/pages?status=${options.status}` : '/api/public/pages'

  const response = await cmsFetch<any>(url, options)
  const pages = response.pages || response || []

  return pages.map((page: any) => ({
    ...page,
    sections: page.sections_json || [],
  }))
}

/**
 * Fetch a single blog post by slug
 */
export async function fetchPost(
  slug: string,
  options?: FetchOptions,
): Promise<Post> {
  const url = `/api/public/posts?slug=${encodeURIComponent(slug)}`
  const rawPost = await cmsFetch<any>(url, options)

  if (!rawPost) {
    throw new Error(`Failed to fetch post "${slug}": not found`)
  }

  return rawPost
}

/**
 * Fetch all blog posts (or filtered by status)
 */
export async function fetchPosts(
  options?: FetchOptions & { status?: 'draft' | 'published' },
): Promise<Post[]> {
  const url =
    options?.status ? `/api/public/posts?status=${options.status}` : '/api/public/posts'

  const response = await cmsFetch<any>(url, options)
  return response.posts || response || []
}

/**
 * Fetch global site settings (GA4 ID, GTM container, etc.)
 * TODO: Requires /api/public/settings endpoint in SF-CMS
 */
export async function fetchSettings(
  options?: FetchOptions,
): Promise<Settings> {
  try {
    const url = '/api/public/settings'
    return await cmsFetch<Settings>(url, options)
  } catch {
    return {}
  }
}
