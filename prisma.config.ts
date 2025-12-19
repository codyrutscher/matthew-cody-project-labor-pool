import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Supabase: Use pooled connection (port 6543) for queries
    url: process.env["DATABASE_URL"]!,
    // Supabase: Use direct connection (port 5432) for migrations
    directUrl: process.env["DIRECT_URL"],
  },
});
