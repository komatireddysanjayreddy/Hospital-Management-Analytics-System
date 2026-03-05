import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel deployment optimizations
  experimental: {
    // Enable PPR (Partial Pre-rendering) for dashboard hybrid rendering
    ppr: "incremental",
  },

  // Neon serverless requires Node.js runtime (not Edge) for Prisma adapter
  serverExternalPackages: ["@prisma/client", "prisma"],

  // Strict mode for better React error detection
  reactStrictMode: true,

  // Image optimization — allow Vercel CDN domains
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.vercel.app" },
    ],
  },

  // Security headers for production
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
