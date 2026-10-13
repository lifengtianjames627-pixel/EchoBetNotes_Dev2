import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "../../../db/schema/index";
import { assertLocalDatabaseUrl } from "./env";

export type Database = PostgresJsDatabase<typeof schema>;

export type DbHandle = {
  db: Database;
  client: Sql;
};

export function createDb(databaseUrl: string, options?: { max?: number }): DbHandle {
  const url = assertLocalDatabaseUrl(databaseUrl);
  const client = postgres(url, { max: options?.max ?? 1 });
  const db = drizzle(client, { schema });
  return { db, client };
}
