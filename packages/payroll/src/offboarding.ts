/**
 * Saudi Termination & Offboarding Engine
 *
 * Implements the full termination legal workflow:
 *  - Notice period calculation (Article 55 / 56)
 *  - Article 80 / 81 grounds verification gates
 *  - EOSB calculation (see eosb.ts — this module handles the workflow, not the math)
 *  - Job-search time entitlement (during notice period)
 *  - Service certificate (Article 52 / 53)
 *  - Immigration repatriation steps (iqama cancellation, exit re-entry)
 *  - Nitaqat reclassification risk assessment
 *
 * ⚠️  This is the workflow orchestrator. For EOSB amounts use eosb.ts directly.
 *
 * Usage:
 *   const offboard = new TerminationWorkflow(employee, "2026-07-15");
 *   offboard.initiate({ reason: "resignation", lastWorkingDay: "2026-08-14" });
 *   offboard.computeNotice();        // notice period in days/weeks
 *   offboard.checkGrounds();        // Article 80 / 81 gate check
 *   offboard.immigrationSteps();    // repatriation checklist
 */

import { calculateFinalSettlement } from "./esb";
import type { SeparationReason } from "./types";
import type { FinalSettlementResult, NationalityCategory } from "./types";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type TerminationInitiator = "employer" | "employee" | "mutual";

export interface TerminationInitiation {
  initiator: TerminationInitiator;
  reason: SeparationReason;
  /** The employee's last working day (before garden leave / notice) */
  lastWorkingDay: string;
  /** ISO date when notice was formally given */
  noticeDate: string;
  /** Whether the contract is for a fixed term (definite) or open-ended (indefinite) */
  contractType: "definite" | "indefinite";
  /** Whether Article 80 / 81 gross misconduct is alleged (for dismissal) */
  allegedGrossMisconduct: boolean;
  /** HR notes */
  notes?: string;
}

export interface NoticePeriod {
  weeks: number;
  days: number;
  /** Total calendar days */
  totalDays: number;
  /** Whether garden leave applies (Saudi law: employer may place employee on garden leave) */
  gardenLeave: boolean;
  /** Salary in lieu of notice (if contract is definite term) */
  salaryInLieu?: number;
  /** Job-search hours per week entitlement (for definite-term contracts) */
  jobSearchHoursPerWeek: number;
}

export interface GroundsCheck {
  article: "80" | "81" | "none";
  mandatory: boolean;
  grounds: string;
  /** Is the evidence sufficient to support the alleged grounds? */
  evidenceSufficient: boolean;
  /** Is the investigation complete (Article 57 required for Article 80/81)? */
  investigationComplete: boolean;
  gaps: string[];  // compliance gaps that must be resolved before termination
  /** Whether HR review and legal sign-off is required */
  requiresLegalReview: boolean;
}

export interface ImmigrationRepatriationStep {
  step: string;
  deadline: string | null;
  responsibleParty: "employer" | "employee" | "both" | "government";
  requiredDocument: string | null;
  /** SAR cost (if any) payable by employer */
  employerCost?: number;
  notes: string;
}

export interface ServiceCertificate {
  employeeName: string;
  nationalId: string;
  dateOfJoining: string;
  dateOfTermination: string;
  lastPosition: string;
  lastDepartment: string;
  totalService: string;     // e.g. "3 years, 4 months"
  annualSalary: string;    // last drawn total compensation
  currency: string;
  /** Whether EOSB was paid */
  eosbPaid: boolean;
  eosbAmount?: number;
  reasonForLeaving: string;
  /** Whether the employee is free from all obligations to the employer */
  clearanceStatus: "cleared" | "pending";
  employerSignatureDate: string;
  employeeSignatureDate?: string;
}

export interface NitaqatImpact {
  /** Will the termination cause Nitaqat reclassification? */
  reclassificationRisk: "none" | "yellow_risk" | "red_risk";
  /** New expected Saudi % after replacement hired */
  newSaudiPercent: number | null;
  /** Days remaining to recruit replacement before yellow zone triggered */
  daysToRecruit: number | null;
  /** Quarterly Nitaqat filing deadline */
  filingQuarter: string;
}

