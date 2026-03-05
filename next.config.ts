import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Neon serverless requires Node.js runtime (not Edge) for Prisma adapter
  serverExternalPackages: ["@prisma/client", "prisma"],

  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.vercel.app" },
    ],
  },

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
