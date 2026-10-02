// =====================================================================
// VITALUXE - drizzle.config.ts (racine du projet Next.js)
// =====================================================================

import { defineConfig } from "drizzle-kit";
import { config } from 'dotenv';
config({ path: '.env' });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
