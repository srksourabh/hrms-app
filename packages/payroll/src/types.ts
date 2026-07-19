// ─── Employee Context ──────────────────────────────────────────────────────────

export type Nationality        = "saudi" | "expat";
export type GosiSystem        = "old"   | "new";
export type NationalityCategory = "saudi" | "gcc" | "expat";
export type InsuranceRegime   = "old"   | "new";

export interface EmployeeContext {
  id:                   string;
  fullName:             string;
  nationality:          Nationality;
  /** GCC nationals are treated separately for GOSI purposes (reciprocity) */
  gccStatus?:          boolean;
  gosiSystem:          GosiSystem | null;
  salaryBasic:         number;
  salaryHousing:       number;
  salaryTransport:     number;
  hireDate:            string;
  employmentStatus:     string;
  bankIbanEnc:         string | null;
  gosiRegistrationDate: string | null;
  // Immigration fields (P0-6)
  passportExpiry?:      string | null;
  iqamaExpiry?:        string | null;
  exitReentryExpiry?:  string | null;
  visaType?:           string | null;
  occupationCode?:     string | null;
  skillLevel?:         string | null;
  immigrationStatus?:  string | null;
}

// ─── GOSI Result ─────────────────────────────────────────────────────────────

/** Individual contribution line (employee or employer side) */
export interface GosiContributionLine {
  employee: number;
  employer:  number;
  rateEmployee: number;
  rateEmployer: number;
}

/** Full GOSI breakdown by insurance branch */
export interface GosiResult {
  /** Saudi pension: old or new-system GOSI pension contribution */
  pension:            GosiContributionLine;
  /** Occupational Hazards — all workers including expatriates */
  occupationalHazards: GosiContributionLine;
  /** SANED (unemployment insurance) — Saudi employees only */
  saned:              GosiContributionLine;
  /** Total deducted from employee salary (pension only for Saudi) */
  totalEmployeeCost:   number;
  /** Total employer liability per month (pension + occ.haz + SANED) */
  totalEmployerCost:   number;
  /** The salary base used for GOSI calculation (basic+housing, capped at 45,000) */
  contributoryBase:    number;
  nationality:         NationalityCategory;
}

// ─── Payslip ─────────────────────────────────────────────────────────────────

export interface PayslipCalculation {
  employeeId:    string;
  basic:         number;
  housing:       number;
  transport:     number;
  overtime:      number;
  gosiEmployee: number;   // pension employee deduction only
  gosiEmployer: number;   // pension + occ.haz + saned
  deductions:   number;
  netPay:       number;
}

// ─── Compliance ──────────────────────────────────────────────────────────────

export type   CheckSeverity = "passed" | "flagged" | "blocked";

export interface ComplianceResult {
  checkType:      string;
  status:         CheckSeverity;
  flaggedIssues:  string[];
}

// ─── Overtime ────────────────────────────────────────────────────────────────

export type OvertimeDayType = "ordinary" | "rest_day" | "public_holiday" | "ramadan";

export interface OvertimeHours {
  ordinary:     number;  // weekday overtime hours
  restDay:      number;  // rest day overtime hours
  holiday:      number;  // public holiday overtime hours
  ramadanDay:   number;  // Ramadan weekday overtime (reduced premium)
}

export interface OvertimeRates {
  ordinary:     number;  // multiplier, e.g. 1.5
  restDay:      number;  // multiplier, e.g. 1.5
  holiday:      number;  // multiplier, e.g. 2.0
  ramadanDay:   number;  // multiplier, e.g. 1.5 (day) — night hours handled separately
}

/** Saudi Labour Law overtime rules (Article 107 / Executive Regulations):
 *  - Ordinary day: +50% (1.5×)
 *  - Rest/Friday: +50% of ordinary rate (so 1.5× the hourly wage for hours worked)
 *  - Public holiday: +50% (1.5×) PLUS a substitute rest day
 *  - Ramadan daytime: same premium but specific hour-of-day rules apply
 *  - Ceiling: max 12 hours/day of work, max 60 hours/week of overtime
 *  - Night work (10pm–6am) gets additional premium — handled separately
 */
export const SAUDI_OVERTIME_RATES: OvertimeRates = {
  ordinary:   1.5,
  restDay:    1.5,
  holiday:    1.5,
  ramadanDay: 1.5,
};

export const OVERTIME_DAILY_CEIL  = 12; // hours
export const OVERTIME_WEEKLY_CEIL = 60; // hours

export interface OvertimeCalculation {
  hours:      OvertimeHours;
  amounts:    OvertimeHours;
  violations: OvertimeViolation[];
  totalAmount: number;
  /** Night work premium amount (10pm–6am additional) */
  nightAmount?: number;
}

export type OvertimeViolationType =
  | "daily_exceeded"
  | "weekly_exceeded"
  | "rest_day_overtime_unpaid"
  | "ramadan_night_hours_missing";

export interface OvertimeViolation {
  type:    OvertimeViolationType;
  message: string;
  detail?: string;
}

// ─── Final Settlement ─────────────────────────────────────────────────────────

export type SeparationReason =
  | "resignation"
  | "termination"            // employer termination WITHOUT cause — full EOSB (Art 84)
  | "termination_for_cause"  // Article 80 dismissal for cause — zero EOSB + documented investigation
  | "end_of_contract"
  | "mutual_termination"
  | "force_majeure"
  | "death"
  | "employer_fault"; // Article 81 — employer breach; full EOSB + no notice

/** Saudi Labour Law EOSB eligibility and calculation inputs */
export interface FinalSettlementInput {
  hireDate:           string;
  terminationDate:    string;
  basicSalary:        number;
  housingAllowance:   number;
  transportAllowance: number;
  separationReason:   SeparationReason;
  /** Whether the employee completed the probation period */
  completedProbation: boolean;
  /**
   * Full-award override (Article 87 / Article 81).
   * Set true when the employee qualifies for full EOSB regardless of resignation tier:
   *   - Female resigning within 6 months of marriage
   *   - Female resigning within 3 months of childbirth
   *   - Force majeure
   *   - Employer-fault termination (Article 81)
   */
  fullAwardOverride?: boolean;
}

export interface FinalSettlementResult {
  /** End-of-service benefit (EOSB) amount in SAR */
  eosbAmount:               number;
  /** Per Saudi law: resignation < 2 years → 0; 2-5yr → 1/3; 5-10yr → 2/3; 10yr+ → full */
  eosbResignationFraction:   number;
  /** Component breakdown for audit trail */
  components: {
    yearsOfService:   number;
    dailyWage:        number;
    halfSalaryPerYear: number;
    totalYearsCalculated: number;
    eosbFraction:     number;
  };
  /** Warnings — e.g. partial year not yet assessed, Article 80 investigation pending */
  warnings: string[];
  /** Whether the calculation requires HR review before finalisation */
  requiresHrReview: boolean;
}
