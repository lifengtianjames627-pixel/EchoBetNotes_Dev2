import { pingProcessDatabase } from "../../../src/lib/db/ping";
import { apiError, apiSuccess, logApiRequest } from "../../../src/lib/http/envelope";
import { readOrCreateRequestId } from "../../../src/lib/http/request-id";

const HEALTH_ROUTE = "/api/health";
const DATABASE_UNAVAILABLE = "DATABASE_UNAVAILABLE";
const DATABASE_UNAVAILABLE_MESSAGE = "Database is unavailable.";

export async function GET(request: Request): Promise<Response> {
  const requestId = readOrCreateRequestId(request.headers);
  const startedAt = performance.now();

  let response: Response;
  let errorCode: string | null;

  try {
    await pingProcessDatabase();
    errorCode = null;
    response = apiSuccess({ status: "ok", database: "up" }, { status: 200, requestId });
  } catch {
    errorCode = DATABASE_UNAVAILABLE;
    response = apiError({
      code: DATABASE_UNAVAILABLE,
      message: DATABASE_UNAVAILABLE_MESSAGE,
      status: 503,
      requestId,
    });
  }

  const elapsed = performance.now() - startedAt;
  const durationMs = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;

  try {
    logApiRequest({
      request_id: requestId,
      route: HEALTH_ROUTE,
      method: "GET",
      status: response.status,
      duration_ms: durationMs,
      actor_role: "anonymous",
      error_code: errorCode,
    });
  } catch {
    // A logging failure must not replace the health response.
  }

  return response;
}
