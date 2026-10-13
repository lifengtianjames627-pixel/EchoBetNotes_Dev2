import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { expect, test } from "vitest";
import { schemaHealth } from "../../db/schema/index";
import { createDb } from "../../src/lib/db/connection";
import { applyMigrations } from "../../src/lib/db/migrate";
import { assertLocalDatabaseUrl, readDatabaseUrl } from "../../src/lib/db/env";

const testDatabaseName = /^echobetnotes_test_[a-z0-9]+$/;

test("migrates a disposable database and reads schema_health back", async () => {
  expect(() =>
    assertLocalDatabaseUrl("postgresql://echobetnotes:echobetnotes@example.com:5432/echobetnotes"),
  ).toThrow(/refusing non-local database host/);

  const configuredUrl = process.env.DATABASE_URL;
  if (!configuredUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const configured = new URL(configuredUrl);
  if (configured.hostname !== "127.0.0.1" && configured.hostname !== "localhost") {
    throw new Error(`refusing non-local database host: ${configured.hostname || "empty"}`);
  }

  const adminUrl = readDatabaseUrl();
  const adminDatabase = decodeURIComponent(new URL(adminUrl).pathname.replace(/^\/+/, ""));
  if (adminDatabase !== "echobetnotes") {
    throw new Error("refusing to administer a database other than echobetnotes");
  }

  const runId = `${Date.now().toString(36)}${randomBytes(4).toString("hex")}`;
  const databaseName = `echobetnotes_test_${runId}`;
  if (!testDatabaseName.test(databaseName)) {
    throw new Error(`refusing unexpected test database name: ${databaseName}`);
  }

  const testUrl = new URL(adminUrl);
  testUrl.pathname = `/${databaseName}`;
  const validatedTestUrl = assertLocalDatabaseUrl(testUrl.toString());

  const admin = postgres(adminUrl, { max: 1 });
  let rowsBefore = 0;
  try {
    rowsBefore = await schemaHealthRowCount(admin);
    await admin.unsafe(`CREATE DATABASE ${databaseName}`);

    await applyMigrations(validatedTestUrl);

    const { db, client } = createDb(validatedTestUrl, { max: 1 });
    try {
      const current = await client<{ name: string }[]>`SELECT current_database() AS name`;
      expect(current[0]?.name).toBe(databaseName);

      await db.insert(schemaHealth).values({ note: runId });
      const rows = await db.select().from(schemaHealth).where(eq(schemaHealth.note, runId));
      expect(rows).toHaveLength(1);
      expect(rows[0]?.note).toBe(runId);
      expect(rows[0]?.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    } finally {
      await client.end();
    }

    expect(await schemaHealthRowCount(admin)).toBe(rowsBefore);
  } finally {
    let remaining: { datname: string }[] = [];
    let cleanupError: unknown;
    try {
      await admin.unsafe(`DROP DATABASE IF EXISTS ${databaseName} WITH (FORCE)`);
      remaining = await admin<{ datname: string }[]>`
        SELECT datname FROM pg_database WHERE datname = ${databaseName}
      `;
    } catch (error) {
      cleanupError = error;
    }
    try {
      await admin.end({ timeout: 5 });
    } catch (error) {
      cleanupError ??= error;
    }
    if (cleanupError) {
      throw cleanupError;
    }
    expect(remaining).toHaveLength(0);
  }
}, 30_000);

async function schemaHealthRowCount(admin: postgres.Sql): Promise<number> {
  const tables = await admin<{ table_name: string }[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'schema_health'
  `;
  if (tables.length === 0) {
    return 0;
  }
  const counts = await admin<{ count: number }[]>`
    SELECT count(*)::int AS count FROM schema_health
  `;
  return counts[0]?.count ?? 0;
}
