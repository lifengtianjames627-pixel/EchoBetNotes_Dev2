# M1-scaffold

Status: COMPLETE  
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
| M1-T1 | passed | none | Dev bc-5bd13a17; Check bc-6a924c1a PASS |
| M1-T2 | passed | M1-T1 | Dev bc-60814a0c; Check bc-8edd1acc PASS |
| M1-T3 | passed | M1-T1 | Dev bc-fa1ad46e; Check bc-a3c5ddbd PASS |
| M1-T4 | passed | M1-T2 | Dev bc-af5d1fa4; Check bc-426c8bcb PASS after one repair |
| M1-T5 | passed | M1-T3, M1-T4 | Dev bc-801eb41f; Check bc-33e2215b PASS |

M1-T2 and M1-T3 may run in parallel after M1-T1 passes check. They do not share files.
M1-T4 and M1-T5 both edit `package.json` and run only after their dependencies pass.

## M1-T1 contract

Rename `src/pages` to `src/screens` (22 JSX files). Update `@/pages/*` imports in `src/App.jsx` to `@/screens/*`. Update the `src/pages` glob in `eslint.config.js` and `jsconfig.json`, and the comment in `src/shared/index.js`. In `.gitignore`, un-ignore `.env.example` and ignore `.next/`. Do not change route path strings, package.json, or Vite.

Acceptance, amended by the Main Agent after the Dev report:

- `src/pages` is gone; 22 screens remain; route path strings are unchanged.
- `npm run lint` and `npm run build` exit 0.
- `npm run typecheck` is NOT RUN as a pass/fail gate. It already fails on `main` (333 errors, including screen prop errors and `node_modules/leaflet`). M1-T1 must not add a new error class. Fixing those errors is out of scope.

## Reports

Plan report recorded from the Plan Agent on 2026-10-13.

Dev Agent bc-5bd13a17 returned `blocked` because `npm run typecheck` exits 2. Structural checks, lint, and Vite build passed. The agent compared the error set with HEAD and reported the same 333 errors with only the `src/pages` to `src/screens` path prefix changed. The Main Agent amended the typecheck criterion.

Check Agent bc-6a924c1a returned PASS with no findings. Lint and Vite build were re-run and exited 0. Legacy `tsc` remains NOT RUN as a gate.

M1-T2 through M1-T5 passed independent checks. M1-T4 needed one repair: the unit test import dropped its `.ts` extension so strict `tsc` passes. Load testing is NOT RUN because this milestone does not change a product hot path.

The ledger stays in `docs/plans/active/` until a later milestone moves it. Product screens, Base44 functions, and Auth.js are not migrated yet.
