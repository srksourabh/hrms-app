export const appRoles = [
  "super_admin",
  "hr_manager",
  "department_manager",
  "hr_specialist",
  "payroll_admin",
  "recruiter",
  "employee",
  "candidate",
] as const;

export type AppRole = (typeof appRoles)[number];

const defaultPlatformAdminEmails = ["srksourabh@gmail.com"];

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const configured = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  const allowed = configured.length > 0 ? configured : defaultPlatformAdminEmails;
  return allowed.includes(email.toLowerCase());
}

export const capabilities = [
  "dashboard:view_admin",
  "dashboard:view_employee",
  "people:view_company",
  "people:manage",
  "profile:view_self",
  "profile:update_self",
  "attendance:view_company",
  "attendance:view_self",
  "attendance:manage",
  "locations:view_company",
  "leave:view_company",
  "leave:approve",
  "leave:request_self",
  "payroll:view_company",
  "payroll:run",
  "payslip:view_self",
  "documents:view_company",
  "documents:manage",
  "documents:view_self",
  "recruitment:view",
  "recruitment:manage",
  "performance:view_team",
  "performance:manage",
  "performance:view_self",
  "learning:manage",
  "learning:view_self",
  "expenses:approve",
  "expenses:submit_self",
  "cases:manage",
  "reports:view_company",
  "compliance:manage",
  "integrations:manage",
  "settings:manage",
] as const;

export type Capability = (typeof capabilities)[number];

const employeeCapabilities: Capability[] = [
  "dashboard:view_employee",
  "profile:view_self",
  "profile:update_self",
  "attendance:view_self",
  "leave:request_self",
  "payslip:view_self",
  "documents:view_self",
  "performance:view_self",
  "learning:view_self",
  "expenses:submit_self",
];

const roleCapabilities: Record<AppRole, readonly Capability[]> = {
  super_admin: capabilities,
  hr_manager: capabilities.filter((capability) => capability !== "dashboard:view_employee"),
  department_manager: [
    "dashboard:view_admin",
    "people:view_company",
    "profile:view_self",
    "attendance:view_company",
    "attendance:view_self",
    "locations:view_company",
    "leave:view_company",
    "leave:approve",
    "leave:request_self",
    "payslip:view_self",
    "documents:view_self",
    "recruitment:view",
    "performance:view_team",
    "performance:view_self",
    "learning:view_self",
    "expenses:approve",
    "expenses:submit_self",
    "reports:view_company",
  ],
  hr_specialist: [
    "dashboard:view_admin",
    "people:view_company",
    "people:manage",
    "profile:view_self",
    "attendance:view_company",
    "attendance:view_self",
    "attendance:manage",
    "locations:view_company",
    "leave:view_company",
    "leave:approve",
    "leave:request_self",
    "payroll:view_company",
    "payslip:view_self",
    "documents:view_company",
    "documents:manage",
    "documents:view_self",
    "recruitment:view",
    "recruitment:manage",
    "performance:view_team",
    "performance:manage",
    "performance:view_self",
    "learning:manage",
    "learning:view_self",
    "expenses:submit_self",
    "cases:manage",
    "reports:view_company",
    "compliance:manage",
  ],
  payroll_admin: [
    "dashboard:view_admin",
    "people:view_company",
    "profile:view_self",
    "attendance:view_company",
    "locations:view_company",
    "leave:view_company",
    "payroll:view_company",
    "payroll:run",
    "payslip:view_self",
    "documents:view_company",
    "documents:view_self",
    "reports:view_company",
    "compliance:manage",
    "integrations:manage",
  ],
  recruiter: [
    "dashboard:view_admin",
    "people:view_company",
    "profile:view_self",
    "recruitment:view",
    "recruitment:manage",
    "documents:view_self",
    "reports:view_company",
  ],
  employee: employeeCapabilities,
  candidate: ["profile:view_self"],
};

export function isAppRole(role: string): role is AppRole {
  return appRoles.includes(role as AppRole);
}

export function getRoleCapabilities(role: AppRole): readonly Capability[] {
  return roleCapabilities[role];
}

export function can(role: string | null | undefined, capability: Capability): boolean {
  return Boolean(role && isAppRole(role) && roleCapabilities[role].includes(capability));
}

const employeeRoutePrefixes = [
  "/profile",
  "/attendance/me",
  "/leave",
  "/expenses",
  "/documents",
  // Employee self-service payroll page (own payslips). Distinct from the
  // HR-only /payroll routes — this prefix matches only /payroll/me[/...].
  "/payroll/me",
  // Self-centered organogram (own managers + reports). The full company chart
  // stays HR-only; the page scopes its data to the employee server-side.
  "/departments/organogram",
  "/retention/goals",
  "/retention/skills",
  "/modules/travel-expenses",
  "/modules/time-leave-attendance",
  "/modules/documents-certificates",
  "/modules/mobile-self-service",
  "/modules/benefits-rewards",
  "/modules/performance-goals",
  "/modules/learning-skills",
] as const;

export function canAccessRoute(role: string | null | undefined, pathname: string): boolean {
  if (!role || !isAppRole(role)) return false;
  if (role === "candidate") return pathname === "/profile" || pathname.startsWith("/profile/");
  if (role !== "employee") return true;
  if (pathname === "/") return true;
  if (pathname === "/search") return true;
  return employeeRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

const employeeProcedures = new Set([
  "auth.session",
  "user.me",
  "leave.leaveType.list",
  "leave.request.create",
  "leave.request.my",
  "document.myDocuments",
  "notification.list",
  "notification.markRead",
  "notification.markAllRead",
  "notification.unreadCount",
  "attendance.punchIn",
  "attendance.punchOut",
  "attendance.today",
  "attendance.myHistory",
  "attendance.myMonthlySummary",
  "attendance.requestCorrection",
  "employee.me",
  "employee.orgChart",
  "employee.exportMyData",
  // Self-centered org chart: the employee's own managers-above / reports-below.
  "employee.orgAroundMe",
  // Employee expense self-service (submit + view + cancel own claims).
  "expense.list",
  "expense.summary",
  "expense.getById",
  "expense.create",
  "expense.update",
  "expense.cancel",
  "payroll.payslip.myLatest",
  // My Payroll self-service: own payslips + request a correction from HR.
  "payroll.payslip.mine",
  "payroll.payslip.requestCorrection",
  "settlement.simulateOwn",
  "retention.goal.mine",
  // Employee self-help assistant (Taāzur AI). The answer is grounded in the
  // in-app Saudi-HR knowledge prompt; employees may ask it for help.
  "ai.chat.send",
]);

const candidateProcedures = new Set([
  "user.me",
  "recruitment.myApplications",
  "recruitment.myInterviews",
  "ai.chat.send",
]);

export function canAccessProcedure(role: string | null | undefined, path: string): boolean {
  if (!role || !isAppRole(role)) return false;
  if (role === "employee") return employeeProcedures.has(path);
  if (role === "candidate") return candidateProcedures.has(path);
  return true;
}
