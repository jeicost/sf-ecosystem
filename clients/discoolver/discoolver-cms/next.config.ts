import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.discoolver.com",
      },
    ],
  },
};

export default nextConfig;
