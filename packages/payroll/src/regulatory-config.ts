/**
 * Regulatory Configuration Service
 *
 * Provides versioned, effective-dated statutory rates and rules.
 * Each config entry has an effective_from / effective_to date range,
 * a jurisdiction, and the full set of rates/rules applicable within it.
 *
 * ⚠️  SOURCE OF TRUTH FOR ALL STATUTORY RATES
 *    All payroll/leave/discipline calculations MUST call this service
 *    rather than hard-coding rates. This allows rates to be updated
 *    when regulations change without redeploying code.
 *
 * Usage:
 *   const cfg = getActiveConfig("saudi", "2026-07-15");
 *   cfg.governance.gosi.employee;  // → 0.12  (12% from Jul 2026)
 *
 * Rules:
 *   - If effective_to is null, the config is the current live config
 *   - Configs are immutable once stored (insert-only)
 *   - Use upsertLogic to supersede a config with a new version
 */

import type { NationalityCategory } from "./types";

// ─── Domain Types ──────────────────────────────────────────────────────────────

export interface GosiConfig {
  /** Employee GOSI pension contribution rate (fraction, e.g. 0.12 = 12%) */
  employee: number;
  /** Employer GOSI pension contribution rate */
  employer: number;
  /** SANED (unemployment insurance) employer rate */
  sanedEmployer: number;
  /** Occupational hazards employer rate */
  occHazardsEmployer: number;
  /** Monthly GOSI contributory ceiling (SAR) */
  monthlyCap: number;
  /** Which GOSI regime: "old" (pre-Jul 2024) or "new" (post-Jul 2024) */
  regime: "old" | "new";
}

export interface LeaveEntitlement {
  /** Calendar days per year */
  annualDays: number;
  /** Saudi nationals get additional days */
  saudiAdditionalDays: number;
  /** Unused days that can be carried over (0 = no carry) */
  carryOverMaxDays: number;
  /** Days in the year beyond which annual leave accrual stops (0 = no cap) */
  accrualCeilingDays: number;
  /** Whether encashment of unused leave is permitted */
  encashmentAllowed: boolean;
}

export interface SickLeaveEntitlement {
  /** Full-pay sick days per year */
  fullPayDays: number;
  /** Half-pay sick days per year (after full-pay days exhausted) */
  halfPayDays: number;
  /** Unpaid sick days per year (after half-pay days exhausted) */
  unpaidDays: number;
}

export interface MaternityLeaveEntitlement {
  /** Weeks of maternity leave (12 weeks from Feb 2025 amendments) */
  weeks: number;
  /** % of salary covered (0.0 = unpaid, 1.0 = full pay) */
  paidPortion: number;
  /** Whether employee must have 12 months continuous service */
  serviceRequired: boolean;
  /** Nursing breaks per day (minutes each) */
  nursingBreakMinutes: number;
  /** Weeks of nursing break entitlement after return */
  nursingWeeks: number;
}

export interface PaternityLeaveEntitlement {
  /** Days of paternity leave (3 days from Feb 2025 amendments) */
  days: number;
  /** Whether it is paid */
  paid: boolean;
}

export interface WorkingTimeConfig {
  /** Ordinary hours per day */
  hoursPerDay: number;
  /** Ordinary working days per week */
  daysPerWeek: number;
  /** Friday rest day premium (fraction of hourly wage) */
  fridayPremium: number;
  /** Night differential (10pm–6am) as fraction of hourly wage */
  nightDifferential: number;
  /** Ramadan ordinary hours (reduced by 1 hour per Article 163) */
  ramadanHoursPerDay: number;
  /** Overtime ceiling hours per day */
  otDailyCeil: number;
  /** Overtime ceiling hours per week */
  otWeeklyCeil: number;
}

export interface NitaqatConfig {
  /** Minimum Saudi workforce % for green zone */
  greenMinPercent: number;
  /** Minimum Saudi workforce % for yellow zone */
  yellowMinPercent: number;
  /** Band adjustment factor (applied to activity level thresholds) */
  bandFactor: number;
  /** Quarter of the Nitaqat year (1–4) */
  quarter: number;
  /** Reference date for Qiwa data sync */
  referenceDate: string;
}

