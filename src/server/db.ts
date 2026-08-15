import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Single shared Prisma Client instance for the whole server process. Next.js
 * dev mode hot-reloads modules on every edit, which would otherwise create a
 * new connection pool (and a new PrismaPg adapter) each time — the
 * globalThis cache survives module reloads and keeps one pool for the life
 * of the process, exactly as Prisma's own setup guide recommends.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
