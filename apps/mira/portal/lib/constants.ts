/**
 * ⚠️ DEPRECATED: Do not use hardcoded CLIENT_ID
 * Multi-client auth requires dynamic client_id from user_metadata
 * Use: activeClient?.id ?? null (from ClientProvider)
 * Or: user.user_metadata?.client_id (from auth context)
 *
 * This constant is kept only for backward compatibility during transition.
 * Using this constant will route users to wrong client.
 */
export const CLIENT_ID = '714a028e-a16d-428c-b8a9-3338f56f0a9c' // ❌ DO NOT USE

export const DEFAULT_SECTION_SLUG = 'marketing'

export const HOT_SCORE_THRESHOLD  = 75
export const WARM_SCORE_THRESHOLD = 50
