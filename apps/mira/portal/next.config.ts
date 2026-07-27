import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // pdf-parse v2 no sobrevive al bundling de webpack (TypeError:
  // Object.defineProperty called on non-object al importarlo) — debe
  // cargarse como dependencia externa en runtime.
  serverExternalPackages: ['pdf-parse'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  async redirects() {
    return [
      // Rutas legacy de departamentos — consolidadas
      { source: '/estrategia', destination: '/strategy', permanent: true },
      { source: '/estrategia/:path*', destination: '/strategy/:path*', permanent: true },
      { source: '/innovacion', destination: '/strategy', permanent: true },
      { source: '/innovacion/:path*', destination: '/strategy/:path*', permanent: true },
      { source: '/marketing', destination: '/roster', permanent: true },
    ]
  },
}

export default nextConfig
