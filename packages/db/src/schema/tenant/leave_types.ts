import { pgTable, uuid, text, integer, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";

export const leaveTypes = pgTable("leave_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  daysAllowed: integer("days_allowed").notNull().default(0),
  paid: boolean("paid").notNull().default(true),
  rules: jsonb("rules"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
