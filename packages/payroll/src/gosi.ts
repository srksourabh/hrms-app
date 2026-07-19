/**
 * Saudi General Organization for Social Insurance (GOSI) Calculation Engine
 *
 * Legal basis:
 * - GOSI Law (Royal Decree M/33, M/273) and Executive Regulations
 * - SANED (Saudi National Unemployment Insurance) — separate branch
 * - Occupational Hazards branch — covers all workers including expatriates
 *
 * ⚠️  INTERNAL CALCULATION ENGINE — NOT AN OFFICIAL GOSI STATEMENT
 *    Actual GOSI invoices MUST be reconciled against the official GOSI portal
 *    each pay period. These are approximate ledger rates; the GOSI portal
 *    is the authoritative source. Output is for payroll ledger purposes only.
 *
 * 2026 rate structure (two parallel systems keyed by first-registration date):
 *
 * | System         | Employee         | Employer          | Combined |
 * |----------------|------------------|-------------------|----------|
 * | Existing       | ~9.75%           | ~11.75%           | ~21.5%   |
 * | New (M/273)    | ~10.75% (Jul 26) | ~12.75% (Jul 26)  | ~23.5%   |
 * | Non-Saudi      | 0%               | 2% (occ.haz only) | 2%       |
 *
 * New-system pension rates rise 0.5%/side/yr every July through 2028.
 * SANED is 0.75% each side as of 2026 (was 1%+1% pre-2024).
 *
 * Contributory base: basic_salary + housing_allowance (capped at 45,000 SAR/month)
 * Transport, bonuses, allowances ARE NOT included in the GOSI base.
 */

import type { GosiResult } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

const GOSI_MONTHLY_CAP = 45_000;

/** SANED — Saudi National Unemployment Insurance (separate branch from GOSI pension) */
const SANED_EMPLOYEE_RATE = 0.0075; // 0.75% of contributory base, employee-side (was 1% pre-2024)
const SANED_EMPLOYER_RATE = 0.0075; // 0.75%, employer-side (was 1% pre-2024)

/**
 * Occupational Hazards Insurance — covers ALL workers including expatriates.
 * Royal Decree for occupational hazards coverage expansion (2021).
 * Rate varies by industry risk class; 2% is the standard office/light-industry rate.
 */
const OCCUPATIONAL_HAZARDS_EMPLOYER_RATE = 0.02; // 2%, employer only — ALL nationalities

// ─── GOSI Pension Rate Tables ─────────────────────────────────────────────────

interface GosiRateSet {
  employee: number;
  employer:  number;
  /** Escalation schedule: Jul 2024=0, Jul 2025=1, Jul 2026=2, ... */
  escalationYear: number;
}

const GOSI_OLD: GosiRateSet = {
  employee: 0.09,   // 9% pension
  employer:  0.10,  // 10% pension
  escalationYear: 0,
};