export interface DisciplineConfig {
  /** Minimum days between written warning and final warning */
  warningSpacingDays: number;
  /** Maximum cumulative fine as % of monthly salary */
  maxFinePercentOfMonthly: number;
  /** Maximum suspension days per incident */
  maxSuspensionDays: number;
  /** Whether investigation (Article 57) is required before major sanction */
  investigationRequiredForMajor: boolean;
  /** Days employee has to appeal after receiving sanction */
  appealWindowDays: number;
}

export interface EOSBConfig {
  /** Monthly salary fractions per year for employer termination */
  terminationFractions: { minYears: number; maxYears: number; fraction: number }[];
  /** Resignation penalty fractions */
  resignationFractions: { minYears: number; fraction: number }[];
  /** Days probation period */
  probationDays: number;
}

export interface RegulatoryConfig {
  id: string;
  jurisdiction: string;         // "saudi" | "uae" | "kuwait" | etc.
  effectiveFrom: string;         // ISO date string (inclusive)
  effectiveTo: string | null;   // null = currently live
  version: string;
  createdAt: string;
  createdBy: string;

  gosi: GosiConfig;
  leave: {
    annual: LeaveEntitlement;
    sick: SickLeaveEntitlement;
    maternity: MaternityLeaveEntitlement;
    /** Paternity — 3 days (Feb 2025 amendments) */
    paternity: PaternityLeaveEntitlement;
    /** Hajj leave — 10 days paid for Muslim pilgrimage */
    hajj: { days: number; paid: boolean; serviceRequiredMonths: number };
    /** Bereavement — immediate family (3 days from Feb 2025 amendments) */
    bereavement: { days: number; paid: boolean };
    /** Marriage — employee own marriage */
    marriage: { days: number; paid: boolean };
    /** Exam leave for professional certifications */
    exam: { daysPerYear: number; paid: boolean };
    /** Unpaid exceptional leave (suspension, special circumstances) */
    unpaidExceptional: { maxDaysPerYear: number };
  };
  workingTime: WorkingTimeConfig;
  nitaqat: NitaqatConfig;
  discipline: DisciplineConfig;
  eosb: EOSBConfig;
}

// ─── In-Memory Config Store ───────────────────────────────────────────────────
// In production this would be a DB table. For now we seed the Saudi baseline.

const SAUDI_BASELINE_CONFIGS: RegulatoryConfig[] = [
  {
    id: "saudi-2024-v1",
    jurisdiction: "saudi",
    effectiveFrom: "2024-07-01",
    effectiveTo: null,
    version: "2024-v1",
    createdAt: "2024-07-01T00:00:00Z",
    createdBy: "system",
    // ⚠️ NOT AUTHORITATIVE for GOSI amounts. The live two-system, date-driven
    // GOSI engine is `calculateGosi` in ./gosi.ts (used by the orchestrator).
    // This single-rate block cannot represent the existing/new-system split and
    // is retained only for the config-history scaffold; do not compute payroll
    // GOSI from here. See docs/protocol-v3-audit-and-remediation.md (P0-1).
    gosi: {
      employee: 0.11,
      employer: 0.11,
      sanedEmployer: 0.01,
      occHazardsEmployer: 0.02,
      monthlyCap: 45_000,
      regime: "new",
    },
    leave: {
      annual: { annualDays: 21, saudiAdditionalDays: 9, carryOverMaxDays: 0, accrualCeilingDays: 0, encashmentAllowed: true },
      sick: { fullPayDays: 30, halfPayDays: 60, unpaidDays: 30 },
      maternity: { weeks: 12, paidPortion: 1.0, serviceRequired: false, nursingBreakMinutes: 60, nursingWeeks: 4 },
      hajj: { days: 10, paid: true, serviceRequiredMonths: 12 },
      bereavement: { days: 3, paid: true },
      paternity: { days: 3, paid: true },
      marriage: { days: 3, paid: true },
      exam: { daysPerYear: 5, paid: true },
      unpaidExceptional: { maxDaysPerYear: 60 },
    },
    workingTime: {
      hoursPerDay: 8,
      daysPerWeek: 6,
      fridayPremium: 0.5,
      nightDifferential: 0.5,
      ramadanHoursPerDay: 7,
      otDailyCeil: 12,
      otWeeklyCeil: 60,
    },
    nitaqat: {
      greenMinPercent: 0.40,
      yellowMinPercent: 0.20,
      bandFactor: 1.0,
      quarter: 1,
      referenceDate: "2026-04-15",
    },
    discipline: {
      warningSpacingDays: 30,
      maxFinePercentOfMonthly: 0.10,
      maxSuspensionDays: 15,
      investigationRequiredForMajor: true,
      appealWindowDays: 30,
    },
    eosb: {
      terminationFractions: [
        { minYears: 0,  maxYears: 2,  fraction: 0 },
        { minYears: 2,  maxYears: 5,  fraction: 1/3 },
        { minYears: 5,  maxYears: 10, fraction: 2/3 },
        { minYears: 10, maxYears: 999, fraction: 1 },
      ],
      resignationFractions: [
        { minYears: 0,  fraction: 0 },
        { minYears: 2,  fraction: 1/3 },
        { minYears: 5,  fraction: 2/3 },
        { minYears: 10, fraction: 1 },
      ],
      probationDays: 180,
    },
  },
];

