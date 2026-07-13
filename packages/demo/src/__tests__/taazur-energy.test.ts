import { describe, expect, it } from "vitest";
import { getDemoEmployee, taazurEnergyDemo } from "../taazur-energy";

describe("Taāzur energy-services demo fixture", () => {
  it("contains a connected multi-branch organization with departments and projects", () => {
    expect(taazurEnergyDemo.employees).toHaveLength(12);
    expect(taazurEnergyDemo.branches).toHaveLength(3);
    expect(taazurEnergyDemo.departments).toHaveLength(5);
    expect(taazurEnergyDemo.projects).toHaveLength(4);
    expect(new Set(taazurEnergyDemo.employees.map((employee) => employee.branchId))).toEqual(
      new Set(taazurEnergyDemo.branches.map((branch) => branch.id)),
    );

    const employeeIds = new Set(taazurEnergyDemo.employees.map((employee) => employee.id));
    const departmentIds = new Set(taazurEnergyDemo.departments.map((department) => department.id as string));
    expect(taazurEnergyDemo.company.headcount).toBe(taazurEnergyDemo.employees.length);
    expect(taazurEnergyDemo.branches.reduce((sum, branch) => sum + branch.employeeCount, 0)).toBe(
      taazurEnergyDemo.employees.length,
    );

    for (const department of taazurEnergyDemo.departments) {
      expect(employeeIds.has(department.headEmployeeId)).toBe(true);
    }
    for (const employee of taazurEnergyDemo.employees) {
      expect(departmentIds.has(employee.departmentId)).toBe(true);
    }
    for (const project of taazurEnergyDemo.projects) {
      expect(employeeIds.has(project.managerId)).toBe(true);
      expect(project.teamEmployeeIds.length).toBeGreaterThanOrEqual(3);
      expect(project.teamEmployeeIds.every((employeeId) => employeeIds.has(employeeId))).toBe(true);
    }
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
    expect(taazurEnergyDemo.payroll.payslips).toHaveLength(12);
    expect(taazurEnergyDemo.payroll.runs.length).toBeGreaterThanOrEqual(3);
    expect(taazurEnergyDemo.documents.length).toBeGreaterThanOrEqual(12);
    expect(taazurEnergyDemo.performance.goals.length).toBeGreaterThan(0);
    expect(taazurEnergyDemo.offboarding.exitInterview).toBeDefined();
    expect(taazurEnergyDemo.governmentIntegrations.every((integration) => integration.mode === "mock")).toBe(true);
  });

  it("gives every employee coherent compensation, payroll, benefits, and operational records", () => {
    const employeeIds = new Set(taazurEnergyDemo.employees.map((employee) => employee.id));
    expect(taazurEnergyDemo.compensation).toHaveLength(taazurEnergyDemo.employees.length);
    expect(taazurEnergyDemo.benefits.enrollments).toHaveLength(taazurEnergyDemo.employees.length);
    expect(taazurEnergyDemo.attendance.entries).toHaveLength(taazurEnergyDemo.employees.length);

    for (const employee of taazurEnergyDemo.employees) {
      const compensation = taazurEnergyDemo.compensation.find((item) => item.employeeId === employee.id);
      const payslip = taazurEnergyDemo.payroll.payslips.find((item) => item.employeeId === employee.id);
      expect(compensation).toMatchObject({ employeeId: employee.id, currency: "SAR" });
      expect(compensation?.basic).toBeGreaterThan(0);
      expect(payslip).toBeDefined();
      if (!payslip) continue;
      expect(payslip.gross).toBe(
        payslip.earnings.basic
          + payslip.earnings.housing
          + payslip.earnings.transport
          + payslip.earnings.projectAllowance
          + payslip.earnings.overtime
          + payslip.earnings.bonus,
      );
      expect(payslip.net).toBe(payslip.gross - payslip.deductions);
    }

    expect(taazurEnergyDemo.assets.every((asset) => employeeIds.has(asset.employeeId))).toBe(true);
    expect(taazurEnergyDemo.projectAssignments.every((assignment) => employeeIds.has(assignment.employeeId))).toBe(true);
    expect(taazurEnergyDemo.onboarding.cohorts.length).toBeGreaterThanOrEqual(2);
  });
});
