import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const departments = pgTable("departments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  parentDepartmentId: uuid("parent_department_id"),
  headEmployeeId: uuid("head_employee_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  // Name matches migration 0006 (existing tenants already have it).
  parentIdx: index("departments_parent_idx")
    .on(table.parentDepartmentId)
    .where(sql`${table.parentDepartmentId} IS NOT NULL`),
}));
