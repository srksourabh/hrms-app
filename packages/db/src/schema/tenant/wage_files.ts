import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { payrollRuns } from "./payroll_runs";

export const wageFiles = pgTable("wage_files", {
  id: uuid("id").defaultRandom().primaryKey(),
  payrollRunId: uuid("payroll_run_id")
    .notNull()
    .references(() => payrollRuns.id, { onDelete: "cascade" }),
  format: text("format").notNull().default("mudad"),
  fileUrl: text("file_url"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
