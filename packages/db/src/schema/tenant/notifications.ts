import { pgTable, uuid, text, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";

export const notificationChannelEnum = ["email", "sms", "in_app"] as const;

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  channel: text("channel", { enum: notificationChannelEnum }).notNull(),
  type: text("type"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: text("severity"),
  metadata: jsonb("metadata"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Names match migration 0006 (existing tenants already have these).
  userCreatedIdx: index("notifications_user_created_idx").on(table.userId, table.createdAt.desc()),
  userReadIdx: index("notifications_user_read_idx").on(table.userId, table.read),
}));
