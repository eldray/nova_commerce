import { Kysely, PostgresDialect, sql } from "kysely";
import type { DB } from "./schema";

// Initializes the Kysely database client. In runtime or dev mode, connection parameters are supplied via environment variables.
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

export { sql };
