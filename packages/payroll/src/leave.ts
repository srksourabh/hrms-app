/**
 * Saudi Statutory Leave Engine
 *
 * Implements all Saudi Labour Law leave entitlements:
 *  - Annual leave  (Article 111: 21 days/yr up to 5 years of service,
 *                   30 days/yr after 5 years — tenure-based, all nationalities)
 *  - Sick leave    (Article 131/134: 3-tier: full-pay / half-pay / unpaid)
 *  - Maternity     (Article 54: 10 weeks paid)
 *  - Hajj pilgrimage (Article 113: 10 days paid, 12 months service)
 *  - Marriage / Bereavement (Article 113)
 *  - Exam / Professional development
 *  - Nursing breaks (Article 151)
 *  - Unpaid exceptional leave (suspension, special circumstances)
 *
 * ⚠️  All date arithmetic uses calendar days (not business days).
 *     Weekends and public holidays are NOT subtracted from leave day counts
 *     unless explicitly stated (Hajj: 10 calendar days).
 *
 * ⚠️  Annual leave is tenure-based (21 → 30 after 5 years) for all employees;
 *     nationality only affects specific programmes (e.g. Hajj, GOSI).
 *
 * Usage:
 *   const leave = new SaudiLeaveEngine(employee, "2026-07-15");
 *   leave.entitlements().annual.days;          // 30 after 5 years, else 21
 *   leave.compute("annual", { start: "2026-08-01", end: "2026-08-10" }); // 10 days
 */

import { getLeaveEntitlement } from "./regulatory-config";
import type { NationalityCategory } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LeaveType =
  | "annual"
  | "sick_full_pay"
  | "sick_half_pay"
  | "sick_unpaid"
  | "maternity"
  | "hajj"
  | "marriage"
  | "bereavement"
  | "exam"
  | "nursing"
  | "unpaid_exceptional";

export type LeaveStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "in_review";

export interface LeaveRequest {
  employeeId: string;
  type: LeaveType;
  startDate: string;   // ISO date "YYYY-MM-DD"
  endDate: string;     // ISO date "YYYY-MM-DD"
  /** Number of working days (calendar days if not provided) */
  daysRequested?: number;
  reason?: string;
  /** For sick leave: which tier is being invoked */
  sickTier?: "full" | "half" | "unpaid";
}

export interface LeaveEntitlementSummary {
  type: LeaveType;
  daysPerYear: number;
  daysUsed: number;
  daysPending: number;
  daysRemaining: number;
  carriedOver: number;
  canEncash: boolean;
  /** ISO date when this entitlement resets */
  yearEnd: string;
}

export interface LeaveBalance {
  entitlements: LeaveEntitlementSummary[];
  /** Total encashment available in SAR (annual leave only) */
  encashmentAvailable: number;
  encashmentRate: number;  // daily wage used for encashment calc
}

export interface LeavePeriod {
  startDate: string;
  endDate: string;
  calendarDays: number;
  workingDays: number;
  /** For encashment: number of days being encashed (annual leave only) */
  encashmentDays?: number;
}

export interface LeaveCalculation {
  request: LeaveRequest;
  period: LeavePeriod;
  grossPay: number;         // salary component for this leave period
  paidDays: number;         // days paid at full/normal rate
  unpaidDays: number;       // days unpaid (sick tier 3, unpaid exceptional)
  leaveAllowance: number;   // e.g. maternity allowance, hajj allowance
  totalPayable: number;
  warnings: string[];
  requiresHrReview: boolean;
}

// ─── SaudiLeaveEngine ─────────────────────────────────────────────────────────

export class SaudiLeaveEngine {
  private employee: {
    id: string;
    nationality: NationalityCategory;
    hireDate: string;
    salaryBasic: number;
    salaryHousing: number;
    salaryTransport: number;
  };
  private asOfDate: string;
  private cfg: ReturnType<typeof getLeaveEntitlement>;
  private yearStart: string;
  private yearEnd: string;

  constructor(
    employee: SaudiLeaveEngine["employee"],
    asOfDate: string = new Date().toISOString().split("T")[0] as string
  ) {
    this.employee = employee;
    this.asOfDate = asOfDate;
    const cfg = getLeaveEntitlement(employee.nationality, asOfDate);
    if (!cfg) throw new Error(`No leave config for nationality ${employee.nationality} on ${asOfDate}`);
    this.cfg = cfg;

    // Leave year is the calendar year of asOfDate (Jan 1 – Dec 31)
    const year = asOfDate.substring(0, 4);
    this.yearStart = `${year}-01-01`;
    this.yearEnd   = `${year}-12-31`;
  }

