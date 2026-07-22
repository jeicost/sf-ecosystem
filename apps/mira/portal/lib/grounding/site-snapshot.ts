// lib/grounding/site-snapshot.ts
// Fetches a live snapshot of a website and extracts verifiable, measured facts
// (title, meta tags, headings, schema, robots/sitemap, analytics, links, text)
// using targeted regexes — no external dependencies. Never throws: on failure
// it returns a snapshot with `fetchError` set and every other field null/0.

export interface SiteSnapshot {
  finalUrl: string
  fetchedAt: string // ISO timestamp
  fetchError: string | null
  https: boolean
  title: string | null
  titleLength: number
  metaDescription: string | null
  metaDescriptionLength: number
  canonical: string | null
  viewport: string | null
  lang: string | null
  ogTitlePresent: boolean
  ogImagePresent: boolean
  h1Count: number
  h2Texts: string[] // first 10
  imgTotal: number
  imgWithAlt: number // non-empty alt attribute
  schemaTypes: string[] // @type values found in JSON-LD blocks
  robotsTxtExists: boolean
  sitemapExists: boolean
  analyticsDetected: boolean // GA4 / GTM (gtag or googletagmanager)
  internalLinks: number
  externalLinks: number
  mainText: string // approximate visible body text, max 5000 chars
}

const MAX_BODY_BYTES = 2 * 1024 * 1024 // 2MB
const FETCH_TIMEOUT_MS = 10_000
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

function emptySnapshot(url: string, fetchError: string | null): SiteSnapshot {
  return {
    finalUrl: url,
    fetchedAt: new Date().toISOString(),
    fetchError,
    https: url.toLowerCase().startsWith('https://'),
    title: null,
    titleLength: 0,
    metaDescription: null,
    metaDescriptionLength: 0,
    canonical: null,
    viewport: null,
    lang: null,
    ogTitlePresent: false,
    ogImagePresent: false,
    h1Count: 0,
    h2Texts: [],
    imgTotal: 0,
    imgWithAlt: 0,
    schemaTypes: [],
    robotsTxtExists: false,
    sitemapExists: false,
    analyticsDetected: false,
    internalLinks: 0,
    externalLinks: 0,
    mainText: '',
  }
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

/** Reads a response body up to MAX_BODY_BYTES, truncating beyond the limit. */
async function readBodyLimited(res: Response): Promise<string> {
  const contentLength = res.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    // Oversized declared body: still read, but truncated by the reader below.
  }
  const reader = res.body?.getReader()
  if (!reader) {
    const text = await res.text()
    return text.length > MAX_BODY_BYTES ? text.slice(0, MAX_BODY_BYTES) : text
  }
  const decoder = new TextDecoder('utf-8', { fatal: false })
  let received = 0
  let html = ''
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    received += value.byteLength
    html += decoder.decode(value, { stream: true })
    if (received >= MAX_BODY_BYTES) {
      try { await reader.cancel() } catch { /* ignore */ }
      break
    }
  }
  html += decoder.decode()
  return html
}

/** Checks that origin+path responds with a 2xx/3xx status (existence only). */
async function urlExists(origin: string, path: string): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(origin + path, 5000)
    return res.status >= 200 && res.status < 400
  } catch {
    return false
  }
}

// ---------- regex extraction helpers ----------

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/gi, "'")
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
}

/**
 * Finds a tag (meta/link) whose attributes include keyAttr="keyValue" and
 * returns the value of valueAttr — attribute order independent.
 */
