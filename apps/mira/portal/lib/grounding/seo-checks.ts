// lib/grounding/seo-checks.ts
// Deterministic SEO checks computed from a SiteSnapshot — no LLM involved.
// Each check carries measured evidence so downstream prompts/UI can cite facts.

import type { SiteSnapshot } from './site-snapshot'

export type SeoCheckStatus = 'pass' | 'warn' | 'fail' | 'unknown'

export interface SeoCheck {
  id: string
  label: string
  status: SeoCheckStatus
  evidence: string
}

export function computeSeoChecks(s: SiteSnapshot): SeoCheck[] {
  if (s.fetchError) {
    const evidence = `Site unreachable: ${s.fetchError}`
    return [
      { id: 'title', label: 'Title tag (30-60 chars)' },
      { id: 'meta-description', label: 'Meta description (120-160 chars)' },
      { id: 'canonical', label: 'Canonical tag' },
      { id: 'viewport', label: 'Viewport meta' },
      { id: 'h1', label: 'Exactly one H1' },
      { id: 'img-alt', label: 'Image alt coverage' },
      { id: 'schema', label: 'JSON-LD schema' },
      { id: 'https', label: 'HTTPS' },
      { id: 'robots', label: 'robots.txt' },
      { id: 'sitemap', label: 'sitemap.xml' },
      { id: 'lang', label: 'HTML lang attribute' },
      { id: 'analytics', label: 'GA4/GTM analytics' },
      { id: 'og-tags', label: 'Open Graph tags' },
    ].map((c) => ({ ...c, status: 'unknown' as const, evidence }))
  }

  const checks: SeoCheck[] = []

  // Title present and 30-60 chars
  checks.push({
    id: 'title',
    label: 'Title tag (30-60 chars)',
    status: !s.title ? 'fail' : s.titleLength >= 30 && s.titleLength <= 60 ? 'pass' : 'warn',
    evidence: s.title
      ? `"${s.title}" (${s.titleLength} chars)`
      : 'No <title> tag found',
  })

  // Meta description 120-160 chars
  checks.push({
    id: 'meta-description',
    label: 'Meta description (120-160 chars)',
    status: !s.metaDescription
      ? 'fail'
      : s.metaDescriptionLength >= 120 && s.metaDescriptionLength <= 160
        ? 'pass'
        : 'warn',
    evidence: s.metaDescription
      ? `${s.metaDescriptionLength} chars`
      : 'No meta description found',
  })

  // Canonical present
  checks.push({
    id: 'canonical',
    label: 'Canonical tag',
    status: s.canonical ? 'pass' : 'fail',
    evidence: s.canonical ?? 'No canonical link found',
  })

  // Viewport present
  checks.push({
    id: 'viewport',
    label: 'Viewport meta',
    status: s.viewport ? 'pass' : 'fail',
    evidence: s.viewport ?? 'No viewport meta found',
  })

  // Exactly 1 H1
  checks.push({
    id: 'h1',
    label: 'Exactly one H1',
    status: s.h1Count === 1 ? 'pass' : s.h1Count === 0 ? 'fail' : 'warn',
    evidence: `${s.h1Count} H1 tag(s) found`,
  })

  // Alt coverage: >=90% pass, >=50% warn, <50% fail
  const altEvidence = `${s.imgWithAlt}/${s.imgTotal} imágenes con alt`
  let altStatus: SeoCheckStatus
  if (s.imgTotal === 0) {
    altStatus = 'pass'
  } else {
    const ratio = s.imgWithAlt / s.imgTotal
    altStatus = ratio >= 0.9 ? 'pass' : ratio >= 0.5 ? 'warn' : 'fail'
  }
  checks.push({
    id: 'img-alt',
    label: 'Image alt coverage',
    status: altStatus,
    evidence: s.imgTotal === 0 ? 'No <img> tags found' : altEvidence,
  })

  // Schema JSON-LD present
  checks.push({
    id: 'schema',
    label: 'JSON-LD schema',
    status: s.schemaTypes.length > 0 ? 'pass' : 'fail',
    evidence: s.schemaTypes.length > 0 ? `Types: ${s.schemaTypes.join(', ')}` : 'No JSON-LD blocks found',
  })

  // HTTPS
  checks.push({
    id: 'https',
    label: 'HTTPS',
    status: s.https ? 'pass' : 'fail',
    evidence: s.finalUrl,
  })

  // robots.txt
  checks.push({
    id: 'robots',
    label: 'robots.txt',
    status: s.robotsTxtExists ? 'pass' : 'fail',
    evidence: s.robotsTxtExists ? '/robots.txt responds OK' : '/robots.txt not found',
  })

  // sitemap.xml
  checks.push({
    id: 'sitemap',
    label: 'sitemap.xml',
    status: s.sitemapExists ? 'pass' : 'fail',
    evidence: s.sitemapExists ? '/sitemap.xml responds OK' : '/sitemap.xml not found',
  })

  // lang defined
  checks.push({
    id: 'lang',
    label: 'HTML lang attribute',
    status: s.lang ? 'pass' : 'fail',
    evidence: s.lang ? `lang="${s.lang}"` : 'No lang attribute on <html>',
  })

  // GA4/GTM (warn if missing)
  checks.push({
    id: 'analytics',
    label: 'GA4/GTM analytics',
    status: s.analyticsDetected ? 'pass' : 'warn',
    evidence: s.analyticsDetected ? 'gtag/googletagmanager detected' : 'No GA4/GTM signature detected',
  })

  // OG tags
  const ogBoth = s.ogTitlePresent && s.ogImagePresent
  const ogNone = !s.ogTitlePresent && !s.ogImagePresent
  checks.push({
    id: 'og-tags',
    label: 'Open Graph tags',
    status: ogBoth ? 'pass' : ogNone ? 'fail' : 'warn',
    evidence: `og:title ${s.ogTitlePresent ? 'present' : 'missing'}, og:image ${s.ogImagePresent ? 'present' : 'missing'}`,
  })

  return checks
}

/**
 * Weighted score 0-100: pass=1, warn=0.5, fail=0.
 * Checks with status 'unknown' are excluded from the denominator.
 * Returns null if every check is unknown.
 */
export function deriveScore(checks: SeoCheck[]): number | null {
  const scored = checks.filter((c) => c.status !== 'unknown')
  if (scored.length === 0) return null
  const sum = scored.reduce(
    (acc, c) => acc + (c.status === 'pass' ? 1 : c.status === 'warn' ? 0.5 : 0),
    0
  )
  return Math.round((sum / scored.length) * 100)
}
