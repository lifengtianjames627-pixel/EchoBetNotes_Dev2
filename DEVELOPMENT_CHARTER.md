# Echoes Between Notes — Development Charter

Version: 2.0  
Status: mandatory  
Target: complete migration from Base44 to Next.js on Vercel  

This charter has priority over the legacy `charter.md` whenever they conflict. The legacy
file records the Base44 implementation history; it does not define the target architecture.

## 1. Non-negotiable target

- The application MUST migrate completely away from Base44.
- New runtime code MUST NOT import `@base44/sdk`, invoke Base44 functions, use Base44
  entities, rely on Base44 auth, or depend on Base44 storage/realtime services.
- The web application MUST use Next.js App Router and TypeScript in strict mode.
- HTTP endpoints MUST be Next.js Route Handlers under `app/api/**/route.ts`.
- Express MUST NOT be added. A long-running Node server MUST NOT be assumed on Vercel.
- PostgreSQL is the only authoritative application database.
- Production deployment targets Vercel. Local development uses Docker Compose PostgreSQL.
- Migration MUST be incremental and verifiable. Base44 code may remain temporarily only as
  read-only reference until its replacement passes parity and migration gates.

## 2. Required architecture

Every protected request MUST pass through these layers:

```text
Route Handler -> authentication -> authorization -> validation
              -> service -> repository -> PostgreSQL
```

- Route handlers translate HTTP only. They MUST NOT contain persistence queries or core
  business rules.
- Services own business transactions and domain rules.
- Repositories own SQL/ORM access and MUST NOT depend on HTTP objects.
- Shared domain code MUST be deterministic and independently testable.
- Client components MUST NOT access PostgreSQL, secrets, repositories, or privileged SDKs.
- Server-only modules MUST use `server-only` and live under an explicitly server-only path.
- Cross-domain imports MUST use a domain's public interface, not its internal files.
- Browser-only libraries such as Leaflet MUST be isolated in client components and loaded
  without server-side rendering where necessary.

The normative design is in `docs/architecture/TARGET_ARCHITECTURE.md`.

## 3. Authentication and authorization

- Auth.js provides authentication. PostgreSQL stores users, linked provider accounts, and
  revocable sessions.
- Browsers receive secure, `HttpOnly`, `SameSite=Lax` cookies. Session tokens MUST NOT be
  placed in URLs or browser local storage.
- Authentication answers “who is calling.” Authorization separately answers “may this
  caller perform this action on this resource.”
- Every protected route MUST perform server-side authorization. Hiding a button or
  redirecting a page is never an authorization control.
- Resource ownership MUST use immutable user IDs, never email addresses.
- Admin access MUST be checked server-side from persisted roles.
- State-changing requests MUST validate origin/CSRF protections provided by the chosen
  session flow and MUST use an intentional HTTP method.
- Error responses MUST not reveal whether inaccessible private records exist.
- Existing Base44 users require an explicit identity migration and account-linking plan.
  No code may silently create duplicate identities.

## 4. PostgreSQL rules

- Schema changes MUST be represented by reviewed, forward-only migrations.
- Production schema changes MUST NOT be executed automatically from an application request.
- Every relation MUST define a primary key, ownership where applicable, timestamps, and
  intentional delete behavior.
- Foreign keys, unique constraints, check constraints, and indexes MUST enforce invariants
  that would otherwise be vulnerable to races.
- Multi-record state changes MUST run in a transaction.
- Counters MUST use atomic updates or be derived from source rows; read-modify-write in
  application code is forbidden for contested values.
- Queries MUST be bounded and paginated. Full-table scans in request handlers are forbidden.
- User lookup and relationships MUST use user IDs. Email is private profile data, not a key.
- Production uses a provider-managed pooled PostgreSQL endpoint suitable for serverless.
  A module-level client singleton is an optimization, not a substitute for an external pooler.
- Tests MUST use disposable databases, schemas, or provider branches and MUST never use
  production data.

The target schema and transaction requirements are in `docs/architecture/DATABASE.md`.

## 5. API contract rules

- JSON APIs MUST use a consistent envelope:

```json
{
  "data": {},
  "error": null,
  "requestId": "..."
}
```

- Errors MUST use a stable machine code and safe user-facing message:

```json
{
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have access to this resource."
  },
  "requestId": "..."
}
```

- Expected statuses include `400` invalid input, `401` unauthenticated, `403` forbidden,
  `404` absent or intentionally concealed, `409` conflict, `422` semantic validation,
  `429` rate-limited, and `500` unexpected failure.
- Request and response payloads MUST be validated with Zod at the boundary.
- Collection endpoints MUST define cursor pagination, a maximum page size, deterministic
  ordering, and filtering rules.
- Retried mutations MUST be idempotent where duplicate side effects are possible.
- External calls MUST have timeouts, bounded retries with jitter, and typed failure mapping.
- Raw stack traces, SQL errors, tokens, emails, location, or message content MUST NOT be
  returned to clients or written to ordinary logs.

## 6. Privacy, safety, and data handling

