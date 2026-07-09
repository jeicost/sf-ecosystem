import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'portal-six-kappa-22.vercel.app'],
    },
  },
};

export default nextConfig;
