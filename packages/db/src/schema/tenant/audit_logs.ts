import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
