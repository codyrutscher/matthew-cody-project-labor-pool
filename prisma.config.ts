import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Supabase: Use direct connection for migrations, pooled for runtime
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"]!,
  },
});
