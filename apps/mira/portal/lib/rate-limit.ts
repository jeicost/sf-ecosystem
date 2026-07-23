/**
 * Best-effort in-memory rate limiter for MIRA's expensive AI-calling routes
 * (Claude/OpenAI/Tavily/Apollo), applied in proxy.ts.
 *
 * Same pattern and same known limitation as apps/sf-cms/lib/rate-limit.ts:
 * Vercel serverless/edge instances don't share process state, so under real
 * concurrent load across many cold-started instances this resets more often
 * than a real distributed limiter would. Still strictly better than the zero
 * rate limiting that existed before, and the threshold is generous enough
 * that no real client's normal usage should ever come close to it. If real
 * traffic grows past what this catches, replace with Upstash Redis.
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

const WINDOW_MS = 60_000 // 1 minute
const MAX_REQUESTS = 30 // per key per window -- generous for a human-driven workflow

/** Returns true if the request should be allowed, false if rate-limited. */
export function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (bucket.count >= MAX_REQUESTS) {
    return false
  }

  bucket.count++
  return true
}
