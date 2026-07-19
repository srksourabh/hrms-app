/**
 * End-of-Service Benefit (EOSB) / Final Settlement Calculation Engine
 *
 * Legal basis: Saudi Labour Law Articles 84, 85, 86, 87, 88, 89, and 90;
 * Executive Regulations Part 7; 2025 amendments.
 *
 * ⚠️  INTERNAL CALCULATION ENGINE
 *    Final settlement amounts must be reviewed by HR and validated against
 *    GOSI records before payment. This engine provides the statutory calculation
 *    baseline; actual payments may be subject to court orders, settlement
 *    agreements, or contractual terms that override the default formula.
 *
 * Saudi Labour Law EOSB Summary (corrected 2026):
 * ┌──────────────────────────────────────────────────────────────┐
 * │ Termination by employer (not for cause):                    │
 * │   EOSB = (0.5 × wage × first 5 yr) + (1.0 × wage × after)  │
 * │   Example: 7 yr @ 17,000 = 42,500 + 34,000 = 76,500        │
 * ├──────────────────────────────────────────────────────────────┤
 * │ Resignation by employee (Article 85):                       │
 * │   < 2 years  → 0% of full EOSB                              │
 * │   2-5 years  → 33.3% of full EOSB                           │
 * │   5-10 years → 66.7% of full EOSB                           │
 * │   10+ years  → 100% of full EOSB                            │
 * ├──────────────────────────────────────────────────────────────┤
 * │ Full award overrides:                                        │
 * │   Art 87 — marriage (<6 mo), childbirth (<3 mo), force majeure│
 * │   Art 81 — employer-fault termination                        │
 * ├──────────────────────────────────────────────────────────────┤
 * │ Zero EOSB:                                                    │
 * │   Art 80 — dismissal for cause ("termination_for_cause";     │
 * │           requires documented Art 57 investigation)          │
 * │   Resignation before completing probation                    │
 * │ (A plain employer "termination" without cause pays FULL EOSB) │
 * └──────────────────────────────────────────────────────────────┘
 *
 * Monthly salary (Actual Wage) = basic + housing + transport
 * Half-month salary = Actual Wage / 2
 */

import type {
  FinalSettlementInput,
  FinalSettlementResult,
} from "./types";

// Backward-compatibility alias so existing callers and tests don't break
export { calculateFinalSettlement as calculateEsb };

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_PER_MONTH_APPROX = 30;
const DAYS_PER_YEAR_APPROX  = 365.25;

/**
 * Resignation penalty fractions (applied to the full termination EOSB amount).
 * Key: minimum completed years of service.
 */
const RESIGNATION_PENALTY_TABLE: { minYears: number; fraction: number }[] = [
  { minYears: 10, fraction: 1.0  },  // 10+ years → no reduction
  { minYears: 5,  fraction: 2 / 3 }, // 5-9 years → 2/3 of EOSB payable
  { minYears: 2,  fraction: 1 / 3 }, // 2-4 years → 1/3 of EOSB payable
  { minYears: 0,  fraction: 0    },  // < 2 years → 0 (also barred by probation)
];

// ─── Core Calculation ──────────────────────────────────────────────────────────