  // ─── Entitlements ─────────────────────────────────────────────────────────

  /**
   * Full entitlements summary for all leave types.
   * `daysUsed` and `daysPending` must be injected from leave records in the DB.
   */
  entitlements(usedDays: Partial<Record<LeaveType, { used: number; pending: number }>> = {}): LeaveEntitlementSummary[] {
    // Article 111: annual leave is TENURE-based, not nationality-based —
    // 21 days/yr up to 5 years of service, 30 days/yr after 5 years, for every
    // employee. (`saudiAdditionalDays` here is the +9 tenure bonus, not a
    // citizen bonus.)
    const annualDays =
      this.yearsOfService() > 5
        ? this.cfg.annual.annualDays + this.cfg.annual.saudiAdditionalDays
        : this.cfg.annual.annualDays;

    return [
      {
        type: "annual",
        daysPerYear: annualDays,
        daysUsed: usedDays.annual?.used ?? 0,
        daysPending: usedDays.annual?.pending ?? 0,
        daysRemaining: annualDays - (usedDays.annual?.used ?? 0) - (usedDays.annual?.pending ?? 0),
        carriedOver: 0,
        canEncash: this.cfg.annual.encashmentAllowed,
        yearEnd: this.yearEnd ?? '',
      },
      {
        type: "sick_full_pay",
        daysPerYear: this.cfg.sick.fullPayDays,
        daysUsed: usedDays.sick_full_pay?.used ?? 0,
        daysPending: usedDays.sick_full_pay?.pending ?? 0,
        daysRemaining: this.cfg.sick.fullPayDays - (usedDays.sick_full_pay?.used ?? 0),
        carriedOver: 0,
        canEncash: false,
        yearEnd: this.yearEnd ?? '',
      },
      {
        type: "sick_half_pay",
        daysPerYear: this.cfg.sick.halfPayDays,
        daysUsed: usedDays.sick_half_pay?.used ?? 0,
        daysPending: usedDays.sick_half_pay?.pending ?? 0,
        daysRemaining: this.cfg.sick.halfPayDays - (usedDays.sick_half_pay?.used ?? 0),
        carriedOver: 0,
        canEncash: false,
        yearEnd: this.yearEnd ?? '',
      },
      {
        type: "sick_unpaid",
        daysPerYear: this.cfg.sick.unpaidDays,
        daysUsed: usedDays.sick_unpaid?.used ?? 0,
        daysPending: usedDays.sick_unpaid?.pending ?? 0,
        daysRemaining: this.cfg.sick.unpaidDays - (usedDays.sick_unpaid?.used ?? 0),
        carriedOver: 0,
        canEncash: false,
        yearEnd: this.yearEnd ?? '',
      },
      {
        type: "maternity",
        daysPerYear: this.cfg.maternity.weeks * 7,
        daysUsed: usedDays.maternity?.used ?? 0,
        daysPending: usedDays.maternity?.pending ?? 0,
        daysRemaining: this.cfg.maternity.weeks * 7 - (usedDays.maternity?.used ?? 0),
        carriedOver: 0,
        canEncash: false,
        yearEnd: this.yearEnd ?? '',
      },
      {
        type: "hajj",
        daysPerYear: this.cfg.hajj.days,
        daysUsed: usedDays.hajj?.used ?? 0,
        daysPending: usedDays.hajj?.pending ?? 0,
        daysRemaining: this.cfg.hajj.days - (usedDays.hajj?.used ?? 0),
        carriedOver: 0,
        canEncash: false,
        yearEnd: this.yearEnd ?? '',
      },
      {
        type: "marriage",
        daysPerYear: this.cfg.marriage.days,
        daysUsed: usedDays.marriage?.used ?? 0,
        daysPending: usedDays.marriage?.pending ?? 0,
        daysRemaining: this.cfg.marriage.days - (usedDays.marriage?.used ?? 0),
        carriedOver: 0,
        canEncash: false,
        yearEnd: this.yearEnd ?? '',
      },
      {
        type: "bereavement",
        daysPerYear: this.cfg.bereavement.days,
        daysUsed: usedDays.bereavement?.used ?? 0,
        daysPending: usedDays.bereavement?.pending ?? 0,
        daysRemaining: this.cfg.bereavement.days - (usedDays.bereavement?.used ?? 0),
        carriedOver: 0,
        canEncash: false,
        yearEnd: this.yearEnd ?? '',
      },
      {
        type: "exam",
        daysPerYear: this.cfg.exam.daysPerYear,
        daysUsed: usedDays.exam?.used ?? 0,
        daysPending: usedDays.exam?.pending ?? 0,
        daysRemaining: this.cfg.exam.daysPerYear - (usedDays.exam?.used ?? 0),
        carriedOver: 0,
        canEncash: false,
        yearEnd: this.yearEnd ?? '',
      },
      {
        type: "unpaid_exceptional",
        daysPerYear: this.cfg.unpaidExceptional.maxDaysPerYear,
        daysUsed: usedDays.unpaid_exceptional?.used ?? 0,
        daysPending: usedDays.unpaid_exceptional?.pending ?? 0,
        daysRemaining: this.cfg.unpaidExceptional.maxDaysPerYear - (usedDays.unpaid_exceptional?.used ?? 0),
        carriedOver: 0,
        canEncash: false,
        yearEnd: this.yearEnd ?? '',
      },
    ];
  }

