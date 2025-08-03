import { index, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("tmp_user", {
  id: serial("id").primaryKey(),
  email: text("email").unique(),
});

export const sessions = pgTable(
  "tmp_session",
  {
    id: text("id").primaryKey(),
    userId: serial("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)]
);
