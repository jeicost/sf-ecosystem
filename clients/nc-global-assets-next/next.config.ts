import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Export as static site for Vercel
  output: 'export',

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Clean URLs (no .html extensions)
  trailingSlash: false,

  // Revalidate ISR pages (if using ISR in future)
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000, // 1 hour
    pagesBufferLength: 50,
  },

  // SPA fallback for client-side routing (optional, if needed)
  rewrites: async () => {
    return {
      fallback: [
        {
          source: '/:path*',
          destination: '/',
        },
      ],
    }
  },
}

export default nextConfig