  /**
   * Overall leave balance summary.
   */
  balance(
    usedDays: Partial<Record<LeaveType, { used: number; pending: number }>> = {}
  ): LeaveBalance {
    const entitlements = this.entitlements(usedDays);
    const annual = entitlements.find((e) => e.type === "annual")!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    const dailyWage = this.dailyWage();

    return {
      entitlements,
      encashmentAvailable: annual.canEncash ? Math.max(0, annual.daysRemaining) : 0,
      encashmentRate: dailyWage,
    };
  }

  // ─── Computation ──────────────────────────────────────────────────────────

  /**
   * Compute pay and compliance for a leave request.
   * Returns the full breakdown including warnings and HR review flags.
   */
  compute(request: LeaveRequest): LeaveCalculation {
    const period = this.buildPeriod(request);
    const warnings: string[] = [];
    let requiresHrReview = false;

    // Validate the request
    const validation = this.validate(request);
    warnings.push(...validation.warnings);
    if (validation.requiresHrReview) requiresHrReview = true;

    const dailyWage = this.dailyWage();
    const paidDays = period.workingDays;
    let unpaidDays = 0;
    let leaveAllowance = 0;
    let grossPay = 0;

    switch (request.type) {
      case "annual": {
        // Annual leave: full salary continues
        grossPay = dailyWage * period.workingDays;
        // Check encashment if applicable
        if (period.encashmentDays) {
          leaveAllowance = dailyWage * period.encashmentDays;
          grossPay += leaveAllowance;
        }
        break;
      }

      case "sick_full_pay": {
        // Full salary for first 30 days (or the tier limit)
        const maxDays = this.cfg.sick.fullPayDays;
        const taken = Math.min(period.workingDays, maxDays);
        grossPay = dailyWage * taken;
        unpaidDays = period.workingDays - taken;
        if (period.workingDays > maxDays) {
          warnings.push(
            `Sick leave exceeds full-pay tier (${maxDays} days). ` +
            `Excess days will shift to half-pay tier.`
          );
          requiresHrReview = true;
        }
        break;
      }

      case "sick_half_pay": {
        // Half salary for days 31–90 (or tier limit)
        const maxDays = this.cfg.sick.halfPayDays;
        const taken = Math.min(period.workingDays, maxDays);
        grossPay = (dailyWage * taken) / 2;
        unpaidDays = period.workingDays - taken;
        if (period.workingDays > maxDays) {
          warnings.push(
            `Sick leave exceeds half-pay tier (${maxDays} days). ` +
            `Excess days will be unpaid.`
          );
          requiresHrReview = true;
        }
        break;
      }

      case "sick_unpaid": {
        // Unpaid sick leave (days 91+)
        grossPay = 0;
        unpaidDays = period.workingDays;
        warnings.push("Unpaid sick leave. Employment contract continues but no salary is payable.");
        if (period.workingDays > this.cfg.sick.unpaidDays) {
          warnings.push(
            `Unpaid sick leave exceeds statutory maximum (${this.cfg.sick.unpaidDays} days). ` +
            `Prolonged absence may constitute grounds for contract termination under Article 81.`
          );
          requiresHrReview = true;
        }
        break;
      }

      case "maternity": {
        // 10 weeks (70 days) at full pay (Article 54)
        const maxWeeks = this.cfg.maternity.weeks;
        const maxDays = maxWeeks * 7;
        const paidPortion = this.cfg.maternity.paidPortion;
        const taken = Math.min(period.workingDays, maxDays);
        grossPay = dailyWage * taken * paidPortion;
        if (period.workingDays > maxDays) {
          warnings.push(`Maternity leave exceeds statutory maximum (${maxDays} days). Excess is unpaid.`);
        }
        if (this.cfg.maternity.serviceRequired) {
          const tenure = this.yearsOfService();
          if (tenure < 1) {
            warnings.push("Employee has less than 12 months service. Maternity leave eligibility requires HR review.");
            requiresHrReview = true;
          }
        }
        break;
      }

      case "hajj": {
        // 10 days paid (Article 113) — Muslim pilgrimage only
        const maxDays = this.cfg.hajj.days;
        const paidDays = this.cfg.hajj.paid ? Math.min(period.workingDays, maxDays) : 0;
        const paid = this.cfg.hajj.paid ? dailyWage * paidDays : 0;
        grossPay = paid;
        if (period.workingDays > maxDays) {
          warnings.push(`Hajj leave exceeds 10 days. Additional days are annual leave or unpaid.`);
        }
        const tenure = this.yearsOfService();
        if (tenure < this.cfg.hajj.serviceRequiredMonths / 12) {
          warnings.push(
            `Employee has less than ${this.cfg.hajj.serviceRequiredMonths} months service. ` +
            `Hajj leave may require HR approval.`
          );
        }
        break;
      }

      case "marriage": {
        // Employee's own marriage: 3 days paid (Article 113)
        const maxDays = this.cfg.marriage.days;
        const taken = Math.min(period.workingDays, maxDays);
        grossPay = this.cfg.marriage.paid ? dailyWage * taken : 0;
        break;
      }

      case "bereavement": {
        // Immediate family (spouse, children, parents): 5 days paid (Article 113)
        const maxDays = this.cfg.bereavement.days;
        const taken = Math.min(period.workingDays, maxDays);
        grossPay = this.cfg.bereavement.paid ? dailyWage * taken : 0;
        break;
      }

      case "exam": {
        // Professional certification exams: 5 days paid
        const maxDays = this.cfg.exam.daysPerYear;
        const taken = Math.min(period.workingDays, maxDays);
        grossPay = this.cfg.exam.paid ? dailyWage * taken : 0;
        if (period.workingDays > maxDays) {
          warnings.push(`Exam leave exceeds ${maxDays} days/year. Additional days are annual leave.`);
        }
        break;
      }

      case "nursing": {
        // Article 151: nursing mothers entitled to 60-minute breaks per day for 4 weeks post-maternity
        // This is typically taken as 2 × 30-minute breaks per day (paid time)
        const nursingWeeks = this.cfg.maternity.nursingWeeks;
        const nursingMinutes = this.cfg.maternity.nursingBreakMinutes;
        // Compute as hourly proportion
        grossPay = dailyWage * (period.calendarDays / 30) * (nursingMinutes * 2 / 60);
        warnings.push(
          `Nursing breaks: ${nursingMinutes * 2} minutes/day for ${nursingWeeks} weeks. ` +
          `Report to HR to formalise the schedule.`
        );
        break;
      }

      case "unpaid_exceptional": {
        grossPay = 0;
        unpaidDays = period.workingDays;
        if (period.workingDays > this.cfg.unpaidExceptional.maxDaysPerYear) {
          warnings.push(
            `Unpaid exceptional leave exceeds ${this.cfg.unpaidExceptional.maxDaysPerYear} days/year. ` +
            `Extended unpaid leave may trigger contract suspension review.`
          );
          requiresHrReview = true;
        }
        break;
      }
    }

    return {
      request,
      period,
      grossPay,
      paidDays,
      unpaidDays,
      leaveAllowance,
      totalPayable: grossPay,
      warnings,
      requiresHrReview,
    };
  }