function getTagAttr(
  html: string,
  tagName: string,
  keyAttr: string,
  keyValue: string,
  valueAttr: string
): string | null {
  const tagRe = new RegExp(`<${tagName}\\b[^>]*>`, 'gi')
  const keyRe = new RegExp(`${keyAttr}\\s*=\\s*["']${keyValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i')
  const valueRe = new RegExp(`${valueAttr}\\s*=\\s*["']([^"']*)["']`, 'i')
  let m: RegExpExecArray | null
  while ((m = tagRe.exec(html)) !== null) {
    const tag = m[0]
    if (keyRe.test(tag)) {
      const v = valueRe.exec(tag)
      if (v) return decodeEntities(v[1]).trim()
    }
  }
  return null
}

/** Recursively collects @type values from a parsed JSON-LD value (arrays / @graph tolerated). */
function collectSchemaTypes(node: unknown, out: Set<string>): void {
  if (node == null) return
  if (Array.isArray(node)) {
    for (const item of node) collectSchemaTypes(item, out)
    return
  }
  if (typeof node === 'object') {
    const obj = node as Record<string, unknown>
    const type = obj['@type']
    if (typeof type === 'string') out.add(type)
    else if (Array.isArray(type)) {
      for (const t of type) if (typeof t === 'string') out.add(t)
    }
    if (obj['@graph']) collectSchemaTypes(obj['@graph'], out)
  }
}

function extractSchemaTypes(html: string): string[] {
  const types = new Set<string>()
  const re = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    try {
      collectSchemaTypes(JSON.parse(m[1].trim()), types)
    } catch {
      // malformed JSON-LD block — ignore
    }
  }
  return Array.from(types)
}

function countLinks(html: string, finalUrl: string): { internal: number; external: number } {
  let internal = 0
  let external = 0
  let host: string | null = null
  try {
    host = new URL(finalUrl).host
  } catch {
    host = null
  }
  const re = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const href = m[1].trim()
    if (!href || href.startsWith('#') || /^(mailto:|tel:|javascript:|data:)/i.test(href)) continue
    if (/^https?:\/\//i.test(href)) {
      try {
        if (host && new URL(href).host === host) internal++
        else external++
      } catch {
        external++
      }
    } else {
      internal++ // relative link
    }
  }
  return { internal, external }
}

function extractMainText(html: string): string {
  const bodyMatch = /<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(html)
  let body = bodyMatch ? bodyMatch[1] : html
  body = body
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<template\b[\s\S]*?<\/template>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
  return stripTags(body).slice(0, 5000)
}

// ---------- main entry ----------

export async function fetchSiteSnapshot(url: string): Promise<SiteSnapshot> {
  let normalizedUrl = url.trim()
  if (!/^https?:\/\//i.test(normalizedUrl)) normalizedUrl = 'https://' + normalizedUrl

  let res: Response
  let html: string
  try {
    res = await fetchWithTimeout(normalizedUrl, FETCH_TIMEOUT_MS)
    if (!res.ok) {
      return emptySnapshot(normalizedUrl, `HTTP ${res.status} ${res.statusText}`.trim())
    }
    html = await readBodyLimited(res)
  } catch (err) {
    const message =
      err instanceof Error
        ? err.name === 'AbortError'
          ? `Timeout after ${FETCH_TIMEOUT_MS / 1000}s`
          : err.message
        : String(err)
    return emptySnapshot(normalizedUrl, message)
  }

  const finalUrl = res.url || normalizedUrl
  let origin: string
  try {
    origin = new URL(finalUrl).origin
  } catch {
    origin = finalUrl
  }

  const [robotsTxtExists, sitemapExists] = await Promise.all([
    urlExists(origin, '/robots.txt'),
    urlExists(origin, '/sitemap.xml'),
  ])

  const titleMatch = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)
  const title = titleMatch ? stripTags(titleMatch[1]) : null

  const metaDescription = getTagAttr(html, 'meta', 'name', 'description', 'content')
  const canonical = getTagAttr(html, 'link', 'rel', 'canonical', 'href')
  const viewport = getTagAttr(html, 'meta', 'name', 'viewport', 'content')
  const ogTitlePresent = getTagAttr(html, 'meta', 'property', 'og:title', 'content') !== null
  const ogImagePresent = getTagAttr(html, 'meta', 'property', 'og:image', 'content') !== null

  const langMatch = /<html\b[^>]*\blang\s*=\s*["']([^"']+)["']/i.exec(html)
  const lang = langMatch ? langMatch[1].trim() : null

  const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length

  const h2Texts: string[] = []
  const h2Re = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi
  let h2m: RegExpExecArray | null
  while ((h2m = h2Re.exec(html)) !== null && h2Texts.length < 10) {
    const text = stripTags(h2m[1])
    if (text) h2Texts.push(text)
  }

  const imgTags = html.match(/<img\b[^>]*>/gi) ?? []
  const imgTotal = imgTags.length
  const imgWithAlt = imgTags.filter((tag) => {
    const alt = /\balt\s*=\s*["']([^"']*)["']/i.exec(tag)
    return alt !== null && alt[1].trim().length > 0
  }).length

  const schemaTypes = extractSchemaTypes(html)
  const analyticsDetected = /gtag\(|googletagmanager\.com|www\.google-analytics\.com/i.test(html)
  const { internal: internalLinks, external: externalLinks } = countLinks(html, finalUrl)
  const mainText = extractMainText(html)

  return {
    finalUrl,
    fetchedAt: new Date().toISOString(),
    fetchError: null,
    https: finalUrl.toLowerCase().startsWith('https://'),
    title,
    titleLength: title?.length ?? 0,
    metaDescription,
    metaDescriptionLength: metaDescription?.length ?? 0,
    canonical,
    viewport,
    lang,
    ogTitlePresent,
    ogImagePresent,
    h1Count,
    h2Texts,
    imgTotal,
    imgWithAlt,
    schemaTypes,
    robotsTxtExists,
    sitemapExists,
    analyticsDetected,
    internalLinks,
    externalLinks,
    mainText,
  }
}

/** Formats a snapshot as a readable prompt block of verified, measured facts. */
export function formatSnapshotForPrompt(s: SiteSnapshot): string {
  if (s.fetchError) {
    return `SITE UNREACHABLE: ${s.fetchError} (${s.finalUrl})`
  }
  const yesNo = (v: boolean) => (v ? 'yes' : 'no')
  const lines = [
    `VERIFIED SITE FACTS (medidos el ${s.fetchedAt})`,
    `- Final URL: ${s.finalUrl} (HTTPS: ${yesNo(s.https)})`,
    `- Title: ${s.title ? `"${s.title}" (${s.titleLength} chars)` : 'MISSING'}`,
    `- Meta description: ${s.metaDescription ? `"${s.metaDescription}" (${s.metaDescriptionLength} chars)` : 'MISSING'}`,
    `- Canonical: ${s.canonical ?? 'MISSING'}`,
    `- Viewport meta: ${s.viewport ? `present ("${s.viewport}")` : 'MISSING'}`,
    `- <html lang>: ${s.lang ?? 'MISSING'}`,
    `- og:title present: ${yesNo(s.ogTitlePresent)} | og:image present: ${yesNo(s.ogImagePresent)}`,
    `- H1 count: ${s.h1Count}`,
    `- H2 headings (first ${s.h2Texts.length}): ${s.h2Texts.length ? s.h2Texts.map((t) => `"${t}"`).join(' | ') : 'none found'}`,
    `- Images: ${s.imgTotal} total, ${s.imgWithAlt} with non-empty alt`,
    `- JSON-LD schema types: ${s.schemaTypes.length ? s.schemaTypes.join(', ') : 'none found'}`,
    `- robots.txt exists: ${yesNo(s.robotsTxtExists)} | sitemap.xml exists: ${yesNo(s.sitemapExists)}`,
    `- GA4/GTM detected: ${yesNo(s.analyticsDetected)}`,
    `- Links: ${s.internalLinks} internal, ${s.externalLinks} external`,
    `- Visible text sample (max 5000 chars):`,
    s.mainText || '(no visible text extracted)',
  ]
  return lines.join('\n')
}
