# Local development database

Local PostgreSQL runs only through Docker Compose on this machine. The username, password, and database name below are local placeholders, not production secrets.

## Connection URL

```text
DATABASE_URL=postgresql://echobetnotes:echobetnotes@127.0.0.1:5432/echobetnotes
```

User, password, and database are all `echobetnotes`. The published port is `5432`.

## Check Docker

```bash
docker --version
docker compose version
```

## Start

From the repository root:

```bash
docker compose up -d --wait
```

Compose starts the `postgres` service from `postgres:16`, waits until `pg_isready` succeeds, and keeps data in the named volume `echobetnotes_pgdata`.

## Stop and delete local data

```bash
docker compose down -v
```

`docker compose down -v` deletes the local volume. A later start creates an empty database again.

## Migrations

Application startup must not run migrations. Schema changes stay in reviewed migration tasks and are not applied by starting the app or by starting this Compose service.