// ─── Lookup Service ───────────────────────────────────────────────────────────

const STORE: RegulatoryConfig[] = [...SAUDI_BASELINE_CONFIGS];

/**
 * Returns the active regulatory configuration for a jurisdiction on a given date.
 * Returns null if no config covers that date.
 */
export function getActiveConfig(
  jurisdiction: string,
  asOfDate: string = new Date().toISOString().split("T")[0] as string
): RegulatoryConfig | null {
  const date = new Date(asOfDate);
  return (
    STORE
      .filter(
        (c) =>
          c.jurisdiction === jurisdiction &&
          new Date(c.effectiveFrom) <= date &&
          (c.effectiveTo === null || new Date(c.effectiveTo) >= date)
      )
      .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime())[0] as RegulatoryConfig ?? null
  );
}

/**
 * Supersedes an existing config by closing its effectiveTo date
 * and inserting the new config. Returns the new config.
 */
export function upsertConfig(newConfig: RegulatoryConfig): RegulatoryConfig {
  const existing = STORE.findIndex(
    (c) => c.id === newConfig.id && c.effectiveTo === null
  );
  if (existing !== -1) {
    STORE[existing] = { ...STORE[existing] as RegulatoryConfig, effectiveTo: newConfig.effectiveFrom };
  }
  STORE.push(newConfig);
  return newConfig;
}

/**
 * Returns all configs for a jurisdiction sorted newest-first.
 */
export function getConfigHistory(jurisdiction: string): RegulatoryConfig[] {
  return STORE.filter((c) => c.jurisdiction === jurisdiction).sort(
    (a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
  );
}

// ─── Convenience Accessors ────────────────────────────────────────────────────

export function getGosiRate(
  nationality: NationalityCategory,
  asOfDate?: string
): { employee: number; employer: number; totalEmployer: number } {
  const cfg = getActiveConfig("saudi", asOfDate);
  if (!cfg) throw new Error("No active Saudi regulatory config found");

  if (nationality === "gcc") return { employee: 0, employer: 0, totalEmployer: 0 };

  const gosi = cfg.gosi;
  return {
    employee: gosi.employee,
    employer: gosi.employer,
    totalEmployer: gosi.employer + gosi.sanedEmployer + gosi.occHazardsEmployer,
  };
}

export function getLeaveEntitlement(
  _nationality: NationalityCategory,
  asOfDate?: string
): RegulatoryConfig["leave"] {
  const cfg = getActiveConfig("saudi", asOfDate);
  if (!cfg) throw new Error("No active Saudi regulatory config found");
  // Annual leave is tenure-based (Article 111), not nationality-based. The base
  // is 21 days/yr for everyone; the +`saudiAdditionalDays` (9) tenure bonus for
  // >5 years of service is applied by the leave engine's entitlements(), so it
  // is NOT added here. `_nationality` is retained for API compatibility.
  return cfg.leave;
}
