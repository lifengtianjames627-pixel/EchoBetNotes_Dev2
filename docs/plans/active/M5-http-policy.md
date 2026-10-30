# M5 — HTTP observability and policy isolation

Status: COMPLETE  
Updated: 2026-10-29

M5 adds scalable request tracing and automated cross-account policy checks on the
self-hosted Fastify stack, without changing successful API response shapes.

## Scope

- `server/http/requestId.js` and `server/http/log.js` for correlation IDs and structured API logs.
- Fastify hooks: propagate `x-request-id`, `Cache-Control: no-store`, error `requestId`, log `/api/*` and `/health`.
- Vitest split: unit tests (`vitest.config.js`) vs PGlite integration (`vitest.integration.config.js` + shared setup).
- Integration coverage: auth sessions, HTTP contract, PinnedPeer isolation, workflow-only entity writes.
- Client: surface `requestId` on `ApiClientError` for support/debug.

## Out of scope

- Wrapping every success payload in `{ data, error, requestId }` (breaking change deferred).
- Full entity audit, pagination, or Next.js migration.

## Verification

- `npm test` (unit + integration)
- `npm run lint`
- `npm run typecheck`
- `npm run build` and `npm run build:server`
