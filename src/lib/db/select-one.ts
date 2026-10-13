import type { Sql } from "postgres";

const DATABASE_PING_FAILED = "database ping failed";

function isSingleOk(rows: unknown): boolean {
  if (!Array.isArray(rows) || rows.length !== 1) {
    return false;
  }

  const row: unknown = rows[0];
  if (typeof row !== "object" || row === null || !("ok" in row)) {
    return false;
  }

  return row.ok === 1;
}

export async function assertDatabaseAcceptsSelectOne(sql: Sql): Promise<void> {
  const rows = await sql`select 1 as ok`;
  if (!isSingleOk(rows)) {
    throw new Error(DATABASE_PING_FAILED);
  }
}
