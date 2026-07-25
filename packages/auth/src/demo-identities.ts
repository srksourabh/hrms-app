export interface DemoIdentity {
  id: string;
  email: string;
  password: string;
  name: string;
  role: "super_admin" | "hr_manager" | "department_manager" | "employee";
  employeeId: string;
  /** Links to public.tenants.id - Rukn Energy Services */
  tenantId: string;
  image: string;
  preferredLanguage: "en" | "ar";
}

/** Rukn Energy Services tenant ID (must match public.tenants.id + seed data) */
export const RUKN_TENANT_ID = "11111111-1111-4111-8111-111111111111";

export const demoIdentities = {
  admin: {
    id: "demo-admin",
    email: "admin@rukn-energy.example",
    password: "Rukn2026!",
    name: "Reem Al-Harbi",
    role: "super_admin",
    // Real employee row in the Rukn Energy tenant schema.
    employeeId: "dddddddd-0000-4000-8000-000000000001",
    tenantId: RUKN_TENANT_ID,
    image: "",
    preferredLanguage: "en",
  },
  hrManager: {
    id: "demo-hr-manager",
    email: "hr.manager@rukn-energy.example",
    password: "Rukn2026!",
    name: "Reem Al-Harbi",
    role: "hr_manager",
    employeeId: "dddddddd-0000-4000-8000-000000000001",
    tenantId: RUKN_TENANT_ID,
    image: "",
    preferredLanguage: "en",
  },
  projectManager: {
    id: "demo-project-manager",
    email: "project.manager@rukn-energy.example",
    password: "Rukn2026!",
    name: "Fahad Al-Qahtani",
    role: "department_manager",
    employeeId: "dddddddd-0000-4000-8000-000000000003",
    tenantId: RUKN_TENANT_ID,
    image: "",
    preferredLanguage: "en",
  },
  employee1: {
    id: "demo-employee-1",
    email: "employee1@rukn-energy.example",
    password: "Rukn2026!",
    name: "Omar Nasser Al-Dossary",
    role: "employee",
    employeeId: "dddddddd-0000-4000-8000-000000000004",
    tenantId: RUKN_TENANT_ID,
    image: "",
    preferredLanguage: "en",
  },
  employee2: {
    id: "demo-employee-2",
    email: "employee2@rukn-energy.example",
    password: "Rukn2026!",
    name: "Priya Menon",
    role: "employee",
    employeeId: "dddddddd-0000-4000-8000-000000000005",
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
