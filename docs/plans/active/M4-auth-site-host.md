# M4 — Self-hosted auth refinement and site construction

Status: COMPLETE  
Updated: 2026-10-14

M4 completes the self-hosted authentication boundary and the host-ready site construction
started in M2 (dedicated backend) and M3 (browser API client compatibility).

## Scope

- Refine `server/auth/*` credential parsing, session issuance, and route handlers.
- Align the React auth context and login flow with cookie + bearer dual transport.
- Add `.env.example`, local PostgreSQL dev compose, and auth contract tests.
- Document milestone completion; no Base44 runtime dependency.

## Out of scope

- Auth.js (NextAuth) npm integration — target architecture note only; this repo uses Fastify JWT/cookie sessions.
- OAuth MCP consent routes (`OAuthConsent.jsx`) — platform-only; not mounted on self-hosted API.
- Full product regression, cross-account security audit, or Next.js migration.

## Verification

- `npm test` — includes `server/tests/credentials.test.js` and `server/tests/auth.integration.test.js`
- `npm run build:server`
- `npm run build`
- Manual: register/login/logout on `/login`, protected `/profile` gate, guest browsing without auth error overlay
