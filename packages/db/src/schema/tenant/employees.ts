import { pgTable, uuid, text, timestamp, pgEnum, numeric, date, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { departments } from "./departments";
import { encryptedText } from "../../crypto";

export const employmentStatusEnum   = pgEnum("employment_status",   ["active", "terminated", "suspended", "on_leave"]);
export const gosiSystemEnum       = pgEnum("gosi_system",        ["old", "new"]);
export const nationalityEnum       = pgEnum("nationality",        ["saudi", "expat", "gcc"]);
// GCC status is tracked via gccStatus boolean below (nationality="expat" + gccStatus=true)

/** Visa type for expatriate employees */
export const visaTypeEnum = pgEnum("visa_type", [
  "work",         // Iqama (employment residency)
  "visit",        // Visit visa
  "dependent",    // Dependent visa
  "exit_reentry", // Exit-reentry visa
  "final_exit",   // Final exit visa
]);

/** Current state of the employee's immigration/visa record */
export const immigrationStatusEnum = pgEnum("immigration_status", [
  "valid",        // Active and valid
  "expiring_soon", // Within 90-day alert window
  "expired",      // Past expiry date — blocks payroll
  "renewal_pending", // Renewal in progress
  "cancelled",    // Cancelled
]);

export const employees = pgTable("employees", {
  id: uuid("id").defaultRandom().primaryKey(),
  departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
  managerEmployeeId: uuid("manager_employee_id"),

  // ── Core identity ──────────────────────────────────────────────────────
  fullName:        text("full_name").notNull(),
  nationality:     nationalityEnum("nationality").notNull(),
  /** GCC nationals (e.g. UAE, Kuwait, Qatar, Oman, Bahrain) are treated specially for GOSI */
  gccStatus:       text("gcc_status").default("false"), // "true" | "false"
  employmentStatus: employmentStatusEnum("employment_status").notNull().default("active"),

  // ── Compensation ──────────────────────────────────────────────────────
  salaryBasic:     numeric("salary_basic",     { precision: 12, scale: 2 }).notNull(),
  salaryHousing:   numeric("salary_housing",   { precision: 12, scale: 2 }).notNull().default("0"),
  salaryTransport: numeric("salary_transport", { precision: 12, scale: 2 }).notNull().default("0"),

  // ── Dates ──────────────────────────────────────────────────────────────
  hireDate:        date("hire_date").notNull(),
  terminationDate: date("termination_date"),
  gosiRegistrationDate: date("gosi_registration_date"),
  gosiSystem:      gosiSystemEnum("gosi_system"),

  // ── Encrypted PII (AES-256-GCM at rest, SEC-008) ───────────────────────
  // Transparent encrypt-on-write / decrypt-on-read via the `encryptedText`
  // codec. Storage stays `text`; encryption is deterministic so the iqama
  // unique index and equality lookups keep working.
  iqamaNumberEnc:    encryptedText("iqama_number_enc"),
  passportNumberEnc: encryptedText("passport_number_enc"),
  bankIbanEnc:      encryptedText("bank_iban_enc"),

  // ── Immigration / Right-to-work (P0-6) ─────────────────────────────────
  /**
   * Passport expiry — blocks payroll if expired (per Article 35 / Muqeem rules).
   * Alert at 90/60/30 days before expiry via Document Renewal Agent.
   */
  passportExpiry:         date("passport_expiry"),
  /**
   * Iqama (residency permit) expiry — blocks payroll if expired.
   * Alert at 90/60/30 days. Renewal must go through Muqeem.
   */
  iqamaExpiry:            date("iqama_expiry"),
  /**
   * Exit-reentry visa expiry (for expatriates on that status).
   * Overstay triggers automatic iqama cancellation — hard block.
   */
  exitReentryExpiry:      date("exit_reentry_expiry"),
  /**
   * Work permit / visa type for the expatriate.
   * "work" = standard iqama holder (most common).
   * "visit" / "dependent" = cannot work without transfer.
   */
  visaType:               visaTypeEnum("visa_type"),
  /**
   * Occupational classification as registered with GOSI / Qiwa.
   * Must match the occupation on the iqama.
   * SSCO code (Saudi Standard Classification of Occupations) is the target.
   */
  occupationCode:         text("occupation_code"),
  /**
   * Skill level as per GOSI registration (1=elementary, 2=craft, 3=technician,
   * 4=professional, 5=manager). Affects Nitaqat counting rules.
   */
  skillLevel:             text("skill_level"),
  /**
   * Current immigration status — derived field updated by the Document Renewal Agent.
   * "expired" = payroll block. "expiring_soon" = alert.
   */
  immigrationStatus:      immigrationStatusEnum("immigration_status").default("valid"),

  // ── Rehire eligibility ─────────────────────────────────────────────────
  rehireEligible: text("rehire_eligible"),  // "yes" | "no" | null
  rehireReason:   text("rehire_reason"),

  // ── Timestamps ─────────────────────────────────────────────────────────
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => ({
  // Hot-path filters (QA-001). Names match migration 0006 so existing tenant
  // schemas (already indexed by the 0006 backfill) stay in sync with new ones.
  departmentIdx: index("employees_department_idx")
    .on(table.departmentId)
    .where(sql`${table.departmentId} IS NOT NULL`),
  statusIdx: index("employees_status_idx").on(table.employmentStatus),
  managerIdx: index("employees_manager_idx")
    .on(table.managerEmployeeId)
    .where(sql`${table.managerEmployeeId} IS NOT NULL`),
  // DB-level duplicate-iqama backstop (migration 0009). Deterministic
  // encryption keeps equality — and therefore uniqueness — meaningful.
  iqamaUnique: uniqueIndex("employees_iqama_unique")
    .on(table.iqamaNumberEnc)
    .where(sql`${table.iqamaNumberEnc} IS NOT NULL`),
}));
