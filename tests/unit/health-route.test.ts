import { afterEach, expect, test, vi } from "vitest";

const { pingProcessDatabase } = vi.hoisted(() => ({
  pingProcessDatabase: vi.fn(async () => undefined),
}));

vi.mock("../../src/lib/db/ping", () => ({
  pingProcessDatabase,
}));

import { GET } from "../../app/api/health/route";

const validRequestId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const generatedRequestId = "11111111-1111-4111-8111-111111111111";
const sentinelSql = "select secret_from_pg_stat_activity";

afterEach(() => {
  vi.restoreAllMocks();
  pingProcessDatabase.mockReset();
  pingProcessDatabase.mockResolvedValue(undefined);
});

function healthRequest(headers?: HeadersInit): Request {
  return new Request("http://127.0.0.1/api/health", { headers });
}

function statusLine(response: Response): string {
  return `HTTP/1.1 ${response.status} ${response.statusText}`;
}

test("returns the success envelope when the process database accepts the probe", async () => {
  const info = vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(crypto, "randomUUID").mockReturnValue(generatedRequestId);

  const response = await GET(healthRequest());
  const body = await response.json();

  expect(pingProcessDatabase).toHaveBeenCalledOnce();
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("application/json");
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("x-request-id")).toBe(generatedRequestId);
  expect(body).toEqual({
    data: { status: "ok", database: "up" },
    error: null,
    requestId: generatedRequestId,
  });

  expect(info).toHaveBeenCalledOnce();
  const record = info.mock.calls[0]?.[0];
  expect(record).toMatchObject({
    request_id: generatedRequestId,
    route: "/api/health",
    method: "GET",
    status: 200,
    actor_role: "anonymous",
    error_code: null,
  });
  expect(record.duration_ms).toEqual(expect.any(Number));
  expect(Number.isFinite(record.duration_ms)).toBe(true);
  expect(record.duration_ms).toBeGreaterThanOrEqual(0);
});

test("returns 503 without the driver error when the probe throws", async () => {
  const failure = new Error(`driver failed: ${sentinelSql}`);
  failure.stack = `Error: driver failed: ${sentinelSql}\n    at ${sentinelSql}`;
  pingProcessDatabase.mockRejectedValue(failure);

  const info = vi.spyOn(console, "info").mockImplementation(() => {});
  const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(crypto, "randomUUID").mockReturnValue(generatedRequestId);

  const response = await GET(healthRequest());
  const text = await response.text();
  const line = statusLine(response);

  expect(response.status).toBe(503);
  expect(line).not.toContain(sentinelSql);
  expect(text).not.toContain(sentinelSql);
  expect(JSON.parse(text)).toEqual({
    data: null,
    error: {
      code: "DATABASE_UNAVAILABLE",
      message: "Database is unavailable.",
    },
    requestId: generatedRequestId,
  });
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("x-request-id")).toBe(generatedRequestId);

  expect(info).toHaveBeenCalledOnce();
  const record = info.mock.calls[0]?.[0];
  expect(record).toMatchObject({
    request_id: generatedRequestId,
    route: "/api/health",
    method: "GET",
    status: 503,
    actor_role: "anonymous",
    error_code: "DATABASE_UNAVAILABLE",
  });
  expect(JSON.stringify(record)).not.toContain(sentinelSql);
  expect(errorLog).not.toHaveBeenCalled();
  expect(line).toContain("503");
  expect(line.startsWith("HTTP/1.1 503")).toBe(true);
});

test("echoes a valid x-request-id on success and failure", async () => {
  const randomUUID = vi.spyOn(crypto, "randomUUID");
  vi.spyOn(console, "info").mockImplementation(() => {});

  pingProcessDatabase.mockResolvedValueOnce(undefined);
  const success = await GET(healthRequest({ "x-request-id": validRequestId }));
  expect(success.status).toBe(200);
  expect(success.headers.get("cache-control")).toBe("no-store");
  expect(success.headers.get("x-request-id")).toBe(validRequestId);
  expect(await success.json()).toEqual({
    data: { status: "ok", database: "up" },
    error: null,
    requestId: validRequestId,
  });

  const failureError = new Error(`driver failed: ${sentinelSql}`);
  failureError.stack = sentinelSql;
  pingProcessDatabase.mockRejectedValueOnce(failureError);
  const failure = await GET(healthRequest({ "x-request-id": validRequestId }));
  const failureText = await failure.text();
  expect(failure.status).toBe(503);
  expect(failure.headers.get("cache-control")).toBe("no-store");
  expect(failure.headers.get("x-request-id")).toBe(validRequestId);
  expect(failureText).not.toContain(sentinelSql);
  expect(JSON.parse(failureText)).toEqual({
    data: null,
    error: {
      code: "DATABASE_UNAVAILABLE",
      message: "Database is unavailable.",
    },
    requestId: validRequestId,
  });
  expect(statusLine(failure)).not.toContain(sentinelSql);
  expect(randomUUID).not.toHaveBeenCalled();
});

test("replaces an invalid x-request-id on success and failure", async () => {
  vi.spyOn(crypto, "randomUUID").mockReturnValue(generatedRequestId);
  vi.spyOn(console, "info").mockImplementation(() => {});

  pingProcessDatabase.mockResolvedValueOnce(undefined);
  const success = await GET(healthRequest({ "x-request-id": "bad" }));
  expect(success.status).toBe(200);
  expect(success.headers.get("cache-control")).toBe("no-store");
  expect(success.headers.get("x-request-id")).toBe(generatedRequestId);
  expect(await success.json()).toMatchObject({
    error: null,
    requestId: generatedRequestId,
  });

  pingProcessDatabase.mockRejectedValueOnce(new Error(sentinelSql));
  const failure = await GET(healthRequest({ "x-request-id": "bad" }));
  const failureText = await failure.text();
  expect(failure.status).toBe(503);
  expect(failure.headers.get("cache-control")).toBe("no-store");
  expect(failure.headers.get("x-request-id")).toBe(generatedRequestId);
  expect(failure.headers.get("x-request-id")).not.toBe("bad");
  expect(failureText).not.toContain("bad");
  expect(failureText).not.toContain(sentinelSql);
  expect(JSON.parse(failureText).requestId).toBe(generatedRequestId);
});

test("keeps the health response when request logging throws", async () => {
  vi.spyOn(console, "info").mockImplementation(() => {
    throw new Error("log sink failed");
  });
  vi.spyOn(crypto, "randomUUID").mockReturnValue(generatedRequestId);

  const response = await GET(healthRequest());
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    data: { status: "ok", database: "up" },
    error: null,
    requestId: generatedRequestId,
  });
});
