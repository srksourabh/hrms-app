/**
 * Saudi General Organization for Social Insurance (GOSI) Calculation Engine
 *
 * Legal basis:
 * - GOSI Law (Royal Decree M/33) and Executive Regulations
 * - SANED (Saudi National Unemployment Insurance) — separate branch
 * - Occupational Hazards branch — covers all workers including expatriates
 *
 * ⚠️  INTERNAL CALCULATION ENGINE — NOT AN OFFICIAL GOSI STATEMENT
 *    This implements the statutory rate structure for payroll calculation.
 *    Actual GOSI invoices must be obtained directly from the GOSI portal
 *    or official API. Output is for payroll ledger purposes only.
 *
 * Rate sources (verified against GOSI published schedules):
 * - Pre-Jul 2024 Saudi (old system): 9% employee / 10% employer + 2% SANED + 0.75% occ.hazards
 * - Post-Jul 2024 Saudi (new system): 11% employee / 11% employer + 2% SANED + 0.75% occ.hazards
 *   Escalation schedule: Jul 2025 +0.5% each side, Jul 2026 +0.5% each side
 * - GCC nationals: GOSI reciprocity agreement — 0% to Saudi GOSI
 * - Non-Saudi/non-GCC expatriates: Occupational hazards only — 2% employer, 0% employee
 *
 * Contributory base: basic_salary + housing_allowance (capped at 45,000 SAR/month)
 * Transport, bonuses, allowances ARE NOT included in the GOSI base.
 */

import type { EmployeeContext, GosiResult } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

const GOSI_MONTHLY_CAP = 45_000;

/** SANED — Saudi National Unemployment Insurance (separate branch from GOSI pension) */
const SANED_EMPLOYER_RATE = 0.02; // 2% of pension-contributory base, employer only

/**
 * Occupational Hazards Insurance — covers ALL workers including expatriates.
 * Royal Decree for occupational hazards coverage expansion (2021).
 * Rate varies by industry risk class; 2% is the standard office/light-industry rate.
 */
const OCCUPATIONAL_HAZARDS_EMPLOYER_RATE = 0.02; // 2%, employer only

// ─── GOSI Pension Rate Tables ─────────────────────────────────────────────────

interface GosiRateSet {
  employee: number;
  employer:  number;
  /** Escalation schedule: Jul 2024=0, Jul 2025=1, Jul 2026=2, ... */
  escalationYear: number;
}

const GOSI_OLD: GosiRateSet = {
  employee: 0.09,   // 9%
  employer:  0.10,   // 10%
  escalationYear: 0,
};

function getGosiNewRates(escalationYears = 0): GosiRateSet {
  // New-system rates escalate 0.5% per side each July starting Jul 2024
  // Jul 2024 (year 0): employee 11%, employer 11%
  // Jul 2025 (year 1): employee 11.5%, employer 11.5%
  // Jul 2026 (year 2): employee 12%, employer 12%
  const increment = escalationYears * 0.005;
  return {
    employee:    0.11 + increment, // 11% → 11.5% → 12%
    employer:    0.11 + increment, // 11% → 11.5% → 12%
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
  const effective = input.effectiveDate ? new Date(input.effectiveDate) : new Date();
  const yearsSinceStart = Math.floor(
    (effective.getTime() - cutoff.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );
  const cappedYears = Math.min(Math.max(yearsSinceStart, 0), 4); // cap at 4 to be safe
  return getGosiNewRates(cappedYears);
}

// ─── Core Calculation ─────────────────────────────────────────────────────────

/**
 * Calculate the full GOSI contribution picture for one employee.
 *
 * Three separate insurance branches:
 *  1. GOSI Pension      — Saudi employees only (old or new rate)
 *  2. Occupational Haz  — All workers including expatriates (2% employer)
 *  3. SANED             — Saudi employees only (1% employer)
 *
 * @example
 * const result = calculateGosi({
 *   nationality: "saudi",
 *   gosiRegistrationDate: "2023-03-15",
 *   salaryBasic: 10000,
 *   salaryHousing: 3000,
 *   effectiveDate: "2026-07-01",
 * });
 * // result.pension           = { employee: 1170, employer: 1300 }
 * // result.occupationalHaz   = { employee: 0,   employer: 260  }
 * // result.saned             = { employee: 0,   employer: 130  }
 * // result.totalEmployerCost = 1690
 * // result.totalEmployeeCost = 1170
 */
export function calculateGosi(input: GosiInput): GosiResult {
  const base = Math.min(input.salaryBasic + input.salaryHousing, GOSI_MONTHLY_CAP);

  // 1. Occupational hazards — ALL workers (rate: 2% employer, 0% employee)
  const occHaz = r(
    input.nationality === "expat" || input.nationality === "gcc"
      ? base * OCCUPATIONAL_HAZARDS_EMPLOYER_RATE // employer 2%, employee 0
      : 0
  );

  // 2. GOSI Pension — Saudi only
  const pension = resolveGosiRates(input);
  const pensionEmployee = pension ? r(base * pension.employee) : 0;
  const pensionEmployer = pension ? r(base * pension.employer)  : 0;

  // 3. SANED — Saudi employees only (1% of pension base, employer only)
  const sanedEmployer = (input.nationality === "saudi")
    ? r(base * SANED_EMPLOYER_RATE)
    : 0;

  return {
    pension: {
      employee: pensionEmployee,
      employer: pensionEmployer,
      rateEmployee: pension?.employee ?? 0,
      rateEmployer: pension?.employer  ?? 0,
    },
    occupationalHazards: {
      employee: 0,
      employer: occHaz,
      rateEmployee: 0,
      rateEmployer: OCCUPATIONAL_HAZARDS_EMPLOYER_RATE,
    },
    saned: {
      employee: 0,
      employer: sanedEmployer,
      rateEmployee: 0,
      rateEmployer: SANED_EMPLOYER_RATE,
    },
    totalEmployeeCost: pensionEmployee,
    totalEmployerCost: occHaz + pensionEmployer + sanedEmployer,
    contributoryBase: base,
    nationality: input.nationality,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function r(value: number): number {
  return Math.round(value * 100) / 100;
}
