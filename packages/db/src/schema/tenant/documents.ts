import { pgTable, uuid, text, timestamp, date, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { employees } from "./employees";

export const documentTypeEnum = ["iqama", "passport", "work_permit", "contract", "certificate", "other"] as const;

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  type: text("type", { enum: documentTypeEnum }).notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  expiryDate: date("expiry_date"),
  version: text("version").notNull().default("1"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  // Names match migration 0006 (existing tenants already have these).
  employeeTypeIdx: index("documents_employee_type_idx").on(table.employeeId, table.type),
  expiryIdx: index("documents_expiry_idx")
    .on(table.expiryDate)
    .where(sql`${table.expiryDate} IS NOT NULL`),
}));
