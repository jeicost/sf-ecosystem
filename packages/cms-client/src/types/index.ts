/**
 * SF-CMS Data Models
 *
 * Canonical type definitions for all SF site integrations.
 * Matches the real Supabase schema (dmzecrlkclocqaywkjtc).
 */

/** A CMS project — typically one per client site */
export interface Project {
  id: string
  name: string
  slug: string
  /** Legacy/denormalized; prefer project_id in pages */
  client_slug?: string
  domain?: string
  api_key: string
  settings?: Record<string, unknown>
  created_at?: string
}

/** A content section — flexible type system, no enum */
export interface Section<T = unknown> {
  id: string
  type: string
  data: T
}

/** A page with sections — corresponds to pages table */
export interface Page<T = unknown> {
  slug: string
  title: string
  seo_title?: string
  seo_description?: string
  og_image_url?: string
  sections: Section<T>[]
  updated_at?: string
  status?: 'draft' | 'published'
}

/** A blog post — corresponds to posts table */
export interface Post {
  id: string
  title: string
  slug: string
  excerpt?: string
  cover_url?: string
  content_html: string
  category?: string
  author_name?: string
  published_at?: string
  seo_title?: string
  seo_description?: string
  og_image_url?: string
  status?: 'draft' | 'published'
}

/** Global site settings */
export interface Settings {
  ga_measurement_id?: string
  gtm_container_id?: string
  [key: string]: unknown
}

/** API response shape from CMS public endpoints */
export interface CmsApiResponse<T> {
  data: T
  error?: string | null
}

/** Revalidation trigger payload — supports both webhook formats */
export interface RevalidatePayload {
  type?: 'post' | 'page' | 'all'
  slug?: string
  paths?: string[]
}

/** Section registry — maps section type strings to React component keys */
export type SectionRegistry = Record<
  string,
  React.ComponentType<{ data: unknown; locale?: string }>
>

/** Fetch options for API calls */
export interface FetchOptions {
  tags?: string[]
  revalidate?: number | false
  next?: {
    revalidate?: number | false
    tags?: string[]
  }
}