// New system (M/273): pension starts at 9.5% each side (Jul 2024),
// rising 0.5%/side/yr through Jul 2028.
// Total employee = pension + SANED_employee (0.75%)
// Total employer = pension + SANED_employer (0.75%) + occ.haz (2%)
function getGosiNewRates(escalationYears = 0): GosiRateSet {
  const basePension = 0.095; // 9.5% — Jul 2024 starting rate
  const increment = escalationYears * 0.005;
  return {
    employee:    basePension + increment,
    employer:    basePension + increment,
    escalationYear: escalationYears,
  };
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type NationalityCategory = "saudi" | "gcc" | "expat";
export type InsuranceRegime     = "old" | "new";

export interface GosiInput {
  nationality:          NationalityCategory;
  /** GOSI pension registration date. Determines old vs new system for Saudi employees. */
  gosiRegistrationDate?: string | null;
  salaryBasic:         number;
  salaryHousing:       number;
  /** Effective date of the payroll period (used for rate-tier lookup). */
  effectiveDate?:      string;
}

// ─── Rate Resolution ─────────────────────────────────────────────────────────

/**
 * Returns the applicable GOSI pension rates for an employee.
 *
 * Rules:
 * - Saudi (registration date < 2024-07-01): old system
 * - Saudi (registration date ≥ 2024-07-01): new system with escalation
 * - GCC nationals: GOSI reciprocity — 0%
 * - Expatriates: GOSI pension N/A — 0% on both sides
 */
function resolveGosiRates(input: GosiInput): GosiRateSet | null {
  if (input.nationality === "gcc") return null; // reciprocal agreement
  if (input.nationality === "expat") return null; // GOSI pension N/A

  // Saudi employee
  if (!input.gosiRegistrationDate) {
    // No registration date — treat as old system (most conservative)
    return GOSI_OLD;
  }

  const regDate = new Date(input.gosiRegistrationDate);
  const cutoff  = new Date("2024-07-01");

  if (regDate < cutoff) return GOSI_OLD;

  // New system — determine escalation year from effective date or today
  // Escalation happens every July 1st. Count how many Jul 1sts have passed.
  const effective = input.effectiveDate ? new Date(input.effectiveDate) : new Date();
  const yearsSinceStart = (effective.getFullYear() - cutoff.getFullYear())
    + (effective.getMonth() >= 6 ? 0 : -1); // before July = not yet escalated for current year
  const cappedYears = Math.min(Math.max(yearsSinceStart, 0), 4);
  return getGosiNewRates(cappedYears);
}

// ─── Core Calculation ─────────────────────────────────────────────────────────

/**
 * Calculate the full GOSI contribution picture for one employee.
 *
 * Three separate insurance branches:
 *  1. GOSI Pension      — Saudi employees only (old or new rate)
 *  2. Occupational Haz  — ALL workers including expatriates (2% employer)
 *  3. SANED             — Saudi employees only (0.75% each side)
 *
 * @example
 * const result = calculateGosi({
 *   nationality: "saudi",
 *   gosiRegistrationDate: "2023-03-15",
 *   salaryBasic: 10000,
 *   salaryHousing: 3000,
 *   effectiveDate: "2026-07-01",
 * });
 * // Existing system: pension 9%/10%, SANED 0.75% each, occ.haz 2% employer
 * //   employee = 9%×13000 + 0.75%×13000 = 1,170 + 98 = 1,268
 * //   employer = 10%×13000 + 0.75%×13000 + 2%×13000 = 1,300 + 98 + 260 = 1,658
 */
export function calculateGosi(input: GosiInput): GosiResult {
  const base = Math.min(input.salaryBasic + input.salaryHousing, GOSI_MONTHLY_CAP);

  // 1. Occupational hazards — ALL workers (rate: 2% employer, 0% employee)
  const occHazEmployer = r(base * OCCUPATIONAL_HAZARDS_EMPLOYER_RATE);

  // 2. GOSI Pension — Saudi/GCC only (null for expat)
  const pension = resolveGosiRates(input);
  const pensionEmployee = pension ? r(base * pension.employee) : 0;
  const pensionEmployer = pension ? r(base * pension.employer)  : 0;

  // 3. SANED — Saudi employees only (0.75% each side)
  const isSaudi = input.nationality === "saudi";
  const sanedEmployee = isSaudi ? r(base * SANED_EMPLOYEE_RATE) : 0;
  const sanedEmployer = isSaudi ? r(base * SANED_EMPLOYER_RATE) : 0;

  return {
    pension: {
      employee: pensionEmployee,
      employer: pensionEmployer,
      rateEmployee: pension?.employee ?? 0,
      rateEmployer: pension?.employer  ?? 0,
    },
    occupationalHazards: {
      employee: 0,
      employer: occHazEmployer,
      rateEmployee: 0,
      rateEmployer: OCCUPATIONAL_HAZARDS_EMPLOYER_RATE,
    },
    saned: {
      employee: sanedEmployee,
      employer: sanedEmployer,
      rateEmployee: SANED_EMPLOYEE_RATE,
      rateEmployer: SANED_EMPLOYER_RATE,
    },
    totalEmployeeCost: pensionEmployee + sanedEmployee,
    totalEmployerCost: occHazEmployer + pensionEmployer + sanedEmployer,
    contributoryBase: base,
    nationality: input.nationality,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function r(value: number): number {
  return Math.round(value * 100) / 100;
}
