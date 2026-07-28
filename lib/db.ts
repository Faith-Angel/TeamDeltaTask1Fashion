/**
 * lib/db.ts
 *
 * Prisma client singleton for Next.js.
 *
 * Problem: Next.js hot-reload in development creates a new module instance
 * on every file save, which would instantiate a new PrismaClient each time
 * and quickly exhaust the database connection pool.
 *
 * Solution: Cache the client on the Node.js `global` object in development
 * so it survives hot-reloads. In production, a single module-level instance
 * is fine because there are no hot-reloads.
 *
 * Usage:
 *   import { db } from "@/lib/db";
 *   const users = await db.user.findMany();
 */

import { PrismaClient } from "@prisma/client";

// ── Types ──────────────────────────────────────────────────────────────────────

declare global {
  // Allow the global variable to be set without TypeScript errors.
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// ── Singleton factory ──────────────────────────────────────────────────────────

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });
}

// ── Export ─────────────────────────────────────────────────────────────────────

export const db: PrismaClient =
  globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = db;
}
