import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const schemaHealth = pgTable("schema_health", {
  id: uuid("id").primaryKey().defaultRandom(),
  note: varchar("note", { length: 80 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});
