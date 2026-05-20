import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Use ISR instead of static export to allow API routes + on-demand revalidation
  images: {
    unoptimized: true,
  },

  trailingSlash: false,

  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000, // 1 hour
    pagesBufferLength: 50,
  },
}

export default nextConfig