export function calculateFinalSettlement(input: FinalSettlementInput): FinalSettlementResult {
  const { hireDate, terminationDate, basicSalary, housingAllowance, transportAllowance,
    separationReason, completedProbation, fullAwardOverride } = input;

  const totalMonthlySalary = basicSalary + housingAllowance + transportAllowance;
  const halfMonthSalary   = totalMonthlySalary / 2;

  // ── Tenure calculation (years and days) ───────────────────────────────
  const { years, days } = calculateTenure(hireDate, terminationDate);

  const warnings: string[] = [];
  let   requiresHrReview = false;

  // ── Article 84 bar conditions ────────────────────────────────────────
  if (separationReason === "resignation" && !completedProbation) {
    warnings.push("Employee resigned before completing probation — EOSB is legally zero under Article 84.");
    return {
      eosbAmount: 0,
      eosbResignationFraction: 0,
      components: {
        yearsOfService:       round(years, 3),
        dailyWage:            round(totalMonthlySalary / DAYS_PER_MONTH_APPROX, 2),
        halfSalaryPerYear:    halfMonthSalary,
        totalYearsCalculated: round(years, 3),
        eosbFraction:        0,
      },
      warnings,
      requiresHrReview: false,
    };
  }

  // ── Termination for cause (Article 80) ────────────────────────────────
  if (separationReason === "termination_for_cause") {
    warnings.push(
      "Termination for cause claimed — EOSB is zero under Article 80 only if " +
      "a formal investigation (Article 57) has been completed. " +
      "Attach investigation findings before finalising settlement."
    );
    requiresHrReview = true;
    return {
      eosbAmount: 0,
      eosbResignationFraction: 0,
      components: {
        yearsOfService:       round(years, 3),
        dailyWage:            round(totalMonthlySalary / DAYS_PER_MONTH_APPROX, 2),
        halfSalaryPerYear:    halfMonthSalary,
        totalYearsCalculated: round(years, 3),
        eosbFraction:        0,
      },
      warnings,
      requiresHrReview,
    };
  }

  // ── Compute full EOSB using the linear formula ──────────────────────────
  // Article 84: EOSB = 0.5 × wage × first 5 yr + 1.0 × wage × every yr after 5
  const fullEosb = computeFullEosb(years, totalMonthlySalary, halfMonthSalary, warnings);

  // ── Full award overrides (Art 87, Art 81, force majeure, death) ─────────
  const isFullAward =
    fullAwardOverride ||
    separationReason === "force_majeure" ||
    separationReason === "death" ||
    separationReason === "employer_fault";

  if (isFullAward) {
    return {
      eosbAmount:              fullEosb,
      eosbResignationFraction: 1,
      components: {
        yearsOfService:       round(years, 3),
        dailyWage:            round(totalMonthlySalary / DAYS_PER_MONTH_APPROX, 2),
        halfSalaryPerYear:    halfMonthSalary,
        totalYearsCalculated: round(years, 3),
        eosbFraction:        1,
      },
      warnings,
      requiresHrReview: separationReason === "mutual_termination",
    };
  }

  // ── Resignation (employee-initiated) ─────────────────────────────────
  if (separationReason === "resignation") {
    const resignationFraction = lookupFraction(years, RESIGNATION_PENALTY_TABLE);

    if (resignationFraction === 0) {
      warnings.push("Employee has less than 2 years of service — resignation EOSB is zero.");
      return {
        eosbAmount: 0,
        eosbResignationFraction: 0,
        components: {
          yearsOfService:       round(years, 3),
          dailyWage:            round(totalMonthlySalary / DAYS_PER_MONTH_APPROX, 2),
          halfSalaryPerYear:    halfMonthSalary,
          totalYearsCalculated: round(years, 3),
          eosbFraction:        0,
        },
        warnings,
        requiresHrReview: false,
      };
    }

    const payableEosb = round(fullEosb * resignationFraction, 2);
    warnings.push(
      `Resignation: ${resignationFraction < 1 ? `only ${Math.round(resignationFraction * 100)}%` : "100%"} ` +
      `of the full EOSB is payable for ${round(years, 1)} years of service.`
    );
    if (years < 5) requiresHrReview = true;

    return {
      eosbAmount:              payableEosb,
      eosbResignationFraction: resignationFraction,
      components: {
        yearsOfService:       round(years, 3),
        dailyWage:            round(totalMonthlySalary / DAYS_PER_MONTH_APPROX, 2),
        halfSalaryPerYear:    halfMonthSalary,
        totalYearsCalculated: round(years, 3),
        eosbFraction:        resignationFraction,
      },
      warnings,
      requiresHrReview,
    };
  }

  // ── End of contract / termination by employer (no cause) ───────────────
  // Article 84: a no-fault employer termination pays the full EOSB, same as a
  // fixed-term contract reaching its natural end. Article 80 for-cause zero is
  // handled above as a distinct reason ("termination_for_cause").
  if (
    separationReason === "termination" ||
    separationReason === "end_of_contract" ||
    separationReason === "mutual_termination"
  ) {
    if (days > 0 && days < 30) {
      warnings.push(
        `Partial month: ${days} additional days — confirm whether the partial period should be included per the contract.`
      );
      requiresHrReview = true;
    }

    return {
      eosbAmount:              fullEosb,
      eosbResignationFraction: 1,
      components: {
        yearsOfService:       round(years, 3),
        dailyWage:            round(totalMonthlySalary / DAYS_PER_MONTH_APPROX, 2),
        halfSalaryPerYear:    halfMonthSalary,
        totalYearsCalculated: round(years, 3),
        eosbFraction:        1,
      },
      warnings,
      requiresHrReview,
    };
  }

  // Fallback — unknown reason
  warnings.push("Unknown separation reason — please select a reason before calculating.");
  return {
    eosbAmount: 0,
    eosbResignationFraction: 0,
    components: {
      yearsOfService:       round(years, 3),
      dailyWage:            round(totalMonthlySalary / DAYS_PER_MONTH_APPROX, 2),
      halfSalaryPerYear:    halfMonthSalary,
      totalYearsCalculated: round(years, 3),
      eosbFraction:        0,
    },
    warnings,
    requiresHrReview: true,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Compute full EOSB using the correct Saudi Labour Law linear formula:
 *   - First 5 years: 0.5 × wage per year (half-month)
 *   - After 5 years: 1.0 × wage per year (full-month)
 *   - Partial years: proportional
 *
 * This replaces the old bracket-fraction approach which was incorrect.
 */
function computeFullEosb(
  years: number,
  monthlyWage: number,
  halfMonthSalary: number,
  warnings: string[]
): number {
  if (years < 2) {
    warnings.push("Service period under 2 years — EOSB is zero.");
    return 0;
  }

  const firstFive   = Math.min(years, 5);
  const afterFive   = Math.max(0, years - 5);
  const amount      = round(halfMonthSalary * firstFive + monthlyWage * afterFive, 2);

  if (years >= 10) warnings.push("Service period 10+ years — full EOSB applies.");
  return amount;
}

function lookupFraction(years: number, table: { minYears: number; fraction: number }[]): number {
  for (const row of table) {
    if (years >= row.minYears) return row.fraction;
  }
  return 0;
}

function calculateTenure(
  hireDate: string,
  terminationDate: string
): { years: number; days: number; totalDays: number } {
  const hire        = new Date(hireDate);
  const term       = new Date(terminationDate);
  const totalMs    = term.getTime() - hire.getTime();
  const totalDays  = Math.max(0, Math.floor(totalMs / (1000 * 60 * 60 * 24)));
  const years      = totalDays / DAYS_PER_YEAR_APPROX;
  const days       = totalDays % Math.floor(DAYS_PER_YEAR_APPROX);
  return { years, days, totalDays };
}

function round(value: number, decimals = 2): number {
  return Math.round(value * 10 ** decimals) / 10 ** decimals;
}
