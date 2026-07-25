export interface DemoIdentity {
  id: string;
  email: string;
  password: string;
  name: string;
  role: "hr_manager" | "hr_specialist" | "department_manager" | "employee";
  employeeId: string;
  /** Links to public.tenants.id — Rukn Energy Services */
  tenantId: string;
  image: string;
  preferredLanguage: "en" | "ar";
}

/** Rukn Energy Services tenant ID (must match public.tenants.id + seed data) */
export const RUKN_TENANT_ID = "1ed8b6bd-3743-5000-8000-000000000001";

export const demoIdentities = {
  admin: {
    id: "demo-admin",
    email: "admin@saudi-hrms.example",
    password: "SaudiHRMSDemo@2026",
    name: "Reem Al-Harbi",
    role: "hr_manager",
    // Real employee row in the Rukn Energy tenant schema (attendance/timesheet
    // and profile read live DB data, so this must reference an existing row).
    employeeId: "70c6e56a-6f3c-57e1-88e8-b6aa81f44941",
    tenantId: RUKN_TENANT_ID,
    image: "",
    preferredLanguage: "en",
  },
  hrSpecialist: {
    id: "demo-hr-specialist",
    email: "specialist@saudi-hrms.example",
    password: "SaudiHRMSDemo@2026",
    name: "Aisha Al-Otaibi",
    role: "hr_specialist",
    employeeId: "ea1c81d1-7231-52de-8c35-feb24ba88fd5",
    tenantId: RUKN_TENANT_ID,
    image: "",
    preferredLanguage: "en",
  },
  departmentManager: {
    id: "demo-department-manager",
    email: "manager@saudi-hrms.example",
    password: "SaudiHRMSDemo@2026",
    name: "Fahad Al-Qahtani",
    role: "department_manager",
    employeeId: "0c3b4817-a265-5d61-87e9-abcc6518ff4a",
    tenantId: RUKN_TENANT_ID,
    image: "",
    preferredLanguage: "en",
  },
  employee: {
    id: "demo-employee",
    email: "employee@saudi-hrms.example",
    password: "SaudiHRMSDemo@2026",
    name: "Omar Nasser Al-Dossary",
    role: "employee",
    employeeId: "41f58f2a-f94f-5bf3-8b05-76aaf4b89190",
    tenantId: RUKN_TENANT_ID,
    image: "",
    preferredLanguage: "en",
  },
} as const satisfies Record<string, DemoIdentity>;

export type DemoIdentityKey = keyof typeof demoIdentities;

export function resolveDemoIdentity(
  email: string,
  password: string,
  demoModeEnabled = false,
): DemoIdentity | null {
  if (!demoModeEnabled) return null;
  return (
    Object.values(demoIdentities).find(
      (identity) => identity.email === email && identity.password === password,
    ) ?? null
  );
}