export interface OffboardingChecklist {
  notice: NoticePeriod;
  grounds: GroundsCheck;
  eosb: FinalSettlementResult;
  immigrationSteps: ImmigrationRepatriationStep[];
  serviceCertificate: ServiceCertificate;
  nitaqat: NitaqatImpact;
  /** Steps that are overdue (past deadline) */
  overdueSteps: string[];
  /** HR actions required before final clearance */
  hrActionsRequired: string[];
  /** Steps blocked pending investigation / legal review */
  blockedSteps: string[];
}

// ─── Termination Workflow ───────────────────────────────────────────────────────

export class TerminationWorkflow {
  private employee: {
    id: string;
    fullName: string;
    nationality: NationalityCategory;
    hireDate: string;
    terminationDate: string;
    salaryBasic: number;
    salaryHousing: number;
    salaryTransport: number;
    completedProbation: boolean;
    contractType: "definite" | "indefinite";
    iqamaExpiry?: string | null;
    passportExpiry?: string | null;
    exitReentryExpiry?: string | null;
  };

  private initiation: TerminationInitiation;
  private asOfDate: string;

  constructor(
    employee: TerminationWorkflow["employee"],
    initiation: TerminationInitiation,
    asOfDate: string = new Date().toISOString().split("T")[0] as string
  ) {
    this.employee = employee;
    this.initiation = initiation;
    this.asOfDate = asOfDate;
  }

  // ─── Notice Period ─────────────────────────────────────────────────────────

  /**
   * Article 75 (as amended Feb 2025) — asymmetric notice for indefinite contracts:
   *   - Employee resigns: 30 days' notice
   *   - Employer terminates: 60 days' notice
   *
   * Article 56 (definite/fixed-term): notice or salary in lieu.
   *
   * During the notice period the employee is entitled to:
   *  - Full salary and benefits
   *  - 4 hours per week (or 1 day per week) off to search for new employment
   *  - Employer may place employee on garden leave (unworked notice period)
   */
  computeNotice(): NoticePeriod {
    const { contractType, reason, initiator } = this.initiation;

    // Asymmetric notice: 30 days (employee) / 60 days (employer) for indefinite
    // Definite-term: 30 days standard
    let baseDays: number;
    if (contractType === "definite") {
      baseDays = 30;
    } else {
      baseDays = initiator === "employee" ? 30 : 60;
    }

    const gardenLeave = initiator === "employer";

    // Job-search entitlement: 4 hours per week (definite-term)
    const jobSearchHours = contractType === "definite" ? 4 : 0;

    // Salary in lieu for definite-term contracts
    let salaryInLieu: number | undefined;
    if (contractType === "definite" && reason !== "death" && reason !== "force_majeure") {
      salaryInLieu = (this.employee.salaryBasic + this.employee.salaryHousing + this.employee.salaryTransport);
    }

    return {
      weeks: Math.floor(baseDays / 7),
      days: baseDays,
      totalDays: baseDays,
      gardenLeave,
      salaryInLieu,
      jobSearchHoursPerWeek: jobSearchHours ?? 0,
    };
  }

  // ─── Article 80 / 81 Grounds Verification ──────────────────────────────────

