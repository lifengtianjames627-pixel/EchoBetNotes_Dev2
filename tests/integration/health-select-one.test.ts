import { randomBytes } from "node:crypto";
import postgres from "postgres";
import { expect, test } from "vitest";
import { assertDatabaseAcceptsSelectOne } from "../../src/lib/db/select-one";
import { createDb } from "../../src/lib/db/connection";
import { assertLocalDatabaseUrl, readDatabaseUrl } from "../../src/lib/db/env";

const testDatabaseName = /^echobetnotes_test_[a-z0-9]+$/;

test("select 1 succeeds on a disposable database that is then dropped", async () => {
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
  let probe: postgres.Sql | undefined;
  try {
    await admin.unsafe(`CREATE DATABASE ${databaseName}`);

    const { client } = createDb(validatedTestUrl, { max: 1 });
    probe = client;
    try {
      const current = await client<{ name: string }[]>`SELECT current_database() AS name`;
      expect(current[0]?.name).toBe(databaseName);
      await assertDatabaseAcceptsSelectOne(client);
    } finally {
      await client.end();
      probe = undefined;
    }
  } finally {
    let remaining: { datname: string }[] = [];
    let cleanupError: unknown;
    try {
      if (probe) {
        await probe.end({ timeout: 5 });
      }
    } catch (error) {
      cleanupError = error;
    }
    try {
      await admin.unsafe(`DROP DATABASE IF EXISTS ${databaseName} WITH (FORCE)`);
      remaining = await admin<{ datname: string }[]>`
        SELECT datname FROM pg_database WHERE datname = ${databaseName}
      `;
    } catch (error) {
      cleanupError ??= error;
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
