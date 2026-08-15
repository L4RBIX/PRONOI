/**
 * CLI entry point for local setup — the actual seeding logic lives in
 * src/server/pronoi/seedDatabase.ts, shared with resetVoiceDemoAction so
 * the in-app "Reset demo" control (including in production) can reseed
 * in-process without shelling out to this script.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedDatabase } from "../src/server/pronoi/seedDatabase";

config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

seedDatabase(prisma, (msg) => console.log(msg))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
