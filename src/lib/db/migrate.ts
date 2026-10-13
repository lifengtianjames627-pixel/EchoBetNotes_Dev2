import { realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDb } from "./connection";
import { readDatabaseUrl } from "./env";

const migrationsFolder = resolve(dirname(fileURLToPath(import.meta.url)), "../../../db/migrations");

export async function applyMigrations(databaseUrl: string): Promise<void> {
  const { db, client } = createDb(databaseUrl, { max: 1 });
  try {
    await migrate(db, { migrationsFolder });
  } finally {
    await client.end();
  }
}

function isCliEntry(): boolean {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  try {
    return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isCliEntry()) {
  await applyMigrations(readDatabaseUrl());
}
