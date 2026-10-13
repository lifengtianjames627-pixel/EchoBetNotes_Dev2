import "server-only";
import { createDb } from "./connection";
import { readDatabaseUrl } from "./env";

// One pool for the life of `next dev` / `next start`. This process stays up on the
// hosting server; do not create a client per request.
const handle = createDb(readDatabaseUrl(), { max: 10 });

export const db = handle.db;
export const client = handle.client;