  /**
   * Before any dismissal, verify that:
   *  1. The alleged grounds fall under Article 80 or 81
   *  2. Evidence is documented and sufficient
   *  3. Investigation (Article 57) has been completed (for Article 80/81)
   *  4. Employee has been given right to defence
   *
   * This is a legal gate — no dismissal should proceed if this check fails.
   */
  checkGrounds(
    evidence: string[] = [],
    investigationComplete = false,
    employeeHadRightToDefence = false
  ): GroundsCheck {
    const { reason, allegedGrossMisconduct } = this.initiation;

    // Death or force majeure: no grounds check needed
    if (reason === "death" || reason === "force_majeure") {
      return {
        article: "none",
        mandatory: false,
        grounds: "Death or force majeure — no misconduct alleged",
        evidenceSufficient: true,
        investigationComplete: true,
        gaps: [],
        requiresLegalReview: false,
      };
    }

    // Resignation (employee-initiated): no grounds check needed
    if (reason === "resignation") {
      return {
        article: "none",
        mandatory: false,
        grounds: "Employee-initiated resignation — no misconduct alleged",
        evidenceSufficient: true,
        investigationComplete: true,
        gaps: [],
        requiresLegalReview: false,
      };
    }

    // Mutual termination: agreed settlement, but must verify EOSB was paid
    if (reason === "mutual_termination") {
      const gaps: string[] = [];
      if (evidence.length === 0) gaps.push("Mutual termination must have a signed settlement agreement.");
      return {
        article: "none",
        mandatory: false,
        grounds: "Mutual agreement — settlement agreement required",
        evidenceSufficient: evidence.length > 0,
        investigationComplete: true,
        gaps,
        requiresLegalReview: evidence.length === 0,
      };
    }

    // End of contract (definite term): no misconduct, contract simply expired
    if (reason === "end_of_contract") {
      return {
        article: "none",
        mandatory: false,
        grounds: "Fixed-term contract expired — no misconduct alleged",
        evidenceSufficient: true,
        investigationComplete: true,
        gaps: [],
        requiresLegalReview: false,
      };
    }

    // Employer termination WITHOUT cause: no Article 80/81 grounds needed;
    // full EOSB is due (the for-cause path is "termination_for_cause").
    if (reason === "termination") {
      return {
        article: "none",
        mandatory: false,
        grounds: "Employer termination without cause — full EOSB due, no misconduct alleged",
        evidenceSufficient: true,
        investigationComplete: true,
        gaps: [],
        requiresLegalReview: false,
      };
    }

    // Employer-initiated for cause: Article 80 or 81 ("termination_for_cause"
    // or "employer_fault")
    const isArticle81 = allegedGrossMisconduct;
    const article = isArticle81 ? "81" : "80";

    const gaps: string[] = [];

    // Article 57 investigation must be complete for Article 80/81
    if (!investigationComplete) {
      gaps.push(
        "Article 57 requires a formal investigation to be concluded before dismissal. " +
        "Investigation must document: charges, employee's defence, evidence, witness statements, conclusion."
      );
    }

    if (!employeeHadRightToDefence) {
      gaps.push(
        "Employee must be given written notice of the charges and a reasonable opportunity to defend themselves " +
        "(minimum 5 days from notification to defence submission)."
      );
    }

    if (evidence.length === 0) {
      gaps.push(`No evidence on file for ${article} dismissal. At minimum: written charges, defence response, investigation report.`);
    }

    return {
      article,
      mandatory: isArticle81,
      grounds: isArticle81
        ? "Article 81 — gross misconduct (theft, assault, fraud, habitual absence, etc.)"
        : "Article 80 — conduct making employee unsuitable for continued employment",
      evidenceSufficient: evidence.length > 0 && investigationComplete && employeeHadRightToDefence,
      investigationComplete,
      gaps,
      requiresLegalReview: gaps.length > 0 || !investigationComplete,
    };
  }

  // ─── EOSB Calculation ──────────────────────────────────────────────────────

  /**
   * Compute end-of-service benefit.
   * Delegates to eosb.ts — this method wraps it with the correct inputs.
   */
  computeEOSB(): FinalSettlementResult {
    return calculateFinalSettlement({
      hireDate: this.employee.hireDate,
      terminationDate: this.initiation.lastWorkingDay,
      basicSalary: this.employee.salaryBasic,
      housingAllowance: this.employee.salaryHousing,
      transportAllowance: this.employee.salaryTransport,
      separationReason: this.initiation.reason,
      completedProbation: this.employee.completedProbation,
    });
  }

  // ─── Immigration Repatriation ───────────────────────────────────────────────