  // ─── Validation ────────────────────────────────────────────────────────────

  /**
   * Validate a leave request against statutory rules.
   */
  validate(request: LeaveRequest): { valid: boolean; errors: string[]; warnings: string[]; requiresHrReview: boolean } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let requiresHrReview = false;

    // Date sanity checks
    if (request.endDate < request.startDate) {
      errors.push("End date cannot be before start date.");
    }

    if (request.startDate < this.yearStart) {
      errors.push(`Leave start date cannot be before the current leave year (${this.yearStart}).`);
    }

    // Check tenure for Hajj
    if (request.type === "hajj") {
      const minYears = this.cfg.hajj.serviceRequiredMonths / 12;
      if (this.yearsOfService() < minYears) {
        errors.push(
          `Hajj leave requires ${this.cfg.hajj.serviceRequiredMonths} months of continuous service. ` +
          `Current tenure: ${this.yearsOfService().toFixed(1)} years.`
        );
      }
    }

    // Sick leave: require medical report for > 3 days
    if (request.type.startsWith("sick_")) {
      const calendarDays = this.calendarDays(request.startDate, request.endDate);
      if (calendarDays > 3 && !request.reason?.toLowerCase().includes("medical")) {
        warnings.push(
          "Sick leave exceeding 3 days typically requires a medical report from an approved clinic. " +
          "HR may request documentation before approving."
        );
        requiresHrReview = true;
      }

      if (request.type === "sick_full_pay" && calendarDays > this.cfg.sick.fullPayDays) {
        warnings.push(
          `Full-pay sick leave is limited to ${this.cfg.sick.fullPayDays} days. ` +
          `Days beyond this will be reassessed as half-pay or unpaid.`
        );
      }
    }

