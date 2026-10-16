# Echoes Between Notes

A host-ready full-stack music community website built with React, Vite, Node.js, Fastify, PostgreSQL, and S3-compatible object storage.

## Repository structure

```text
src/                         React website
  api/                       Browser API client
  features/                  Domain UI and query modules
server/                      Dedicated Node.js backend
  auth/                      Password hashing, JWT/cookie sessions, auth routes
  config/                    Validated runtime configuration
  db/                        PostgreSQL pool and versioned SQL migrations
  entities/
    definitions/             One policy definition per persisted entity
    repository.js            Generic PostgreSQL entity repository
    policies.js              Record-level authorization rules
    routes.js                Entity CRUD/filter/aggregate API
  functions/                 One workflow module per business operation
  shared/                    Reusable identity, chat, review, and AI policies
  storage/                   Local and S3-compatible object storage
  tests/                     Backend contract and policy tests
deploy/
  docker-compose.yml         Website + PostgreSQL production stack
  nginx.conf                 Optional reverse-proxy configuration
```

## Requirements

- Node.js 22+
- npm 10+
- PostgreSQL 16+ (17 is used by Docker Compose)

## Local development

```bash
npm ci
cp .env.example .env.local
docker compose -f deploy/docker-compose.dev.yml up -d
npm run db:migrate
npm run dev:full
```

The Vite website runs on `http://localhost:5173`; the API runs on `http://localhost:3000`. Leave `VITE_API_BASE_URL` empty to use the Vite `/api` proxy, or set `VITE_API_BASE_URL=http://localhost:3000` when calling the API directly.

Authentication uses the dedicated backend under `server/auth/` (JWT bearer token plus `HttpOnly` session cookie). The login page stores the bearer token for cross-origin development; production same-origin deployments can rely on the cookie alone.

### Create the first administrator

Set `BOOTSTRAP_ADMIN_EMAIL` before registering that email. The first matching account receives the `admin` role. Disable open registration in production with `ALLOW_REGISTRATION=false` after provisioning accounts or connect a separate invitation flow.

## Runtime environment

Frontend build variables:

```bash
VITE_APP_ID=echoes-between-notes
VITE_API_BASE_URL=
VITE_LOGIN_URL=/login
```

Backend essentials:

```bash
DATABASE_URL=postgres://echoes:password@localhost:5432/echoes
JWT_SECRET=<at-least-32-random-characters>
PUBLIC_BASE_URL=https://music.example.com
ALLOWED_ORIGINS=https://music.example.com
COOKIE_SECURE=true
ALLOW_REGISTRATION=false
```

Use `STORAGE_DRIVER=local` for development. Production media storage should use `STORAGE_DRIVER=s3` with the `S3_*` variables documented in `.env.example`. R2, AWS S3, and MinIO are supported through the S3-compatible client.

An optional OpenAI-compatible JSON endpoint can be configured with `LLM_API_URL`, `LLM_API_KEY`, and `LLM_MODEL`. Moderation fails safely to normal/manual review behavior when it is unavailable.

## Commands

- `npm run dev` — frontend development server
- `npm run dev:server` — backend development server
- `npm run dev:full` — run frontend and backend together
- `npm run build` — build the frontend
- `npm run build:server` — backend syntax validation
- `npm run db:migrate` — apply pending PostgreSQL migrations
- `npm run start` — migrate and run the production full-stack server
- `npm test` — backend/unit tests
- `npm run typecheck` — JavaScript/TypeScript checking
- `npm run lint` — lint checks

## Docker deployment

```bash
export POSTGRES_PASSWORD='use-a-secret-manager'
export JWT_SECRET='generate-at-least-32-random-characters'
export PUBLIC_BASE_URL='https://music.example.com'
export ALLOWED_ORIGINS='https://music.example.com'
docker compose -f deploy/docker-compose.yml up --build -d
```

The production container:

1. builds the React application;
2. starts the dedicated Fastify backend;
3. applies versioned database migrations;
4. serves the SPA and API from one origin;
5. persists PostgreSQL data and local uploads through named volumes.

For production media, configure an S3-compatible private bucket instead of the local uploads volume. Place TLS at your ingress/load balancer or use the optional nginx reverse-proxy configuration.

## HTTP API

- `GET /health` and `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET|PATCH /api/auth/me`
- `POST /api/auth/logout`
- `/api/entities/:entityName` for policy-controlled CRUD
- `/api/entities/:entityName/filter` for filtered queries
- `/api/entities/:entityName/aggregate` for aggregates
- `/api/functions/:name` for business workflows
- `POST /api/uploads/public` for authenticated public uploads

All sensitive entity mutations are denied on generic routes and must use their dedicated workflow. Private podcast audio and recruitment posters are returned only through expiring signed URLs.

## Verification

Before deploying:

```bash
npm run build
npm run build:server
npm run typecheck
npm run lint
npm test
```

Also verify login, registration policy, administrator access, upload limits, signed media access, CORS, TLS cookies, and PostgreSQL backups in the target environment.
