import { pgTable, uuid, integer, numeric, index, uniqueIndex } from "drizzle-orm/pg-core";
import { employees } from "./employees";
import { leaveTypes } from "./leave_types";

export const leaveBalances = pgTable("leave_balances", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  leaveTypeId: uuid("leave_type_id")
    .notNull()
    .references(() => leaveTypes.id, { onDelete: "restrict" }),
  balance: numeric("balance", { precision: 5, scale: 1 }).notNull(),
  year: integer("year").notNull(),
  // NOTE (DB-009): created_at / updated_at exist in newly provisioned tenants
  // and are added to legacy tenants by migration 0010. They are deliberately
  // NOT declared here yet — declaring them before 0010 runs everywhere would
  // make Drizzle select columns that legacy tenant schemas don't have.
}, (table) => ({
  // Exactly one balance row per employee / leave type / year (DB-009).
  empTypeYearUq: uniqueIndex("leave_balances_emp_type_year_uq").on(
    table.employeeId,
    table.leaveTypeId,
    table.year,
  ),
  employeeYearIdx: index("leave_balances_employee_year_idx").on(table.employeeId, table.year),
}));
