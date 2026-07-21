import { pgTable, uuid, text, timestamp, numeric, date, index } from "drizzle-orm/pg-core";

export const payrollStatusEnum = ["draft", "pre_check", "ready", "completed", "cancelled"] as const;

export const payrollRuns = pgTable("payroll_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  periodMonth: date("period_month").notNull(),
  status: text("status", { enum: payrollStatusEnum }).notNull().default("draft"),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  // Name matches migration 0006 (existing tenants already have it).
  periodStatusIdx: index("payroll_runs_period_status_idx").on(table.periodMonth, table.status),
}));
