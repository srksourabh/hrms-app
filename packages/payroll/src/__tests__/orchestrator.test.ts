import { describe, it, expect } from "vitest";
import { orchestratePayrollRun, applyDeductionCaps } from "../orchestrator";
import type { EmployeeContext } from "../types";

const emp = (id: string, overrides: Partial<EmployeeContext> = {}): EmployeeContext => ({
  id,
  fullName: `Employee ${id}`,
  nationality: "saudi",
  gosiSystem: null,
  salaryBasic: 10000,
  salaryHousing: 2000,
  salaryTransport: 1000,
  hireDate: "2020-01-01",
  employmentStatus: "active",
  bankIbanEnc: "SA123456",
  gosiRegistrationDate: null,
  ...overrides,
});

describe("orchestratePayrollRun", () => {
  it("calculates payslips for all employees", () => {
    const result = orchestratePayrollRun({
      payrollRunId: "run-1",
      employees: [emp("e1"), emp("e2")],
    });

    expect(result.payslips).toHaveLength(2);
    expect(result.totalAmount).toBeGreaterThan(0);
  });

  it("applies overtime and deductions", () => {
    const result = orchestratePayrollRun({
      payrollRunId: "run-1",
      employees: [emp("e1")],
      overtime: { e1: 1000 },
      deductions: { e1: 500 },
    });

    const slip = result.payslips[0];
    expect(slip?.overtime).toBe(1000);
    expect(slip?.deductions).toBe(500);
  });

  it("calculates net pay as gross minus GOSI and deductions", () => {
    const result = orchestratePayrollRun({
      payrollRunId: "run-1",
      employees: [emp("e1", { salaryBasic: 10000, salaryHousing: 0, salaryTransport: 0 })],
    });

    const slip = result.payslips[0];
    // Gross = 10000. GOSI employee = pension (9% × 10000) + SANED (0.75% × 10000) = 975
    expect(slip?.gosiEmployee).toBeGreaterThan(0);
    expect(slip?.netPay).toBe(10000 - (slip?.gosiEmployee ?? 0));
  });

  it("returns empty payslips for no employees", () => {
    const result = orchestratePayrollRun({
      payrollRunId: "run-1",
      employees: [],
    });

    expect(result.payslips).toHaveLength(0);
    expect(result.totalAmount).toBe(0);
  });

  it("runs consistency checks", () => {
    const result = orchestratePayrollRun({
      payrollRunId: "run-1",
      employees: [emp("e1")],
    });

    expect(result.checks.length).toBeGreaterThan(0);
  });

  // ── Statutory deduction caps (Art 92/93) ──────────────────────────────────

  it("PAY-001: total deductions capped at 50% of wage", () => {
    // wage = 10000; deductions 5400 → capped at 5000
    const caps = applyDeductionCaps(10000, 0, 5400);
    expect(caps.appliedTotal).toBe(5000);
    expect(caps.totalCapped).toBe(true);
  });

  it("PAY-002: employer-loan deduction capped at 10% of wage", () => {
    // wage = 10000; loan 3000 → capped at 1000
    const caps = applyDeductionCaps(10000, 3000, 0);
    expect(caps.appliedLoan).toBe(1000);
    expect(caps.appliedTotal).toBe(1000);
    expect(caps.loanCapped).toBe(true);
  });

  it("caps flow through payroll: net pay never drops below the 50% floor for deductions", () => {
    // wage 10000 (basic only), request 8000 general deduction → applied 5000
    const result = orchestratePayrollRun({
      payrollRunId: "run-1",
      employees: [emp("e1", { salaryBasic: 10000, salaryHousing: 0, salaryTransport: 0 })],
      deductions: { e1: 8000 },
    });
    const slip = result.payslips[0];
    expect(slip?.deductions).toBe(5000); // capped from 8000
    // net = 10000 - gosiEmployee - 5000 (not - 8000)
    expect(slip?.netPay).toBe(10000 - (slip?.gosiEmployee ?? 0) - 5000);
  });

  it("loan keeps its 10% room, other deductions fill the rest under 50%", () => {
    // wage 10000; loan 1000 (=10%), other 9000 → other room = 5000-1000 = 4000
    const caps = applyDeductionCaps(10000, 1000, 9000);
    expect(caps.appliedLoan).toBe(1000);
    expect(caps.appliedOther).toBe(4000);
    expect(caps.appliedTotal).toBe(5000);
  });
});