  /**
   * For expatriate employees, the employer must complete these steps
   * within the specified deadlines to avoid overstay fines and iqama violations.
   *
   * Key deadlines:
   *  - Iqama cancellation: within 30 days of last working day
   *  - Exit re-entry: within 30 days of termination (for immediate departure)
   *  - Final exit: within 60 days (if employee does not transfer to new employer)
   */
  immigrationSteps(): ImmigrationRepatriationStep[] {
    if (this.employee.nationality === "saudi" || this.employee.nationality === "gcc") {
      return [];  // No immigration steps for Saudi / GCC nationals
    }

    const steps: ImmigrationRepatriationStep[] = [];
    const { lastWorkingDay } = this.initiation;

    // Step 1: Cancel work permit / iqama transfer or cancellation
    steps.push({
      step: "Cancel work permit (iqama) or initiate transfer",
      deadline: this.addDays(lastWorkingDay, 30),
      responsibleParty: "employer",
      requiredDocument: "Termination letter, final settlement receipt",
      notes: "Employer must cancel or initiate iqama transfer within 30 days of last working day. " +
             "Failure: SAR 100/day overstay fine from day 31.",
    });

    // Step 2: Exit re-entry validation
    steps.push({
      step: "Validate exit-reentry visa status",
      deadline: this.addDays(lastWorkingDay, 7),
      responsibleParty: "both",
      requiredDocument: "Passport, iqama, termination letter",
      notes: "Check if exit-reentry visa is still valid. If employee has a valid exit-reentry, " +
             "they may depart within the visa validity period. Employer must not block exit.",
    });

    // Step 3: Final exit (if not transferring)
    steps.push({
      step: "Coordinate final exit from Saudi Arabia",
      deadline: this.addDays(lastWorkingDay, 60),
      responsibleParty: "both",
      requiredDocument: "Final exit stamp, passport",
      notes: "Employee has 60 days grace period to either transfer to a new employer or obtain final exit. " +
             "Employer must issue no-objection certificate for transfer. Muqeem / Qiwa portal update required.",
      employerCost: 0,
    });

    // Step 4: Final salary / settlement
    steps.push({
      step: "Transfer final salary + EOSB to employee bank account",
      deadline: this.addDays(lastWorkingDay, 7),
      responsibleParty: "employer",
      requiredDocument: "Bank transfer receipt",
      notes: "Final salary must be transferred within 7 days of last working day (Article 52). " +
             "EOSB must be paid on or before final day. Bank transfer is the preferred method — cash not permitted.",
      employerCost: this.computeEOSB().eosbAmount,
    });

    // Step 5: Qiwa portal update
    steps.push({
      step: "Update Qiwa and Muqeem records (Nitaqat + immigration)",
      deadline: this.addDays(lastWorkingDay, 30),
      responsibleParty: "employer",
      requiredDocument: "Termination letter, Qiwa login, EOSB payment proof",
      notes: "Employer must update employment status in Qiwa within 30 days. " +
             "This updates Nitaqat roster and releases the iqama for cancellation/transfer. " +
             "Failure to update Qiwa blocks future visa issuance for the company.",
    });

    // Step 6: GOSI de-registration
    steps.push({
      step: "De-register from GOSI pension scheme",
      deadline: this.addDays(lastWorkingDay, 30),
      responsibleParty: "employer",
      requiredDocument: "GOSI portal access, employee ID",
      notes: "Employer must notify GOSI of termination within 30 days. " +
             "GOSI will calculate the employee's accumulated pension entitlement. " +
             "If moving to a new employer: initiate GOSI transfer, not de-registration.",
    });

    return steps;
  }

  // ─── Service Certificate ────────────────────────────────────────────────────

  /**
   * Article 52 / 53: Employer must provide a service certificate
   * (experience letter) on termination, free of charge.
   * The certificate must state:
   *   - Nature of work performed
   *   - Duration of employment
   *   - Last salary and position
   *
   * This generates the data structure — the actual PDF is generated separately.
   */
  generateServiceCertificate(): ServiceCertificate {
    const eosb = this.computeEOSB();
    const totalServiceDays = this.daysBetween(this.employee.hireDate, this.initiation.lastWorkingDay);
    const years = Math.floor(totalServiceDays / 365.25);
    const months = Math.floor((totalServiceDays % 365.25) / 30.44);
    const totalService = `${years} year${years !== 1 ? "s" : ""}, ${months} month${months !== 1 ? "s" : ""}`;

    return {
      employeeName: this.employee.fullName,
      nationalId: "",  // Populated from employee record
      dateOfJoining: this.employee.hireDate,
      dateOfTermination: this.initiation.lastWorkingDay,
      lastPosition: "",  // Populated from employee record
      lastDepartment: "", // Populated from employee record
      totalService,
      annualSalary: String(this.employee.salaryBasic * 12),
      currency: "SAR",
      eosbPaid: eosb.eosbAmount === 0 || eosb.eosbAmount > 0,
      eosbAmount: eosb.eosbAmount,
      reasonForLeaving: this.reasonLabel(this.initiation.reason),
      clearanceStatus: "cleared",  // Set to "pending" if there are outstanding obligations
      employerSignatureDate: this.initiation.lastWorkingDay,
    };
  }

  // ─── Nitaqat Impact ─────────────────────────────────────────────────────────

