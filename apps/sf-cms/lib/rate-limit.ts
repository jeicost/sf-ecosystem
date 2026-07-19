/**
 * Best-effort in-memory rate limiter for the public API.
 *
 * KNOWN LIMITATION: Vercel serverless functions don't guarantee a shared,
 * persistent process across invocations — under real concurrent load this
 * resets more often than a real distributed limiter would (each cold-started
 * instance starts a fresh counter). This still stops a naive single-source
 * hammering script hitting a warm instance, which is strictly better than
 * the zero rate limiting that existed before. If traffic grows enough that
 * this stops being sufficient, replace with Upstash Redis (needs an account
 * + REDIS env vars — deliberately not added today to avoid a new external
 * dependency for a fix scoped as "cheap, no new signup required").
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

const WINDOW_MS = 60_000 // 1 minute
const MAX_REQUESTS = 60 // per key per window

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
