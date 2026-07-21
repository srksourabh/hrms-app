import { pgTable, uuid, text, timestamp, date, jsonb } from "drizzle-orm/pg-core";
import { employees } from "./employees";

export const historyEventEnum = ["promotion", "transfer", "salary_change", "termination", "rehire"] as const;

export const employmentHistory = pgTable("employment_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  eventType: text("event_type", { enum: historyEventEnum }).notNull(),
  effectiveDate: date("effective_date").notNull(),
  details: jsonb("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