    // Annual leave: check carry-over rules
    if (request.type === "annual") {
      const balance = this.balance().entitlements.find((e) => e.type === "annual")!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
      if (balance.daysRemaining < 0) {
        errors.push(
          `Insufficient annual leave balance. Available: ${balance.daysRemaining + (balance.daysUsed + balance.daysPending)} days.`
        );
      }
      // Saudi leave cannot be carried over (Article 109)
      if (this.employee.nationality === "saudi") {
        warnings.push("Saudi national annual leave does not carry over to the next year. Use it or lose it.");
      }
    }

    // Maternity: no work during maternity period
    if (request.type === "maternity") {
      if (this.employee.nationality !== "saudi") {
        warnings.push("Maternity leave entitlement for non-Saudi employees may vary by company policy.");
      }
      // Cannot combine maternity + annual leave back-to-back
      warnings.push("Do not schedule annual leave immediately before or after maternity leave without HR approval.");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      requiresHrReview,
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /** Daily wage = (basic + housing + transport) / 30 */
  dailyWage(): number {
    const { salaryBasic, salaryHousing, salaryTransport } = this.employee;
    return (salaryBasic + salaryHousing + salaryTransport) / 30;
  }

  /** Years of continuous service from hire date to asOfDate (or today) */
  yearsOfService(asOf?: string): number {
    const end = new Date(asOf ?? this.asOfDate);
    const start = new Date(this.employee.hireDate);
    const ms = end.getTime() - start.getTime();
    return ms / (1000 * 60 * 60 * 24 * 365.25);
  }

  /** Calendar days between two dates (inclusive of start, exclusive of end) */
  private calendarDays(start: string, end: string): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return Math.round((e - s) / msPerDay) + 1;
  }

  private buildPeriod(request: LeaveRequest): LeavePeriod {
    const calendarDays = this.calendarDays(request.startDate, request.endDate);
    // Default working days = calendar days (6-day week in Saudi)
    // For simplicity: working days = calendar days (can be refined per actual roster)
    const workingDays = request.daysRequested ?? calendarDays;
    return {
      startDate: request.startDate,
      endDate: request.endDate,
      calendarDays,
      workingDays,
      encashmentDays: request.type === "annual" && request.daysRequested !== undefined
        ? request.daysRequested - calendarDays  // encashment = excess over calendar days
        : undefined,
    };
  }
}

// ─── Convenience exports ───────────────────────────────────────────────────────

/**
 * Quick entitlement lookup without instantiating the class.
 */
export function getLeaveBalance(
  employee: SaudiLeaveEngine["employee"],
  usedDays?: Partial<Record<LeaveType, { used: number; pending: number }>>
): LeaveBalance {
  return new SaudiLeaveEngine(employee).balance(usedDays);
}

/**
 * Quick computation of leave pay without instantiating the class.
 */
export function computeLeave(
  employee: SaudiLeaveEngine["employee"],
  request: LeaveRequest
): LeaveCalculation {
  return new SaudiLeaveEngine(employee).compute(request);
}
