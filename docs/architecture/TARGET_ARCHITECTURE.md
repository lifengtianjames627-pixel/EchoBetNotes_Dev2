# Target Architecture

Status: normative target for migration  
Runtime: Next.js App Router on Vercel  
Persistence: PostgreSQL  
Legacy source: React + Vite + Base44  

## 1. Architecture decision

The target is a single Next.js application deployed to Vercel:

```text
Browser
  -> Next.js App Router
     -> Server Components / Client Components
     -> Route Handlers (app/api/**/route.ts)
        -> auth + authorization
        -> Zod validation
        -> domain service
        -> repository
        -> PostgreSQL
     -> object storage
     -> approved external services
```

Express is intentionally excluded. Next.js Route Handlers already provide the HTTP boundary that
Vercel deploys as serverless functions. Wrapping them in Express would add a second router, obscure
per-route deployment behavior, and encourage assumptions about long-lived process state.

The root-level Vercel convention `api/*.js` and the Next.js App Router convention are alternatives.
This project uses the App Router convention:

```text
app/api/reviews/route.ts
app/api/reviews/[reviewId]/route.ts
app/api/reviews/[reviewId]/votes/route.ts
```

## 2. Technology baseline

- Next.js App Router, current stable version selected during the scaffold milestone.
- React version required by that Next.js release.
- TypeScript with `strict: true`; no unchecked project-wide `any`.
- Auth.js with the Drizzle adapter.
- PostgreSQL 16 locally; managed serverless-compatible PostgreSQL in deployed environments.
- Drizzle ORM and `drizzle-kit` for typed queries and forward migrations.
- Zod for environment, request, response, and form validation.
- TanStack Query only for genuinely client-driven server state; prefer Server Components for
  initial reads.
- Tailwind and the existing shadcn/Radix UI system.
- Vitest for units/integration, React Testing Library for components, Playwright for E2E, and k6
  for bounded load tests.

Provider selection for production PostgreSQL may use a Vercel-integrated service such as Neon.
The hard requirement is PostgreSQL plus an external pooled endpoint; application code must not
depend on provider-specific data semantics.

## 3. Repository shape

```text
app/
  (public)/
  (member)/
  (admin)/
  api/
    auth/[...nextauth]/route.ts
    ...
  layout.tsx
  error.tsx
  not-found.tsx
src/
  features/
    <domain>/
      components/
      client/
      server/
        service.ts
        repository.ts
        schema.ts
        policy.ts
      contracts.ts
  lib/
    auth/
    db/
    http/
    observability/
    storage/
db/
  schema/
  migrations/
tests/
  unit/
  integration/
  e2e/
  load/
docs/
```

Rules:

- `app/` owns routing and composition, not business logic.
- `src/features/<domain>/server` is server-only and MUST NOT be imported by client modules.
- `contracts.ts` contains safe transport types, not database rows with private fields.
- `src/lib/db` exports the database connection and transaction primitives.
- migrations are immutable after use in a shared environment.

## 4. Authentication explained

Authentication is the mechanism that proves which user made a request. Base44 currently does this
through its SDK and token flow. Leaving Base44 means the project must own this boundary.

Auth.js will:

1. redirect the user to an approved identity provider;
2. verify the provider response;
3. find or create the linked PostgreSQL user/account;
4. create a revocable database session;
5. set an encrypted/signed secure `HttpOnly` cookie;
6. expose the session to server pages and route handlers.

The cookie is not readable by ordinary browser JavaScript. Protected handlers load the session,
then perform resource-specific authorization:

```text
authentication: caller is user 8b...
authorization: user 8b... owns this review, or has moderator role
```

Initial provider choice is a product/configuration decision. The architecture supports OAuth
providers and email magic links. Password storage MUST NOT be introduced casually; if credentials
are required, password hashing, reset, verification, throttling, and breach protections become a
separate security milestone.

Existing Base44 accounts require an explicit import:

- assign immutable PostgreSQL user UUIDs;
- normalize and verify email ownership;
- link an Auth.js account only after provider identity or verified email matches;
- preserve a legacy Base44 ID mapping for reconciliation;
- never expose email as a public identifier or route parameter.

## 5. API request lifecycle

```text
Route Handler
  1. allocate/read request ID
  2. parse session
  3. apply rate limit where required
  4. validate params/query/body with Zod
  5. invoke service with actor + validated command
  6. service checks policy and opens transaction where needed
  7. repository executes bounded queries
  8. map result to public response DTO
  9. record structured timing/status metadata
```

Illustrative handler:

```ts
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ reviewId: string }> },
) {
  const actor = await requireSession()
  const { reviewId } = await context.params
  const input = voteRequestSchema.parse(await request.json())
  const result = await setReviewVote({ actor, reviewId, input })
  return apiSuccess(result, { status: 200 })
}
```

Business logic and database calls do not belong in this function.

## 6. Runtime and connection rules

