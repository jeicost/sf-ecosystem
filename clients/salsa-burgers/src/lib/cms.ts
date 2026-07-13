/**
 * SF-CMS Integration for Salsa Burgers
 * 
 * Fetches pages, posts, and settings from https://cms.startupsfactory.es
 * Supports ISR (Incremental Static Regeneration) via /api/revalidate webhook
 */

import { fetchPages, fetchPosts, fetchSettings, type Page, type Post } from '@sf/cms-client'

const apiUrl = process.env.SF_CMS_API_URL || 'https://cms.startupsfactory.es'
const apiKey = process.env.SF_CMS_API_KEY
const projectSlug = process.env.SF_CMS_PROJECT_SLUG || 'salsaburgers'

if (!apiKey) {
  console.warn('[CMS] SF_CMS_API_KEY is not set — CMS content will not load')
}

/**
 * Fetch all pages for this project from CMS
 * Results are cached with ISR revalidation
 */
export async function getPages() {
  if (!apiKey) return []
  try {
    return await fetchPages(projectSlug, { 
      baseUrl: apiUrl,
      apiKey,
      revalidate: 60,
    })
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
    return await fetchPosts(projectSlug, {
      baseUrl: apiUrl,
      apiKey,
      revalidate: 60,
    })
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
