# M6 — Entity policy matrix and API error contract

Status: COMPLETE  
Updated: 2026-10-30

M6 extends the M5 integration harness with a broader **policy matrix** and fixes
API error serialization so policy failures return a stable `{ error, message, requestId }` body.

## Scope

- Shared integration helpers (`registerMember`, `bearer`, `invokeFunction`) with unique emails per run.
- Integration tests: Subscription, FriendRequest workflow, Review moderation, ReviewVote workflow, PinnedPeer (existing).
- Unit tests: subscription/forged ownership binding, workflow-only entities, `sendApiError`.
- `server/http/sendError.js` + `withApiErrors` on entity and function routes (Fastify no longer emits `error: "Forbidden"` for `HttpError`).
- Serial integration test runs (`fileParallelism: false`) to avoid PGlite cross-file races.

## Out of scope

- User-ID URL migration and full entity audit (Charter §8.1 remainder).
- Success-response envelope wrapper.

## Verification

- `npm test` — 25 tests (17 unit + 8 integration)
- `npm run lint`, `npm run typecheck`, `npm run build`, `npm run build:server`
