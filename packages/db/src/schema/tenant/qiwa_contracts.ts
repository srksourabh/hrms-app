import { pgTable, uuid, text, timestamp, date, numeric, boolean, jsonb, pgEnum, integer, index } from "drizzle-orm/pg-core";
import { employees } from "./employees";

export const qiwaContractStatusEnum = pgEnum("qiwa_contract_status", [
  "draft",
  "submitted",
  "accepted",
  "rejected",
  "terminated",
]);

export const qiwaContractTypeEnum = pgEnum("qiwa_contract_type", [
  "permanent",
  "contract",
  "probation",
]);

export const qiwaContracts = pgTable("qiwa_contracts", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  qiwaEmployeeId: text("qiwa_employee_id"),
  contractType: qiwaContractTypeEnum("contract_type").notNull().default("permanent"),
  status: qiwaContractStatusEnum("status").notNull().default("draft"),
  jobTitle: text("job_title").notNull(),
  department: text("department"),
  salary: numeric("salary", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("SAR").notNull(),
  workHours: text("work_hours").notNull().default("8"),
  workDays: text("work_days").notNull().default("Sunday-Monday-Tuesday-Wednesday-Thursday"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  terminationDate: date("termination_date"),
  resignationDate: date("resignation_date"),
  noticePeriodDays: integer("notice_period_days").default(60),
  housingAllowance: numeric("housing_allowance", { precision: 12, scale: 2 }).default("0"),
  transportAllowance: numeric("transport_allowance", { precision: 12, scale: 2 }).default("0"),
  otherAllowances: jsonb("other_allowances"),
  gosiContribution: numeric("gosi_contribution", { precision: 12, scale: 2 }).default("0"),
  employerContribution: numeric("employer_contribution", { precision: 12, scale: 2 }).default("0"),
  qiwaPayload: jsonb("qiwa_payload"),
  qiwaResponse: jsonb("qiwa_response"),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  syncError: text("sync_error"),
  isSaudizationPriority: boolean("is_saudization_priority").default(false),
  nationality: text("nationality"),
  iqamaExpiryDate: date("iqama_expiry_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  employeeIdx: index("qiwa_contracts_employee_idx").on(table.employeeId),
  statusIdx: index("qiwa_contracts_status_idx").on(table.status),
  qiwaIdIdx: index("qiwa_contracts_qiwa_id_idx").on(table.qiwaEmployeeId),
  startDateIdx: index("qiwa_contracts_start_date_idx").on(table.startDate),
}));

export const qiwaSyncLogs = pgTable("qiwa_sync_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  contractId: uuid("contract_id")
    .notNull()
    .references(() => qiwaContracts.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  requestPayload: jsonb("request_payload"),
  responsePayload: jsonb("response_payload"),
  status: text("status").notNull(),
  errorMessage: text("error_message"),
  performedAt: timestamp("performed_at", { withTimezone: true }).defaultNow().notNull(),
  durationMs: integer("duration_ms"),
}, (table) => ({
  contractIdx: index("qiwa_sync_logs_contract_idx").on(table.contractId),
  statusIdx: index("qiwa_sync_logs_status_idx").on(table.status),
  performedAtIdx: index("qiwa_sync_logs_performed_at_idx").on(table.performedAt),
}));