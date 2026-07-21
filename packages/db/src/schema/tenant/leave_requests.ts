import { pgTable, uuid, text, timestamp, date, index } from "drizzle-orm/pg-core";
import { employees } from "./employees";
import { leaveTypes } from "./leave_types";

export const leaveStatusEnum = ["pending", "approved", "rejected", "cancelled"] as const;

export const leaveRequests = pgTable("leave_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  leaveTypeId: uuid("leave_type_id")
    .notNull()
    .references(() => leaveTypes.id, { onDelete: "restrict" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: text("status", { enum: leaveStatusEnum }).notNull().default("pending"),
  approvedByUserId: uuid("approved_by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  // Names match migration 0006 (existing tenants already have these).
  employeeCreatedIdx: index("leave_requests_employee_created_idx").on(
    table.employeeId,
    table.createdAt.desc(),
  ),
  statusIdx: index("leave_requests_status_idx").on(table.status),
}));
