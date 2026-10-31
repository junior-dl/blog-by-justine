import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "../lib/env";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

let cached: { db: Database; pool: pg.Pool } | undefined;

/**
 * One small pool per server instance. Use Neon's *pooled* connection string
 * (host contains `-pooler`) so many serverless instances share connections.
 */
export function getDb(): Database {
    if (!cached) {
        const pool = new pg.Pool({
            connectionString: env("DATABASE_URL"),
            max: 3,
            idleTimeoutMillis: 10_000,
        });
        cached = { pool, db: drizzle(pool, { schema }) };
    }
    return cached.db;
}

export async function closeDb() {
    await cached?.pool.end();
    cached = undefined;
}

export { schema };
