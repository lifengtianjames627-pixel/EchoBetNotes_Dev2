# Echoes Between Notes

This is a React + Vite frontend that talks to a generic HTTP API (no Base44 SDK or Base44 Vite plugin required).

## Local development

### Prerequisites

- Node.js 20+
- npm 10+

### Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Environment variables

Create `.env.local` (or set these in your hosting provider):

```bash
# Public app identifier used by optional app-level endpoints
VITE_APP_ID=your_app_id

# API origin. Leave empty to use same-origin /api.
VITE_API_BASE_URL=https://api.your-domain.com

# Login path or URL used for auth redirects.
VITE_LOGIN_URL=/login
```

## Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — local preview of built assets
- `npm run start` — preview server bound to `0.0.0.0` (useful on hosting VMs)
- `npm run lint` — lint check
- `npm run typecheck` — TypeScript/JS type checking

## Deploying to a hosting server

### Option A: static hosting + separate API

1. Build assets:
   ```bash
   npm ci
   npm run build
   ```
2. Upload `dist/` to your static host.
3. Configure SPA fallback so every route resolves to `index.html`.
4. Set `VITE_API_BASE_URL` to your API origin at build time.

### Option B: run directly on a VM

```bash
npm ci
npm run build
PORT=4173 npm run start
```

Put a reverse proxy (nginx/caddy) in front and route `/api` to your backend service.

## Notes

- Frontend routes require SPA fallback (`try_files ... /index.html`).
- Auth/session endpoints expected by the app are under `/api/auth/*`.
- Function calls are expected under `/api/functions/:name`.
- Entity CRUD endpoints are expected under `/api/entities/:entityName`.
