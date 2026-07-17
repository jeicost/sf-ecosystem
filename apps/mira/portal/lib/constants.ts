/**
 * ⚠️ DEPRECATED: Do not use hardcoded CLIENT_ID
 * Multi-client auth requires dynamic client_id from user_metadata
 * Use: activeClient?.id ?? null (from ClientProvider)
 * Or: user.user_metadata?.client_id (from auth context)
 *
 * This constant has been removed. All pages must use activeClient?.id
 * Falling back to CLIENT_ID will cause routing errors.
 */

export const DEFAULT_SECTION_SLUG = 'marketing'

export const HOT_SCORE_THRESHOLD  = 75
export const WARM_SCORE_THRESHOLD = 50
