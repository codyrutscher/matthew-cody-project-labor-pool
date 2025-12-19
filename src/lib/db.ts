import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  
  console.log("[DB] Creating Prisma client...");
  console.log("[DB] DATABASE_URL exists:", !!connectionString);
  console.log("[DB] DATABASE_URL length:", connectionString?.length || 0);
  console.log("[DB] DATABASE_URL starts with:", connectionString?.substring(0, 30) || "N/A");
  
  if (!connectionString) {
    console.error("[DB] ERROR: DATABASE_URL is not set!");
    console.log("[DB] All env vars:", Object.keys(process.env).filter(k => k.includes("DATABASE") || k.includes("POSTGRES")));
    throw new Error("DATABASE_URL environment variable is not set");
  }
  
  console.log("[DB] Creating pg Pool...");
  const pool = new Pool({ 
    connectionString,
    max: 1,
    ssl: { rejectUnauthorized: false }
  });
  
  console.log("[DB] Creating PrismaPg adapter...");
  const adapter = new PrismaPg(pool);
  
  console.log("[DB] Creating PrismaClient...");
  return new PrismaClient({ adapter });
}

// Lazy initialization - only create client when first accessed
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    if (!globalForPrisma.prisma) {
      console.log("[DB] Proxy: First access, creating client...");
      globalForPrisma.prisma = createPrismaClient();
    }
    return Reflect.get(globalForPrisma.prisma, prop);
  },
});

export default prisma;
