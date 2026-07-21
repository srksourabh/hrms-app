import { pgTable, uuid, text, timestamp, numeric, index } from "drizzle-orm/pg-core";
import { employees } from "./employees";
import { payrollRuns } from "./payroll_runs";

export const payslips = pgTable("payslips", {
  id: uuid("id").defaultRandom().primaryKey(),
  payrollRunId: uuid("payroll_run_id")
    .notNull()
    .references(() => payrollRuns.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),

  // ── Salary components ────────────────────────────────────────────────
  basic:       numeric("basic",       { precision: 12, scale: 2 }).notNull(),
  housing:     numeric("housing",     { precision: 12, scale: 2 }).notNull(),
  transport:   numeric("transport",   { precision: 12, scale: 2 }).notNull(),
  overtime:    numeric("overtime",    { precision: 12, scale: 2 }).notNull().default("0"),
  /** Total gross before any deduction (basic + housing + transport + overtime). */
  gross:       numeric("gross",       { precision: 12, scale: 2 }).notNull().default("0"),

  // ── GOSI / SANED / occupational-hazard breakdown ────────────────────
  gosiEmployee: numeric("gosi_employee", { precision: 12, scale: 2 }).notNull().default("0"),
  gosiEmployer: numeric("gosi_employer", { precision: 12, scale: 2 }).notNull().default("0"),
  /** Pension branch employee portion (Saudi only). */
  gosiPensionEmployee: numeric("gosi_pension_employee", { precision: 12, scale: 2 }).notNull().default("0"),
  /** Pension branch employer portion (Saudi only). */
  gosiPensionEmployer: numeric("gosi_pension_employer", { precision: 12, scale: 2 }).notNull().default("0"),
  /** Occupational hazards employer portion (Saudi + expats). */
  gosiOccHazardsEmployer: numeric("gosi_occ_hazards_employer", { precision: 12, scale: 2 }).notNull().default("0"),
  /** SANED employer portion (Saudi only). */
  gosiSanedEmployer:      numeric("gosi_saned_employer",      { precision: 12, scale: 2 }).notNull().default("0"),
  /** Contributory base used for GOSI (basic + housing, capped at 45K). */
  gosiContributoryBase:   numeric("gosi_contributory_base",   { precision: 12, scale: 2 }).notNull().default("0"),
  /** Employee GOSI rate that was applied (e.g. 0.115 for new-system Jul-2025 step). */
  gosiRateEmployee:       numeric("gosi_rate_employee",       { precision: 6,  scale: 4 }).notNull().default("0"),
  /** Employer GOSI rate (pension + occ.haz + SANED combined). */
  gosiRateEmployer:       numeric("gosi_rate_employer",       { precision: 6,  scale: 4 }).notNull().default("0"),
  /** Effective rate system: "old" (pre-Jul 2024) or "new" (post). */
  gosiSystem:             text("gosi_system"),

  // ── Other deductions + EOSB accrual ─────────────────────────────────
  deductions:           numeric("deductions",           { precision: 12, scale: 2 }).notNull().default("0"),
  /** Notional EOSB accrued through this period (1 month per year of service, full EOSB rate). */
  eosbAccrued:          numeric("eosb_accrued",          { precision: 12, scale: 2 }).notNull().default("0"),
  /** Years of service used for the EOSB accrual (fractional). */
  eosbYearsOfService:   numeric("eosb_years_of_service", { precision: 6,  scale: 3 }).notNull().default("0"),
  /** Net take-home pay. */
  netPay:               numeric("net_pay",               { precision: 12, scale: 2 }).notNull(),

  // ── Metadata ──────────────────────────────────────────────────────────
  pdfUrl:      text("pdf_url"),
  /** JSON breakdown persisted for audit trail and the dashboard view. */
  breakdown:    text("breakdown"),
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Names match migration 0006 (existing tenants already have these).
  runCreatedIdx: index("payslips_run_created_idx").on(table.payrollRunId, table.createdAt.desc()),
  employeeIdx: index("payslips_employee_idx").on(table.employeeId),
}));
