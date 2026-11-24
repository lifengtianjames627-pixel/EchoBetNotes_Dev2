# Echoes Between Notes

A self-hosted full-stack music community website built entirely on Node.js, Fastify, PostgreSQL, and S3-compatible object storage — with server-rendered warm paper HTML, static CSS, and lightweight browser JavaScript (no React, no Vite, no frontend build step).

## Repository structure

```text
public/
  favicon.svg
  manifest.json
  styles/paper.css           Warm paper journal stylesheet
  js/app.js                  Lightweight browser controller for /api/* actions
server/
  index.js                   Application entrypoint (migrate + listen)
  app.js                     Fastify application wiring (API + web routes + static)
  check.js                   Node syntax check across server/ and public/js/
  auth/                      Password hashing, JWT/cookie sessions, auth routes
  config/                    Validated runtime configuration
  db/                        PostgreSQL pool and versioned SQL migrations
  entities/
    definitions/             One policy definition per persisted entity
    repository.js            Generic PostgreSQL entity repository
    policies.js              Record- and collection-level authorization rules
    writeGuards.js           Server-side moderation and write sanitization
    routes.js                Entity CRUD/filter/aggregate API
  functions/                 One workflow module per business operation
  http/                      Request IDs, structured logs, uniform error responses
  shared/                    Genres, podcasts, badges, identity, chat, review, and AI helpers
  storage/                   Local and S3-compatible object storage
  web/
    html.js                  Auto-escaping HTML template tag and URL safety helpers
    i18n.js                  6-language UI dictionary (en, zh, ja, ko, fr, ru)
    layout.js                Warm paper journal page shell
    routes.js                Server-rendered page router and auth/admin guards
    pages/                   One module per domain (home, reviews, discover, genres, album, podcasts, profile, chat, soulmate, moderation, staticPages)
  tests/
    unit/                    Node built-in unit tests
    integration/             PGlite HTTP, policy, and SSR integration tests
deploy/
  docker-compose.yml         Website + PostgreSQL production stack
  docker-compose.dev.yml     Local PostgreSQL for development
  nginx.conf                 Optional reverse-proxy configuration
```

## Requirements

- Node.js 22+
- npm 10+
- PostgreSQL 16+ (17 is used by Docker Compose)

## Local development

```bash
npm ci
cp .env.example .env
docker compose -f deploy/docker-compose.dev.yml up -d
npm run db:migrate
npm run dev
```

The website and API run together on `http://localhost:3000`.

### Create the first administrator

Set `BOOTSTRAP_ADMIN_EMAIL` before registering that email. The first matching account receives the `admin` role. Disable open registration in production with `ALLOW_REGISTRATION=false` after provisioning accounts.

## Runtime environment

Backend essentials:

```bash
DATABASE_URL=postgres://echoes:password@localhost:5432/echoes
DATABASE_SSL=false
JWT_SECRET=<at-least-32-random-characters>
PUBLIC_BASE_URL=https://music.example.com
ALLOWED_ORIGINS=https://music.example.com
COOKIE_SECURE=true
ALLOW_REGISTRATION=false
```

Use `STORAGE_DRIVER=local` for development. Production media storage should use `STORAGE_DRIVER=s3` with the `S3_*` variables documented in `.env.example`. R2, AWS S3, and MinIO are supported through the S3-compatible client.

An optional OpenAI-compatible JSON endpoint can be configured with `LLM_API_URL`, `LLM_API_KEY`, and `LLM_MODEL`. Moderation fails safely to normal/manual review behavior when it is unavailable.

## Commands

- `npm run dev` — run the Node.js server with `--watch`
- `npm run start` — migrate and run the production server
- `npm run db:migrate` — apply pending PostgreSQL migrations
- `npm run check` — Node syntax validation across `server/` and `public/js/`
- `npm run lint` — ESLint checks across `server/` and `public/js/`
- `npm test` — unit tests and PGlite integration tests via `node --test`
- `npm run test:unit` — fast unit tests only
- `npm run test:integration` — HTTP, auth, policy, storage, and SSR tests against PGlite

## Docker deployment

See `instruction.md` for the full host launch checklist.

```bash
export POSTGRES_PASSWORD='use-a-secret-manager'
export JWT_SECRET='generate-at-least-32-random-characters'
export PUBLIC_BASE_URL='https://music.example.com'
export ALLOWED_ORIGINS='https://music.example.com'
export COOKIE_SECURE='true'
export DATABASE_SSL='false'
export ALLOW_REGISTRATION='true'
export BOOTSTRAP_ADMIN_EMAIL='admin@music.example.com'
docker compose -f deploy/docker-compose.yml up --build -d
```

The bundled Postgres container does not speak TLS. Compose sets `DATABASE_SSL=false` for that connection. Set `DATABASE_SSL=true` only when `DATABASE_URL` points at a database that requires TLS.

## Verification

Before deploying:

```bash
npm run check
npm run lint
npm test
```
