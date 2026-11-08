# Launch and host Echoes Between Notes

These are the actions you take on the machine that will serve the site. The container builds the website, applies database migrations, and serves the site and API on one origin. You do not run `npm run build` or `npm run db:migrate` for this path.

Use the repository after the deploy-ready changes are included (pull request #9 until that pull request is on `main`).

## 1. Prepare the host

1. Install Docker with Compose on the host.
2. Choose a domain, for example `https://music.example.com`.
3. Point that domain’s DNS at the host.
4. Put HTTPS in front of the site. The included `deploy/nginx.conf` only proxies plain HTTP and is not started by Compose. Terminate TLS at your load balancer, Cloudflare, Caddy, or your own nginx, and forward to the website container on port 3000.
5. Leave Postgres private. Compose does not publish port 5432. Do not add a public database port.
6. Do not publish container port 3000 on the public internet. Only the HTTPS proxy should be able to reach it. The app trusts one forwarding header from that proxy, so a client who can connect to port 3000 directly can present a fake client address.

## 2. Set the secrets

In the directory where you run Compose, export these values. Do not commit them.

```bash
export POSTGRES_PASSWORD='replace-with-a-long-random-password'
export JWT_SECRET='replace-with-at-least-32-random-characters'
export PUBLIC_BASE_URL='https://music.example.com'
export ALLOWED_ORIGINS='https://music.example.com'
export COOKIE_SECURE='true'
export DATABASE_SSL='false'
export ALLOW_REGISTRATION='true'
export BOOTSTRAP_ADMIN_EMAIL='you@music.example.com'
```

- `JWT_SECRET` must be at least 32 characters. Keep the same value across restarts. Changing it signs everyone out.
- `PUBLIC_BASE_URL` and `ALLOWED_ORIGINS` must be the public `https` origin, with no trailing path. Local media links are built from `PUBLIC_BASE_URL`.
- `COOKIE_SECURE=true` only after HTTPS is working. On plain HTTP the browser will drop the session cookie.
- `DATABASE_SSL=false` is required for the Postgres container in this Compose file. Set `DATABASE_SSL=true` only if you later point `DATABASE_URL` at a database that requires TLS.
- `POSTGRES_PASSWORD` is applied when the database volume is created. After the first start, changing the variable does not change the existing database password.

## 3. Start the stack

From the repository root:

```bash
docker compose -f deploy/docker-compose.yml up --build -d
```

Wait until `https://music.example.com/api/health` returns `"database":"ok"`. The site itself is `https://music.example.com/`.

## 4. Create the administrator, then close registration

1. Open `https://music.example.com/login`.
2. Register the exact address in `BOOTSTRAP_ADMIN_EMAIL`. That account receives the `admin` role. A different address becomes a normal member.
3. Sign out and sign back in to confirm the session cookie works.
4. Close registration and recreate only the website container:

```bash
export ALLOW_REGISTRATION='false'
docker compose -f deploy/docker-compose.yml up -d --force-recreate website
```

5. Confirm `POST /api/auth/register` returns `403` with `"error":"registration_disabled"`.

Leave `BOOTSTRAP_ADMIN_EMAIL` set if you want that address to stay the bootstrap admin. It does not create the account by itself. It only assigns `admin` when that address registers.

## 5. Choose where uploads live

Local files are the default (`STORAGE_DRIVER=local`). They stay in the `uploads` volume. Back that volume up with the database. If the volume is removed, uploaded media is gone.

For a public site, create a private S3-compatible bucket (AWS S3, Cloudflare R2, or MinIO) and set:

```bash
export STORAGE_DRIVER='s3'
export S3_ENDPOINT='https://your-s3-endpoint'
export S3_REGION='auto'
export S3_BUCKET='your-private-bucket'
export S3_ACCESS_KEY_ID='your-access-key'
export S3_SECRET_ACCESS_KEY='your-secret-key'
export S3_FORCE_PATH_STYLE='false'
```

Set `S3_FORCE_PATH_STYLE=true` for MinIO. Recreate the website container after changing these values. The app reads objects through expiring signed URLs. Do not make the bucket public.

## 6. Optional moderation

Review text can be sent to an OpenAI-compatible JSON endpoint. If you skip this, moderation falls back to ordinary manual review.

```bash
export LLM_API_URL='https://api.example.com/v1/chat/completions'
export LLM_API_KEY='your-key'
export LLM_MODEL='your-model'
```

Recreate the website container after setting them.

## 7. Back up before you call it live

Back up both named volumes:

- `postgres-data` — accounts, sessions, and community records
- `uploads` — media, when you are still on local storage

Take a backup before each upgrade. Restore has to bring the database and the matching media back together.

## 8. Check the live site

- `GET /api/health` reports the database as ok.
- `/` and `/reviews` load without signing in.
- A guest can read published reviews.
- A guest request to chat returns `401`.
- Sign-in sets the session cookie and `GET /api/auth/me` returns your account.
- A wrong password returns `401` with `"error":"invalid_credentials"`.
- Registration stays closed after step 4.
- Upload a file and open it again after a restart.

## 9. Later updates

On the host:

```bash
git pull
docker compose -f deploy/docker-compose.yml up --build -d
```

The new container applies pending migrations as it starts. Keep `JWT_SECRET` and `POSTGRES_PASSWORD` unchanged unless you intend to reset sessions or the database credential.
