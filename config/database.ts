import { Kysely, PostgresDialect } from "kysely";
import type { DB } from "../helpers/schema";

// Database configuration for multi-tenant commerce platform
const dialect = new PostgresDialect({
  async pool() {
    const { Pool } = await import("pg");
    return new Pool({
      connectionString: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/nova_commerce",
    });
  },
});

export const db = new Kysely<DB>({
  dialect,
});
