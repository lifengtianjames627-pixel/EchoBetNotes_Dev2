import { defineConfig } from "drizzle-kit";

const databaseUrl = readGenerateDatabaseUrl();

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  ...(databaseUrl ? { dbCredentials: { url: databaseUrl } } : {}),
});

function readGenerateDatabaseUrl(): string | undefined {
  const value = process.env.DATABASE_URL;
  if (!value) {
    return undefined;
  }

  let hostname: string;
  try {
    hostname = new URL(value).hostname;
  } catch {
    throw new Error("DATABASE_URL must be a valid URL");
  }

  if (hostname !== "127.0.0.1" && hostname !== "localhost") {
    throw new Error(`refusing non-local database host: ${hostname || "empty"}`);
  }

  return value;
}
