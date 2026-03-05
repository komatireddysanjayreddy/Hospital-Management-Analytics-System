/**
 * Database connection using @neondatabase/serverless
 * Optimized for Vercel Edge/Serverless with connection pooling via Neon HTTP driver.
 * Falls back to standard Prisma client for local development.
 */

import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

// Enable WebSocket for Neon serverless in Node.js environments
if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

// ─── Singleton pattern for Prisma client ─────────────────
// Prevents exhausting DB connections in Next.js hot-reload dev mode

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }

  // Use Neon adapter in production/serverless for HTTP-based connection pooling
  if (process.env.NODE_ENV === "production" || process.env.USE_NEON_ADAPTER === "true") {
    const pool = new Pool({ connectionString });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
  }

  // Standard client for local development (uses DATABASE_URL directly)
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });
}

export const db: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
