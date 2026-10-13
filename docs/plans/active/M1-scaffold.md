# M1-scaffold

Status: DEVELOPING(M1-T1)  
Plan Agent: bc-5b0564ab-4650-51a6-972d-b43b922fc269  
Updated: 2026-10-13

EchoBetNotes_Dev2 is the migration workspace. EchosBetweenNotes stays a separate Base44 reference.
M1 creates a Next.js host, local PostgreSQL, and a proof migration. It does not migrate product features.

## Decisions

- Canonical `npm run dev` becomes Next.js at M1-T2. Vite remains `npm run dev:legacy` until a later milestone removes Base44.
- `src/pages` is renamed to `src/screens` before any `app/` directory exists, because Next.js would otherwise treat those Vite screens as Pages Router routes.
- React stays on 18.2 for this milestone so the legacy Vite UI is unchanged. Next.js is `next@16.4`, not canary.
- Tailwind 3 stays. No Express. No Auth.js. No product tables. The only new relation is `schema_health`.
- Charter gates 5, 6, 7, 9, and 10 are NOT RUN for M1 (no API, product UI, E2E, protected resource, or hot path).

## Tasks

| ID | State | Depends on | Owner |
| --- | --- | --- | --- |
| M1-T1 | developing | none | Dev Agent (assigned) |
| M1-T2 | ready after T1 | M1-T1 | unassigned |
| M1-T3 | ready after T1 | M1-T1 | unassigned |
| M1-T4 | blocked | M1-T2 | unassigned |
| M1-T5 | blocked | M1-T3, M1-T4 | unassigned |

M1-T2 and M1-T3 may run in parallel after M1-T1 passes check. They do not share files.
M1-T4 and M1-T5 both edit `package.json` and run only after their dependencies pass.

## M1-T1 contract

Rename `src/pages` to `src/screens` (22 JSX files). Update `@/pages/*` imports in `src/App.jsx` to `@/screens/*`. Update the `src/pages` glob in `eslint.config.js` and `jsconfig.json`, and the comment in `src/shared/index.js`. In `.gitignore`, un-ignore `.env.example` and ignore `.next/`. Do not change route path strings, package.json, or Vite.

Acceptance: `src/pages` is gone; 22 screens remain; lint, typecheck, and Vite build pass.

## Reports

Plan report recorded from the Plan Agent on 2026-10-13. No Dev or Check report yet.