  /**
   * Assess whether the termination will cause Nitaqat reclassification.
   * Used by HR to plan replacement hiring.
   */
  nitaqatImpact(currentSaudiPercent: number, totalEmployees: number, saudiCount: number): NitaqatImpact {
    const newSaudiCount = Math.max(0, saudiCount - 1);
    const newSaudiPercent = totalEmployees > 1
      ? newSaudiCount / (totalEmployees - 1)
      : 0;

    // Green zone: ≥ 40% Saudi, Yellow: 20–40%, Red: < 20%
    const greenThreshold = 0.40;
    const yellowThreshold = 0.20;

    let reclassificationRisk: NitaqatImpact["reclassificationRisk"] = "none";
    let daysToRecruit: number | null = null;

    if (currentSaudiPercent >= greenThreshold && newSaudiPercent < greenThreshold) {
      reclassificationRisk = newSaudiPercent < yellowThreshold ? "red_risk" : "yellow_risk";
      // Employer has until the next Nitaqat quarter to fill the gap
      // Approximate: 90 days to recruit
      daysToRecruit = 90;
    } else if (currentSaudiPercent >= yellowThreshold && newSaudiPercent < yellowThreshold) {
      reclassificationRisk = "red_risk";
      daysToRecruit = 60;
    }

    // Determine the current Nitaqat quarter (1-4)
    const now = new Date(this.initiation.lastWorkingDay);
    const quarter = Math.ceil((now.getMonth() + 1) / 3);
    const year = now.getFullYear();

    return {
      reclassificationRisk,
      newSaudiPercent: Math.round(newSaudiPercent * 10000) / 100,
      daysToRecruit: daysToRecruit ?? null,
      filingQuarter: `Q${quarter} ${year}`,
    };
  }

  // ─── Full Checklist ─────────────────────────────────────────────────────────

  /**
   * Returns the complete offboarding checklist.
   */
  checklist(
    evidence: string[] = [],
    investigationComplete = false,
    employeeHadRightToDefence = false,
    currentSaudiPercent?: number,
    totalEmployees?: number,
    saudiCount?: number
  ): OffboardingChecklist {
    const notice = this.computeNotice();
    const grounds = this.checkGrounds(evidence, investigationComplete, employeeHadRightToDefence);
    const eosb = this.computeEOSB();
    const immigrationSteps = this.immigrationSteps();
    const serviceCertificate = this.generateServiceCertificate();
    const nitaqat = (currentSaudiPercent !== undefined && totalEmployees !== undefined && saudiCount !== undefined)
      ? this.nitaqatImpact(currentSaudiPercent, totalEmployees, saudiCount)
      : { reclassificationRisk: "none" as const, newSaudiPercent: null, daysToRecruit: null, filingQuarter: "" };

    const now = new Date(this.asOfDate);
    const overdueSteps = immigrationSteps
      .filter((s) => s.deadline !== null && new Date(s.deadline) < now)
      .map((s) => s.step);

    const hrActionsRequired: string[] = [];
    if (!grounds.evidenceSufficient) {
      hrActionsRequired.push(`Address Article ${grounds.article} evidence gaps: ${grounds.gaps.join("; ")}`);
    }
    if (grounds.requiresLegalReview) {
      hrActionsRequired.push("Legal review required before proceeding with dismissal.");
    }
    if (eosb.requiresHrReview) {
      hrActionsRequired.push("HR review required for EOSB calculation.");
    }

    const blockedSteps: string[] = [];
    if (!investigationComplete) {
      blockedSteps.push("Cannot proceed with dismissal until Article 57 investigation is concluded.");
    }
    if (grounds.gaps.some((g) => g.includes("defence"))) {
      blockedSteps.push("Cannot issue dismissal without first giving employee right to defence.");
    }

    return {
      notice,
      grounds,
      eosb,
      immigrationSteps,
      serviceCertificate,
      nitaqat,
      overdueSteps,
      hrActionsRequired,
      blockedSteps,
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private reasonLabel(reason: SeparationReason): string {
    const labels: Record<SeparationReason, string> = {
      resignation: "Resignation — employee-initiated",
      termination: "Termination — employer-initiated, without cause (full EOSB)",
      termination_for_cause: "Termination for cause — Article 80 dismissal",
      end_of_contract: "End of fixed-term contract",
      mutual_termination: "Mutual agreement",
      force_majeure: "Force majeure",
      death: "Death of employee",
      employer_fault: "Employer fault — Article 81 (full EOSB, no notice)",
    };
    return labels[reason];
  }

  private addDays(date: string, days: number): string {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0] as string;
  }

  private daysBetween(start: string, end: string): number {
    return Math.round(
      (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
    );
  }
}

// Re-export for convenience
export type { NationalityCategory } from "./types";
