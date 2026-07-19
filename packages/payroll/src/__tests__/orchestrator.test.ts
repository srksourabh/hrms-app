import { describe, it, expect } from "vitest";
import { orchestratePayrollRun } from "../orchestrator";
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
});
