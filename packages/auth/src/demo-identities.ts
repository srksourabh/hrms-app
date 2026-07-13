export interface DemoIdentity {
  id: string;
  email: string;
  password: string;
  name: string;
  role: "hr_manager" | "hr_specialist" | "department_manager" | "employee";
  employeeId: string;
  image: string;
  preferredLanguage: "en" | "ar";
}

export const demoIdentities = {
  admin: {
    id: "demo-admin",
    email: "admin@taazur.example",
    password: "TaazurAdmin@2026",
    name: "Reem Al-Harbi",
    role: "hr_manager",
    employeeId: "emp-reem",
    image: "/demo/people/reem-alharbi.svg",
    preferredLanguage: "en",
  },
  hrSpecialist: {
    id: "demo-hr-specialist",
    email: "specialist@taazur.example",
    password: "TaazurSpecialist@2026",
    name: "Aisha Al-Otaibi",
    role: "hr_specialist",
    employeeId: "emp-aisha",
    image: "/demo/people/aisha-alotaibi.svg",
    preferredLanguage: "en",
  },
  departmentManager: {
    id: "demo-department-manager",
    email: "manager@taazur.example",
    password: "TaazurManager@2026",
    name: "Fahad Al-Qahtani",
    role: "department_manager",
    employeeId: "emp-fahad",
    image: "/demo/people/fahad-alqahtani.svg",
    preferredLanguage: "en",
  },
  employee: {
    id: "demo-employee",
    email: "employee@taazur.example",
    password: "TaazurEmployee@2026",
    name: "Omar Nasser Al-Dossary",
    role: "employee",
    employeeId: "emp-omar",
    image: "/demo/people/omar-aldossary.svg",
    preferredLanguage: "en",
  },
} as const satisfies Record<string, DemoIdentity>;

export type DemoIdentityKey = keyof typeof demoIdentities;

export function resolveDemoIdentity(
  email: string,
  password: string,
  enabled: boolean,
): DemoIdentity | null {
  if (!enabled) return null;
  return (
    Object.values(demoIdentities).find(
      (identity) => identity.email === email && identity.password === password,
    ) ?? null
  );
}