- Database-backed handlers use the Node.js runtime unless an explicitly verified driver permits
  the Edge runtime.
- Production `DATABASE_URL` must point to the provider's pooled endpoint.
- A cached module-level client avoids recreating clients within a warm function instance.
- The function may be frozen or destroyed at any time; no correctness may depend on memory state.
- Transactions must complete within one request and one database.
- Long-running work must move to a queue or background workflow; a Vercel function is not a job
  runner.
- Every external request has an abort timeout.
- Route-specific `maxDuration` may be raised only with documented need and plan compatibility.
- WebSocket servers cannot live inside ordinary Vercel route handlers.

## 7. Domain migration map

| Domain | Base44 source | Target |
| --- | --- | --- |
| Identity/profile | `User`, `publicProfile`, `resolveProfiles` | Auth.js user + profile routes/services |
| Albums/catalog | `Album`, `Podcast`, discovery calls | catalog tables and bounded REST reads |
| Reviews | `Review`, `ReviewVote`, `Comment`, review functions | transactional review service |
| Social | `FriendRequest`, `Subscription`, `PinnedPeer` | relationship tables with ID-based FKs |
| Messaging | `ChatMessage`, `messageUnread`, `chatDirectory` | conversation/message tables and cursor APIs |
| Notifications | `Notification`, notifications function | owner-ID indexed notification service |
| Recruitment | recruit entities/functions | post, report, private asset services |
| Moderation | moderation fields/functions | policy/service + audit records |
| Analytics | `DailyStat`, `GenreTally` | event/aggregate tables with atomic writes |
| Files | Base44 upload/integrations | private object storage + PostgreSQL metadata |

Each domain migrates as a vertical slice: schema, repository, service, route contract, frontend
adapter, tests, data migration, reconciliation, and Base44 call removal.

## 8. Realtime strategy

Vercel Route Handlers are not persistent WebSocket servers.

Migration baseline:

- PostgreSQL remains authoritative.
- Messaging and notifications use bounded cursor polling with ETags or `updatedAfter` during the
  initial migration.
- Polling pauses when the page is hidden and uses backoff after errors.
- A later milestone may introduce an approved managed realtime transport such as Ably/Pusher.
- Realtime events are hints to refetch; they are not the source of truth.

This avoids carrying Base44 subscriptions into the target while keeping the first migration
operational.

## 9. Storage strategy

- Store bytes in private object storage, not PostgreSQL.
- Store asset ID, owner ID, object key, media type, byte size, checksum, visibility, and lifecycle
  timestamps in PostgreSQL.
- Uploads use short-lived, scoped signed operations.
- Downloads require an authorization check before returning a short-lived signed URL.
- Deleting the owning object schedules byte deletion and records completion/retry state.
- File type is verified by content, not extension alone.
- Size and rate limits apply before expensive processing.

## 10. Error boundaries and user experience

- Root and route-segment `error.tsx` files handle unexpected rendering failures.
- API adapters map `401` to sign-in, `403` to an access explanation, `404` to not found,
  `409` to conflict/retry guidance, `422` to field feedback, and `429` to retry timing.
- Expected API errors should not be thrown into a global error boundary when they can be rendered
  locally.
- Errors shown to users are localized and contain no stack traces or internal identifiers except a
  support-safe request ID.

## 11. Observability

Every server request records structured metadata:

```text
request_id, route, method, status, duration_ms, actor_role, error_code
```

Do not log message bodies, email, precise location, authorization headers, cookies, or signed URLs.
Unexpected errors are reported to an approved error tracker with redaction. Hot endpoints expose
latency and error-rate metrics sufficient to evaluate milestone load gates.

## 12. Migration order

1. Establish Next.js, strict TypeScript, test harness, and local PostgreSQL.
2. Establish schema migration tooling and shared HTTP contracts.
3. Implement Auth.js and identity migration strategy.
4. Migrate public/read-heavy catalog and review reads.
5. Migrate transactional review writes and moderation.
6. Migrate profile/social relationships using immutable user IDs.
7. Migrate recruitment and private storage.
8. Migrate messaging/notifications and replace realtime subscriptions.
9. Migrate analytics and remaining integrations.
10. Run data reconciliation, remove all Base44 runtime dependencies, and execute cutover gates.

This order may be refined by the Plan Agent, but authentication, database, and contracts must exist
before protected feature writes move.

## 13. Explicitly rejected patterns

- Express mounted inside Next.js.
- root `api/*.js` mixed with App Router handlers.
- direct database calls from React components or route handlers.
- email-based ownership and relationship keys.
- unbounded `.list()` then in-memory filtering.
- application-level uniqueness checks without database constraints.
- production schema mutation on application startup.
- module memory as a durable cache, lock, queue, or session store.
- secrets exposed through `NEXT_PUBLIC_*`.
- Base44 compatibility code without a removal milestone.
- declaring migration complete while any runtime Base44 dependency remains.

