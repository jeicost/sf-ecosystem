import type { NextConfig } from 'next'
import { readFileSync } from 'node:fs'

// Redirects baked from the CMS (content/redirects.json) — old slug → new slug
// so a renamed page/post 301s instead of 404ing. Empty until a slug changes.
function bakedRedirects() {
  try {
    const list = JSON.parse(readFileSync('./content/redirects.json', 'utf8')) as { from: string; to: string; code: number }[]
    return list.map((r) => ({ source: `/${r.from}`, destination: `/${r.to}`, permanent: r.code !== 302 }))
  } catch {
    return []
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    return bakedRedirects()
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },
}

export default nextConfig
