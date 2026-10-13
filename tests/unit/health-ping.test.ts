import { beforeEach, expect, test, vi } from "vitest";

const harness = vi.hoisted(() => {
  const queries: string[] = [];
  let rows: unknown = [{ ok: 1 }];
  const end = vi.fn(async () => undefined);
  const client = Object.assign(
    (strings: TemplateStringsArray) => {
      queries.push(strings.join(""));
      return Promise.resolve(rows);
    },
    { end },
  );

  return {
    queries,
    end,
    client,
    setRows(next: unknown) {
      rows = next;
    },
    reset() {
      queries.length = 0;
      rows = [{ ok: 1 }];
      end.mockClear();
    },
  };
});

vi.mock("server-only", () => ({}));

vi.mock("../../src/lib/db/client", () => ({
  client: harness.client,
}));

import { pingProcessDatabase } from "../../src/lib/db/ping";

beforeEach(() => {
  harness.reset();
});

test("runs select 1 through the process client", async () => {
  await expect(pingProcessDatabase()).resolves.toBeUndefined();

  expect(harness.queries).toEqual(["select 1 as ok"]);
  expect(harness.queries[0]).toContain("select 1");
  expect(harness.end).not.toHaveBeenCalled();
});

test("rejects a non-1 result without driver text", async () => {
  const driverText = 'password authentication failed for user "postgres" select secret_from_pg_stat_activity';
  harness.setRows([{ ok: driverText }]);

  let caught: unknown;
  try {
    await pingProcessDatabase();
  } catch (error) {
    caught = error;
  }

  expect(caught).toBeInstanceOf(Error);
  expect((caught as Error).message).toBe("database ping failed");
  expect((caught as Error).message).not.toContain(driverText);
  expect((caught as Error).message).not.toContain("password authentication");
  expect((caught as Error).stack ?? "").not.toContain(driverText);
  expect((caught as Error).stack ?? "").not.toContain("secret_from_pg_stat_activity");
  expect(String(caught)).not.toContain("password authentication");
  expect(harness.queries).toEqual(["select 1 as ok"]);
  expect(harness.end).not.toHaveBeenCalled();
});
