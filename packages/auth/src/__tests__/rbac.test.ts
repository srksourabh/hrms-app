import { describe, expect, it } from "vitest";
import {
  can,
  canAccessProcedure,
  canAccessRoute,
  getRoleCapabilities,
  type AppRole,
  type Capability,
} from "../rbac";

describe("Taāzur role capabilities", () => {
  it("allows HR managers to administer people and payroll", () => {
    expect(can("hr_manager", "people:manage")).toBe(true);
    expect(can("hr_manager", "payroll:run")).toBe(true);
    expect(can("hr_manager", "reports:view_company")).toBe(true);
  });

  it("limits employees to their own records and requests", () => {
    expect(can("employee", "profile:view_self")).toBe(true);
    expect(can("employee", "leave:request_self")).toBe(true);
    expect(can("employee", "payslip:view_self")).toBe(true);
    expect(can("employee", "people:manage")).toBe(false);
    expect(can("employee", "payroll:run")).toBe(false);
    expect(can("employee", "reports:view_company")).toBe(false);
  });

  it("gives super admins every declared capability", () => {
    const roles: AppRole[] = [
      "super_admin",
      "hr_manager",
      "department_manager",
      "hr_specialist",
      "payroll_admin",
      "recruiter",
      "employee",
      "candidate",
    ];
    const allCapabilities = new Set<Capability>(
      roles.flatMap((role) => getRoleCapabilities(role)),
    );
    for (const capability of allCapabilities) expect(can("super_admin", capability)).toBe(true);
  });

  it("does not grant unknown roles any capabilities", () => {
    expect(can("unknown", "profile:view_self")).toBe(false);
  });

  it("denies employees direct access to company administration routes", () => {
    expect(canAccessRoute("employee", "/profile")).toBe(true);
    expect(canAccessRoute("employee", "/modules/travel-expenses")).toBe(true);
    expect(canAccessRoute("employee", "/payroll")).toBe(false);
    expect(canAccessRoute("employee", "/employees")).toBe(false);
    expect(canAccessRoute("employee", "/settings")).toBe(false);
    expect(canAccessRoute("hr_manager", "/payroll")).toBe(true);
  });

  it("denies employees company-wide API procedures by default", () => {
    expect(canAccessProcedure("employee", "user.me")).toBe(true);
    expect(canAccessProcedure("employee", "leave.request.my")).toBe(true);
    expect(canAccessProcedure("employee", "document.myDocuments")).toBe(true);
    expect(canAccessProcedure("employee", "employee.list")).toBe(false);
    expect(canAccessProcedure("employee", "payroll.payrollRun.list")).toBe(false);
    expect(canAccessProcedure("hr_manager", "employee.list")).toBe(true);
  });
});