- Real user PII MUST NOT be used for development, tests, screenshots, load tests, or prompts.
- Location, direct messages, email, IP-derived data, and private uploads are sensitive.
  Access requires explicit business purpose and server-side authorization.
- Location collection requires specific consent, revocation, minimization, retention, and
  visibility rules. Network-derived and precise locations MUST remain distinct.
- Uploads are private by default. Public delivery requires an explicit product decision.
- File metadata lives in PostgreSQL; bytes live in approved object storage. Upload and delete
  lifecycle MUST be implemented together to prevent orphaned data.
- Logs MUST use request IDs and structured metadata, with sensitive fields redacted.
- Secrets belong in environment variables or the deployment secret store. Agents and tests
  MUST use `.env.example` and mock values, never read `.env`.
- Dependencies MUST be checked for necessity, license suitability, and known vulnerabilities.

## 7. Frontend requirements

- Preserve current product routes and visual identity unless a task explicitly changes them.
- Server Components are the default. Add `"use client"` only for state, effects, event
  handlers, or browser APIs.
- Expected HTTP failures MUST render localized, user-friendly states. Raw errors are forbidden.
- Route segments MUST provide appropriate `loading.tsx`, `error.tsx`, and `not-found.tsx`.
- Forms MUST prevent duplicate submission and preserve entered data after recoverable errors.
- Optimistic updates require rollback and cache reconciliation.
- All new system text, validation, errors, and accessibility labels MUST support
  en, zh, ko, ja, fr, and ru.
- Accessibility checks MUST include keyboard operation, focus management, semantic controls,
  reduced motion, readable contrast, and narrow-screen behavior.
- Client bundles MUST not include server credentials, repository code, or unnecessary heavy
  dependencies.

## 8. Testing gates

No change is complete unless its applicable gates pass:

1. formatter and lint;
2. strict TypeScript check;
3. unit tests for changed domain logic;
4. repository tests against disposable PostgreSQL;
5. API contract tests for changed handlers;
6. component tests for changed interactive UI;
7. E2E tests for changed critical flows;
8. production build;
9. security/authorization matrix for protected resources;
10. load and resilience gate when a milestone changes a hot path.

Tests MUST assert outcomes and persisted state, not merely lack of exceptions. Any skipped gate
must be reported as `NOT RUN` with a reason; it cannot be described as passing.

Required identity matrix for protected behavior:

```text
guest | owner | unrelated user | related user (when applicable) | moderator/admin
```

Test data MUST include a unique run ID, be created by the test, and be removed in `finally`.
Cleanup failure is a test failure. Production load testing is prohibited.

## 9. Multi-agent development discipline

- The Main Agent is the only orchestrator and the only writer of task state.
- A Plan Agent defines atomic tasks, dependencies, file ownership, risks, and acceptance tests.
- A Dev Agent implements exactly one assigned task and does not expand scope.
- A Check Agent is read-only: it reviews the diff and runs proportional verification.
- A Load Agent runs only after a milestone's functional gates pass, only against an isolated
  local or staging environment, and always cleans up its data.
- A failed check returns to the same Dev Agent with exact evidence. The Main Agent resumes
  that agent; it MUST NOT discard the context and ask a new agent to guess.
- A passed check permits the Main Agent to schedule the next task, normally using a fresh
  Dev Agent with a narrow context.
- Parallel Dev Agents may work only on disjoint files and independent contracts.
- Subagents MUST NOT commit, push, deploy, read secrets, or use real user data.
- Reports MUST distinguish facts, assumptions, commands run, results, and unverified areas.

The operational protocol is in `docs/agents/WORKFLOW.md`.

## 10. Migration gates

A Base44 capability may be retired only when all are true:

- its target API and database contract are documented;
- data migration is repeatable and reconciled by counts plus invariant checks;
- authorization tests pass for every relevant identity;
- frontend callers use the new contract;
- rollback and re-run behavior are documented;
- observability exists for the replacement;
- the Check Agent records a passing report.

The final Base44 removal requires a repository-wide search proving there are no runtime imports,
invokes, entity calls, environment variables, deployment hooks, or undocumented data dependencies.

## 11. Definition of done

“Done” means:

- acceptance criteria are met without unrelated behavior changes;
- changed code follows the target layers and contains no Base44 dependency;
- applicable tests and build pass;
- database migration and rollback/recovery notes exist where relevant;
- privacy, authorization, concurrency, pagination, and error paths were considered;
- temporary data and files were cleaned;
- documentation reflects the actual implementation;
- remaining risks are explicit;
- no commit, push, or deployment occurred without user approval.

Passing locally does not mean production-ready. A milestone closes only after independent review.

## 12. Stop conditions

An agent MUST stop and report instead of guessing when:

- a required product decision materially changes public behavior;
- a migration could delete, overwrite, or expose real data;
- authentication identity mapping is ambiguous;
- a secret or production access is required;
- observed behavior contradicts the documented contract;
- three repair cycles fail for the same task;
- test cleanup cannot be proven;
- the requested action requires commit, push, deploy, or production mutation without approval.

