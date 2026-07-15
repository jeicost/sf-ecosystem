/**
 * Feature Flags for Visual Generation System
 *
 * Environment variables to control behavior:
 * - ENABLE_VISUAL_GENERATION: 'true' | 'false' (default: false)
 * - VISUAL_PROVIDER: 'mock' | 'openai' | 'midjourney' (default: 'mock')
 * - OPENAI_API_KEY: OpenAI API key for real provider (optional)
 */

export interface FeatureFlags {
  enableVisualGeneration: boolean
  visualProvider: 'mock' | 'openai' | 'midjourney'
  hasOpenAIKey: boolean
}

/**
 * Get current feature flags from environment
 */
export function getVisualFeatureFlags(): FeatureFlags {
  const enableVisualGeneration =
    process.env.ENABLE_VISUAL_GENERATION === 'true'

  const visualProvider = (
    process.env.VISUAL_PROVIDER || 'mock'
  ) as 'mock' | 'openai' | 'midjourney'

  const hasOpenAIKey = !!process.env.OPENAI_API_KEY

  return {
    enableVisualGeneration,
    visualProvider,
    hasOpenAIKey,
  }
}

/**
 * Client-side feature flag check (safe to expose)
 * Returns only flags that are safe for browser
 */
export function getClientVisualFeatureFlags(): {
  enableVisualGeneration: boolean
  visualProvider: 'mock' | 'openai' | 'midjourney'
} {
  const flags = getVisualFeatureFlags()
  return {
    enableVisualGeneration: flags.enableVisualGeneration,
    visualProvider: flags.visualProvider,
  }
}

/**
 * Check if visual generation is enabled globally
 */
export function isVisualGenerationEnabled(): boolean {
  return getVisualFeatureFlags().enableVisualGeneration
}

/**
 * Get appropriate provider based on flags
 */
export function getVisualProvider(): 'mock' | 'openai' | 'midjourney' {
  const flags = getVisualFeatureFlags()

  // If real provider requested but key not available, fall back to mock
  if (flags.visualProvider !== 'mock' && !flags.hasOpenAIKey) {
    console.warn(
      `[Visual Flags] ${flags.visualProvider} requested but API key not found. Falling back to mock.`
    )
    return 'mock'
  }

  return flags.visualProvider
}

/**
 * Middleware to check if visual generation is available
 * Use in API routes to gate visual endpoints
 */
export function requireVisualGenerationEnabled(
  throwError = false
): boolean {
  const flags = getVisualFeatureFlags()

  if (!flags.enableVisualGeneration && throwError) {
    throw new Error(
      'Visual generation is not enabled. Set ENABLE_VISUAL_GENERATION=true'
    )
  }

  return flags.enableVisualGeneration
}

/**
 * Log feature flag state (useful for debugging)
 */
export function logVisualFeatureFlags(): void {
  const flags = getVisualFeatureFlags()
  console.log('[Visual Flags]', {
    enabled: flags.enableVisualGeneration,
    provider: flags.visualProvider,
    hasKey: flags.hasOpenAIKey,
    mode: flags.enableVisualGeneration ? 'ENABLED' : 'DISABLED',
  })
}
