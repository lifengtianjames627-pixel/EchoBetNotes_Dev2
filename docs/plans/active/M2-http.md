# M2-http

Status: COMPLETE
Plan Agent: bc-581a4000-6f60-538a-9dd7-47a15637854b
Updated: 2026-10-13

M2 adds the shared JSON envelope and one host-ready route, `GET /api/health`.
It does not migrate product pages, add Auth.js, or add product tables.

## Decisions

- The health probe is public. `actor_role` is `anonymous`.
- A database failure on this probe is HTTP 503 with code `DATABASE_UNAVAILABLE`.
  Success data is exactly `{ status: "ok", database: "up" }`.
- The correlation header is `x-request-id`. The JSON field is `requestId`.
- `src/lib/db/env.ts` keeps the localhost database-name guard. `src/lib/db/client.ts` stays unchanged.
- Neither task edits `package.json`, the Vite tree, `base44/`, or `.env`.
- Charter gates 6, 7, 9, and 10 are NOT RUN (no product UI, no critical browser flow, no protected resource, no product hot path).

## Tasks

| ID | State | Depends on | Owner |
| --- | --- | --- | --- |
| M2-T1 | passed | none | Dev bc-76075c2d; Check bc-f7714663 PASS |
| M2-T2 | passed | M2-T1 | Dev bc-cf6832dc; Check bc-23649768 PASS |

## M2-T1 contract

Pure HTTP helpers in `src/lib/http/request-id.ts` and `src/lib/http/envelope.ts`, with `tests/unit/http-contract.test.ts`.
Helpers return Web Responses. They do not import `server-only`, `src/lib/db`, `next/server`, or `@base44/sdk`.

- `readOrCreateRequestId(headers)` returns an incoming `x-request-id` lowercased when it is a UUID, otherwise `crypto.randomUUID()`.
- `apiSuccess` and `apiError` return `{ data, error, requestId }` with exactly one of `data` or `error` null.
- Statuses: 200, 400, 401, 403, 404, 409, 422, 429, 500, 503.
- Headers: `Content-Type: application/json`, `Cache-Control: no-store`, `x-request-id`.
- Zod validates the envelope before send. `code` matches `^[A-Z][A-Z0-9_]{0,63}$`. `message` is 1–200 characters with no ASCII controls.
- `logApiRequest` writes only `request_id`, `route`, `method`, `status`, `duration_ms`, `actor_role`, and `error_code`.
- `tsconfig.json` include adds `src/lib/http/**/*.ts`. ESLint TypeScript files add `src/lib/http/**/*.ts` beside `app/**/*.{ts,tsx}`.

Verification: `npm test -- tests/unit/http-contract.test.ts`, `npm run typecheck`, `npm run lint`.

## M2-T2 contract

`GET /api/health` translates HTTP only. `src/lib/db/select-one.ts` runs `select 1`. `src/lib/db/ping.ts` uses the process pool and imports `server-only`. Database failure returns HTTP 503 with message `Database is unavailable.` The caught error is not read or logged.

Owned files: `src/lib/db/select-one.ts`, `src/lib/db/ping.ts`, `app/api/health/route.ts`, `tests/unit/health-route.test.ts`, `tests/unit/health-ping.test.ts`, `tests/integration/health-select-one.test.ts`.

Verification: unit tests, disposable-database integration test, typecheck, lint, then `next start` plus curl of `/api/health`.
