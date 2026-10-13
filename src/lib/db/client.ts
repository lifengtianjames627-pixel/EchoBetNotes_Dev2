import "server-only";
import { createDb } from "./connection";
import { readDatabaseUrl } from "./env";

const handle = createDb(readDatabaseUrl(), { max: 1 });

export const db = handle.db;
export const client = handle.client;
