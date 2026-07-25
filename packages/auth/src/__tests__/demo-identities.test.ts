import { describe, expect, it } from "vitest";
import { demoIdentities, resolveDemoIdentity } from "../demo-identities";

describe("Tazur demo identities", () => {
  it("provides five distinct operational role identities", () => {
    expect(Object.values(demoIdentities).map((identity) => identity.role)).toEqual([
      "super_admin",
      "hr_manager",
      "department_manager",
      "employee",
      "employee",
    ]);
    expect(new Set(Object.values(demoIdentities).map((identity) => identity.email)).size).toBe(5);
    expect(demoIdentities.hrManager.employeeId).toBe("dddddddd-0000-4000-8000-000000000001");
    expect(demoIdentities.projectManager.employeeId).toBe("dddddddd-0000-4000-8000-000000000003");
  });

  it("resolves valid credentials only when demo mode is enabled", () => {
    expect(
      resolveDemoIdentity(demoIdentities.admin.email, demoIdentities.admin.password, true),
    ).toMatchObject({ role: "super_admin" });
    expect(
      resolveDemoIdentity(demoIdentities.hrManager.email, demoIdentities.hrManager.password, true),
    ).toMatchObject({ role: "hr_manager" });
    expect(
      resolveDemoIdentity(demoIdentities.projectManager.email, demoIdentities.projectManager.password, true),
    ).toMatchObject({ role: "department_manager" });
    expect(
      resolveDemoIdentity(demoIdentities.employee1.email, demoIdentities.employee1.password, true),
    ).toMatchObject({ role: "employee" });
    expect(
      resolveDemoIdentity(demoIdentities.employee2.email, demoIdentities.employee2.password, true),
    ).toMatchObject({ role: "employee" });
    expect(resolveDemoIdentity(demoIdentities.admin.email, demoIdentities.admin.password, false)).toBeNull();
  });

  it("rejects a wrong password", () => {
    expect(resolveDemoIdentity(demoIdentities.employee1.email, "wrong", true)).toBeNull();
  });
});
