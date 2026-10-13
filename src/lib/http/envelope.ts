import { z } from "zod";

const ALLOWED_STATUSES = [200, 400, 401, 403, 404, 409, 422, 429, 500, 503] as const;

const INVALID_API_LOG_RECORD = "Invalid API log record";

function hasAsciiControl(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 0x1f || code === 0x7f) {
      return true;
    }
  }
  return false;
}

const requestIdSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  .refine((value) => value.length === 36 && !hasAsciiControl(value));

const errorCodeSchema = z
  .string()
  .regex(/^[A-Z][A-Z0-9_]{0,63}$/)
  .refine((value) => value.length <= 64 && !hasAsciiControl(value));

const messageSchema = z
  .string()
  .min(1)
  .max(200)
  .refine((value) => !hasAsciiControl(value));

const statusSchema = z.number().refine((value): value is (typeof ALLOWED_STATUSES)[number] => {
  return (ALLOWED_STATUSES as readonly number[]).includes(value);
});

const successEnvelopeSchema = z
  .object({
    data: z.unknown().refine((value) => value !== null && value !== undefined),
    error: z.null(),
    requestId: requestIdSchema,
  })
  .strict();

const failureEnvelopeSchema = z
  .object({
    data: z.null(),
    error: z
      .object({
        code: errorCodeSchema,
        message: messageSchema,
      })
      .strict(),
    requestId: requestIdSchema,
  })
  .strict();

const apiSuccessOptionsSchema = z
  .object({
    status: statusSchema,
    requestId: requestIdSchema,
  })
  .strict();

const apiErrorInputSchema = z
  .object({
    code: errorCodeSchema,
    message: messageSchema,
    status: statusSchema,
    requestId: requestIdSchema,
  })
  .strict();

const apiLogSchema = z
  .object({
    request_id: requestIdSchema,
    route: z
      .string()
      .min(1)
      .max(200)
      .refine((value) => value.startsWith("/") && !/\s/.test(value) && !hasAsciiControl(value)),
    method: z.string().regex(/^[A-Z]{1,16}$/),
    status: statusSchema,
    duration_ms: z.number().finite().nonnegative(),
    actor_role: z.string().regex(/^[a-z_]{1,32}$/),
    error_code: errorCodeSchema.nullable(),
  })
  .strict();

export type ApiSuccessOptions = {
  status: number;
  requestId: string;
};

export type ApiErrorInput = {
  code: string;
  message: string;
  status: number;
  requestId: string;
};

export type ApiLogRecord = {
  request_id: string;
  route: string;
  method: string;
  status: number;
  duration_ms: number;
  actor_role: string;
  error_code: string | null;
};

function jsonResponse(body: unknown, status: number, requestId: string): Response {
  const payload = JSON.stringify(body);
  return new Response(payload, {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "x-request-id": requestId,
    },
  });
}

export function apiSuccess(data: unknown, options: ApiSuccessOptions): Response {
  const parsedOptions = apiSuccessOptionsSchema.parse(options);
  const envelope = successEnvelopeSchema.parse({
    data,
    error: null,
    requestId: parsedOptions.requestId,
  });
  return jsonResponse(envelope, parsedOptions.status, envelope.requestId);
}

export function apiError(input: ApiErrorInput): Response {
  const parsed = apiErrorInputSchema.parse(input);
  const envelope = failureEnvelopeSchema.parse({
    data: null,
    error: {
      code: parsed.code,
      message: parsed.message,
    },
    requestId: parsed.requestId,
  });
  return jsonResponse(envelope, parsed.status, envelope.requestId);
}

export function logApiRequest(record: ApiLogRecord): void {
  const parsed = apiLogSchema.safeParse(record);
  if (!parsed.success) {
    throw new Error(INVALID_API_LOG_RECORD);
  }

  console.info({
    request_id: parsed.data.request_id,
    route: parsed.data.route,
    method: parsed.data.method,
    status: parsed.data.status,
    duration_ms: parsed.data.duration_ms,
    actor_role: parsed.data.actor_role,
    error_code: parsed.data.error_code,
  });
}
