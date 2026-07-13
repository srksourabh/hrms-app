import { describe, expect, it } from "vitest";
import { demoIdentities, resolveDemoIdentity } from "../demo-identities";

describe("Taāzur demo identities", () => {
  it("provides four distinct operational role identities", () => {
    expect(Object.values(demoIdentities).map((identity) => identity.role)).toEqual([
      "hr_manager",
      "hr_specialist",
      "department_manager",
      "employee",
    ]);
    expect(new Set(Object.values(demoIdentities).map((identity) => identity.email)).size).toBe(4);
    expect(demoIdentities.hrSpecialist.employeeId).toBe("emp-aisha");
    expect(demoIdentities.departmentManager.employeeId).toBe("emp-fahad");
  });

  it("resolves valid credentials only when demo mode is enabled", () => {
    expect(
      resolveDemoIdentity(demoIdentities.admin.email, demoIdentities.admin.password, true),
    ).toMatchObject({ role: "hr_manager" });
    expect(
      resolveDemoIdentity(demoIdentities.employee.email, demoIdentities.employee.password, true),
    ).toMatchObject({ role: "employee" });
    expect(
      resolveDemoIdentity(demoIdentities.hrSpecialist.email, demoIdentities.hrSpecialist.password, true),
    ).toMatchObject({ role: "hr_specialist" });
    expect(
      resolveDemoIdentity(demoIdentities.departmentManager.email, demoIdentities.departmentManager.password, true),
    ).toMatchObject({ role: "department_manager" });
    expect(resolveDemoIdentity(demoIdentities.admin.email, demoIdentities.admin.password, false)).toBeNull();
  });

  it("rejects a wrong password", () => {
    expect(resolveDemoIdentity(demoIdentities.employee.email, "wrong", true)).toBeNull();
  });
});
