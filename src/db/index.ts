// =====================================================================
// VITALUXE - src/db/index.ts
// Client Drizzle (node-postgres) pour Next.js
// =====================================================================

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
