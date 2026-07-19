import { describe, it, expect } from "vitest";
import { TerminationWorkflow, computeResignationLifecycle } from "../offboarding";
import type { TerminationInitiation } from "../offboarding";

const employee = (overrides: Record<string, unknown> = {}) => ({
  id: "e1",
  fullName: "Test Employee",
  nationality: "saudi" as const,
  hireDate: "2020-01-01",
  terminationDate: "2026-01-01",
  salaryBasic: 10000,
  salaryHousing: 0,
  salaryTransport: 0,
  completedProbation: true,
  contractType: "definite" as const,
  ...overrides,
});

const initiation = (overrides: Partial<TerminationInitiation> = {}): TerminationInitiation => ({
  initiator: "employer",
  reason: "termination",
  lastWorkingDay: "2026-01-01",
  noticeDate: "2025-12-01",
  contractType: "definite",
  allegedGrossMisconduct: false,
  ...overrides,
});

describe("Article 77 compensation", () => {
  it("CON-003: fixed-term with 6 months remaining @10,000/mo = 60,000", () => {
    const wf = new TerminationWorkflow(
      employee({ contractType: "definite" }),
      initiation({ contractType: "definite", lastWorkingDay: "2026-01-01", contractEndDate: "2026-07-01" }),
    );
    const comp = wf.computeArt77Compensation();
    expect(comp.amount).toBe(60000);
  });

  it("indefinite: 15 days/yr with a 2-month floor", () => {
    // 1 year of service → 15 days ≈ 5,000, but the 2-month floor (20,000) binds.
    const wf = new TerminationWorkflow(
      employee({ contractType: "indefinite", hireDate: "2025-01-01", terminationDate: "2026-01-01" }),
      initiation({ contractType: "indefinite" }),
    );
    const comp = wf.computeArt77Compensation();
    expect(comp.amount).toBe(20000); // 2-month floor
  });
});

describe("no-notice reasons", () => {
  it("employer_fault (Art 81) and termination_for_cause (Art 80) → 0 notice days", () => {
    const art81 = new TerminationWorkflow(
      employee({ contractType: "indefinite" }),
      initiation({ contractType: "indefinite", initiator: "employee", reason: "employer_fault" }),
    );
    expect(art81.computeNotice().totalDays).toBe(0);

    const art80 = new TerminationWorkflow(
      employee({ contractType: "indefinite" }),
      initiation({ contractType: "indefinite", reason: "termination_for_cause", allegedGrossMisconduct: true }),
    );
    expect(art80.computeNotice().totalDays).toBe(0);
  });
});

describe("Article 79 resignation lifecycle", () => {
  it("CON-005: computes withdrawal (7d), auto-accept (30d), max deferral (60d)", () => {
    const lc = computeResignationLifecycle("2026-01-01");
    expect(lc.withdrawalDeadline).toBe("2026-01-08");
    expect(lc.autoAcceptDate).toBe("2026-01-31");
    expect(lc.maxEmployerDeferralDate).toBe("2026-03-02"); // Jan 1 + 60 days
  });
});
