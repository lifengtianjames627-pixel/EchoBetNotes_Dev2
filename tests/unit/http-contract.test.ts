import { afterEach, expect, test, vi } from "vitest";
import { ZodError } from "zod";
import { apiError, apiSuccess, logApiRequest } from "../../src/lib/http/envelope";
import { readOrCreateRequestId } from "../../src/lib/http/request-id";

const requestId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const generatedId = "11111111-1111-4111-8111-111111111111";

afterEach(() => {
  vi.restoreAllMocks();
});

test("generates a request id when x-request-id is missing", () => {
  vi.spyOn(crypto, "randomUUID").mockReturnValue(generatedId);
  expect(readOrCreateRequestId(new Headers())).toBe(generatedId);
});

test("lowercases an accepted uuid request id", () => {
  const randomUUID = vi.spyOn(crypto, "randomUUID");
  const upper = "AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE";
  const headers = new Headers({ "X-Request-Id": upper });

  expect(readOrCreateRequestId(headers)).toBe(upper.toLowerCase());
  expect(randomUUID).not.toHaveBeenCalled();
});

test("replaces a rejected request id header", () => {
  vi.spyOn(crypto, "randomUUID").mockReturnValue(generatedId);

  expect(readOrCreateRequestId(new Headers({ "x-request-id": "not-a-uuid" }))).toBe(generatedId);
  expect(readOrCreateRequestId(new Headers({ "x-request-id": "" }))).toBe(generatedId);

  const multiline = {
    get(name: string) {
      if (name.toLowerCase() === "x-request-id") {
        return `${requestId}\nselect 1`;
      }
      return null;
    },
  } as Headers;

  expect(readOrCreateRequestId(multiline)).toBe(generatedId);
});

test("returns a success envelope", async () => {
  const response = apiSuccess(
    { status: "ok", database: "up" },
    { status: 200, requestId },
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("application/json");
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("x-request-id")).toBe(requestId);

  const body = await response.json();
  expect(body).toEqual({
    data: { status: "ok", database: "up" },
    error: null,
    requestId,
  });
  expect(body.data).not.toBeNull();
  expect(body.error).toBeNull();
});

test("returns an error envelope", async () => {
  const response = apiError({
    code: "DATABASE_UNAVAILABLE",
    message: "Database is unavailable.",
    status: 503,
    requestId,
  });

  expect(response.status).toBe(503);
  expect(response.headers.get("content-type")).toBe("application/json");
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("x-request-id")).toBe(requestId);

  const body = await response.json();
  expect(body).toEqual({
    data: null,
    error: {
      code: "DATABASE_UNAVAILABLE",
      message: "Database is unavailable.",
    },
    requestId,
  });
  expect(body.data).toBeNull();
  expect(body.error).not.toBeNull();
  expect(Object.keys(body.error)).toEqual(["code", "message"]);
});

test("rejects a bad error code before sending a body", () => {
  expect(() =>
    apiError({
      code: "database-down",
      message: "Database is unavailable.",
      status: 503,
      requestId,
    }),
  ).toThrow(ZodError);
});

test("rejects a multiline error message before sending a body", () => {
  expect(() =>
    apiError({
      code: "DATABASE_UNAVAILABLE",
      message: "Database is unavailable.\nselect 1",
      status: 503,
      requestId,
    }),
  ).toThrow(ZodError);
});

test("writes one structured log record", () => {
  const info = vi.spyOn(console, "info").mockImplementation(() => {});

  logApiRequest({
    request_id: requestId,
    route: "/api/health",
    method: "GET",
    status: 200,
    duration_ms: 5,
    actor_role: "anonymous",
    error_code: null,
  });

  expect(info).toHaveBeenCalledOnce();
  expect(info.mock.calls[0]).toHaveLength(1);
  expect(info.mock.calls[0]?.[0]).toEqual({
    request_id: requestId,
    route: "/api/health",
    method: "GET",
    status: 200,
    duration_ms: 5,
    actor_role: "anonymous",
    error_code: null,
  });
});

test("does not store an injected driver message in the log", () => {
  const driver = 'password authentication failed for user "postgres"';
  const info = vi.spyOn(console, "info").mockImplementation(() => {});
  const withDriverCode = {
    request_id: requestId,
    route: "/api/health",
    method: "GET",
    status: 503,
    duration_ms: 3,
    actor_role: "anonymous",
    error_code: driver,
  };
  const withDriverField = {
    request_id: requestId,
    route: "/api/health",
    method: "GET",
    status: 503,
    duration_ms: 3,
    actor_role: "anonymous",
    error_code: "DATABASE_UNAVAILABLE",
    message: driver,
  };

  for (const input of [withDriverCode, withDriverField]) {
    let caught: unknown;
    try {
      logApiRequest(input);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(Error);
    expect(caught).not.toBeInstanceOf(ZodError);
    expect((caught as Error).message).toBe("Invalid API log record");
    expect((caught as Error).message).not.toContain(driver);
    expect(String(caught)).not.toContain("password authentication");
  }

  expect(info).not.toHaveBeenCalled();
});
