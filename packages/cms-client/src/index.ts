/**
 * @sf/cms-client
 *
 * Shared CMS client library for SF sites — provides types, fetchers, renderers,
 * and revalidation handlers for a unified "WordPress-like but easier" content
 * management experience across all client landing sites.
 */

// Types
export type {
  Project,
  Section,
  Page,
  Post,
  Settings,
  CmsApiResponse,
  RevalidatePayload,
  SectionRegistry,
  FetchOptions,
} from './types/index'

// Fetchers
export {
  initCmsClient,
  fetchPage,
  fetchPages,
  fetchPost,
  fetchPosts,
  fetchSettings,
} from './fetchers/index'

export type { FetcherConfig } from './fetchers/index'

// Renderers
export {
  RenderSections,
  mergeCmsData,
} from './renderers/render-sections'

export type { RenderSectionsProps } from './renderers/render-sections'

// Handlers
export {
  createRevalidateHandler,
} from './handlers/revalidate-handler'

export type { RevalidateHandlerConfig } from './handlers/revalidate-handler'
