import { describe, expect, it } from "vitest";
import { getDemoEmployee, taazurEnergyDemo } from "../taazur-energy";

describe("Taāzur energy-services demo fixture", () => {
  it("contains five fictional employees across exactly two branches", () => {
    expect(taazurEnergyDemo.employees).toHaveLength(5);
    expect(taazurEnergyDemo.branches).toHaveLength(2);
    expect(new Set(taazurEnergyDemo.employees.map((employee) => employee.branchId))).toEqual(
      new Set(taazurEnergyDemo.branches.map((branch) => branch.id)),
    );
  });

  it("uses safe fictional identities and local profile images", () => {
    for (const employee of taazurEnergyDemo.employees) {
      expect(employee.email.endsWith(".example")).toBe(true);
      expect(employee.photoUrl.startsWith("/demo/people/")).toBe(true);
      expect(employee.fullName).not.toMatch(/Demo User/i);
    }
  });

  it("connects employee manager records without dangling references", () => {
    const employeeIds = new Set(taazurEnergyDemo.employees.map((employee) => employee.id));
    for (const employee of taazurEnergyDemo.employees) {
      if (employee.managerId) expect(employeeIds.has(employee.managerId)).toBe(true);
    }
  });

  it("resolves only the employee identified by the authenticated session", () => {
    expect(getDemoEmployee("emp-omar")).toMatchObject({
      email: "omar.aldossary@rukn-energy.example",
      role: "employee",
    });
    expect(getDemoEmployee("missing")).toBeUndefined();
  });

  it("provides a complete customer-demo lifecycle chain", () => {
    expect(taazurEnergyDemo.recruitment.applications.length).toBeGreaterThan(0);
    expect(taazurEnergyDemo.onboarding.tasks.length).toBeGreaterThan(0);
    expect(taazurEnergyDemo.attendance.entries.length).toBeGreaterThan(0);
    expect(taazurEnergyDemo.payroll.payslips).toHaveLength(5);
    expect(taazurEnergyDemo.documents.length).toBeGreaterThanOrEqual(5);
    expect(taazurEnergyDemo.performance.goals.length).toBeGreaterThan(0);
    expect(taazurEnergyDemo.offboarding.exitInterview).toBeDefined();
    expect(taazurEnergyDemo.governmentIntegrations.every((integration) => integration.mode === "mock")).toBe(true);
  });
});