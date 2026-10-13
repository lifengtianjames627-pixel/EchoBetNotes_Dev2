import { z } from "zod";

const localHosts = new Set(["127.0.0.1", "localhost"]);
const databaseNamePattern = /^(?:echobetnotes|echobetnotes_test_[a-z0-9]+)$/;

export const databaseUrlSchema = z
  .string({
    required_error: "DATABASE_URL is required",
    invalid_type_error: "DATABASE_URL must be a string",
  })
  .superRefine((value, ctx) => {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DATABASE_URL must be a valid URL",
      });
      return;
    }

    if (url.protocol !== "postgresql:") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DATABASE_URL must use the postgresql scheme",
      });
    }

    if (!localHosts.has(url.hostname)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `refusing non-local database host: ${url.hostname || "empty"}`,
      });
    }

    const databaseName = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
    if (!databaseNamePattern.test(databaseName)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "DATABASE_URL database must be echobetnotes or echobetnotes_test_ followed by lowercase letters and digits",
      });
    }
  });

export function assertLocalDatabaseUrl(value: unknown): string {
  const parsed = databaseUrlSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
  }
  return parsed.data;
}

export function readDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  return assertLocalDatabaseUrl(env.DATABASE_URL);
}
