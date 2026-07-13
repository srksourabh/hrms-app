# Roles, Demo Personas, and Permissions

**Status:** current code reference plus PRD comparison
**Source code:** `packages/auth/src/rbac.ts`, `packages/auth/src/demo-identities.ts`, `apps/web/middleware.ts`, `apps/web/components/sidebar.tsx`

## 1. Four test-login buttons

The login screen exposes four demo-only persona buttons. Each button injects fictional credentials and opens `/` after Auth.js creates a JWT session.

| Button | Fixture person | Application role | Intended use |
|---|---|---|---|
| **HR Manager demo** | Reem Al-Harbi | `hr_manager` | Full HR operational demonstration, payroll, compliance, modules, company onboarding |
| **HR Specialist demo** | Aisha Al-Otaibi | `hr_specialist` | Payroll/GOSI specialist, people operations, documents, recruitment, compliance |
| **Department Manager demo** | Fahad Al-Qahtani | `department_manager` | Team visibility, approvals, performance, learning, expenses, reports |
| **Employee demo** | Omar Nasser Al-Dossary | `employee` | Personal self-service and ownership isolation |

All people, credentials, organizations, documents, salaries, and transactions are fictional. Demo credentials are deliberately confined to `DEMO_MODE=true`; `resolveDemoIdentity` returns `null` when demo mode is disabled.

## 2. Role vocabulary

| Role | Code | Scope |
|---|---|---|
| Super Admin | `super_admin` | Every declared capability; owner/billing/platform administration in the PRD |
| HR Manager | `hr_manager` | All declared capabilities except the employee-dashboard capability |
| Department Manager | `department_manager` | Company/team views, approvals, team performance/learning, expenses, reports |
| HR Specialist | `hr_specialist` | People operations, payroll viewing, documents, recruitment, compliance, employee relations |
| Payroll Admin | `payroll_admin` | Declared in capability code, but absent from the public user-role database enum and demo buttons |
| Recruiter | `recruiter` | Declared in capability code, but absent from the public user-role database enum and demo buttons |
| Employee | `employee` | Personal self-service only |
| Candidate | `candidate` | External candidate profile/application scope |

> **Model mismatch:** `packages/auth/src/rbac.ts` declares eight roles, while `packages/db/src/schema/public/users.ts` declares six and omits `payroll_admin` and `recruiter`. Production role assignment must reconcile this before launch.

## 3. Capability dictionary

### Dashboards

- `dashboard:view_admin`: access a company/team command center.
- `dashboard:view_employee`: access the personal employee command center.

### People and profile

- `people:view_company`: view company or authorized team people records.
- `people:manage`: create/update company people records.
- `profile:view_self`: view the signed-in person's own profile.
- `profile:update_self`: update permitted personal profile fields.

### Attendance and leave

- `attendance:view_company`: view organization/team attendance.
- `attendance:view_self`: view own attendance.
- `attendance:manage`: record corrections or manage attendance.
- `leave:view_company`: view organization/team leave.
- `leave:approve`: approve/reject eligible requests.
- `leave:request_self`: request own leave.

### Payroll and documents

- `payroll:view_company`: view company payroll data.
- `payroll:run`: calculate/finalize payroll.
- `payslip:view_self`: view own payslip.
- `documents:view_company`: view permitted company documents.
- `documents:manage`: create/update document records.
- `documents:view_self`: view own documents.

### Recruitment and development

- `recruitment:view`: view recruitment data.
- `recruitment:manage`: create/update recruitment workflows.
- `performance:view_team`: view team performance.
- `performance:manage`: coordinate performance processes.
- `performance:view_self`: view own performance/goals.
- `learning:manage`: coordinate learning and skills.
- `learning:view_self`: view own learning.

### Expenses, cases, reports, compliance

- `expenses:approve`: approve eligible team/company expenses.
- `expenses:submit_self`: submit own expenses.
- `cases:manage`: manage restricted employee-relations cases.
- `reports:view_company`: view company/team reports.
- `compliance:manage`: run or maintain compliance controls.
- `integrations:manage`: configure external integration settings.
- `settings:manage`: modify company settings.

## 4. Current capability matrix

Legend: **Y** declared capability, **—** not declared.

| Capability area | Super Admin | HR Manager | Dept Manager | HR Specialist | Payroll Admin | Recruiter | Employee | Candidate |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Admin dashboard | Y | Y | Y | Y | Y | Y | — | — |
| Employee dashboard | Y | — | — | — | — | — | Y | — |
| Company people view | Y | Y | Y | Y | Y | Y | — | — |
| People manage | Y | Y | — | Y | — | — | — | — |
| Own profile | Y | Y | Y | Y | Y | Y | Y | Y |
| Company attendance | Y | Y | Y | Y | Y | — | — | — |
| Attendance manage | Y | Y | — | Y | — | — | — | — |
| Company leave | Y | Y | Y | Y | Y | — | — | — |
| Leave approve | Y | Y | Y | Y | — | — | — | — |
| Own leave request | Y | Y | Y | Y | — | — | Y | — |
| Company payroll view | Y | Y | — | Y | Y | — | — | — |
| Run payroll | Y | Y | — | — | Y | — | — | — |
| Own payslip | Y | Y | Y | Y | Y | — | Y | — |
| Company documents | Y | Y | — | Y | Y | — | — | — |
| Documents manage | Y | Y | — | Y | — | — | — | — |
| Recruitment view | Y | Y | Y | Y | — | Y | — | — |
| Recruitment manage | Y | Y | — | Y | — | Y | — | — |
| Team performance | Y | Y | Y | Y | — | — | — | — |
| Performance manage | Y | Y | — | Y | — | — | — | — |
| Learning manage | Y | Y | — | Y | — | — | — | — |
| Expense approve | Y | Y | Y | — | — | — | — | — |
| Expense submit | Y | Y | Y | Y | — | — | Y | — |
| Employee relations | Y | Y | — | Y | — | — | — | — |
| Reports | Y | Y | Y | Y | Y | Y | — | — |
| Compliance manage | Y | Y | — | Y | Y | — | — | — |
| Integrations manage | Y | Y | — | — | Y | — | — | — |
| Settings manage | Y | Y | — | — | — | — | — | — |

## 5. Route enforcement

### Employee allowlist

Employees may access `/` plus these route families:

- `/profile`
- `/leave`
- `/documents`
- `/retention/goals`
- `/retention/skills`
- `/modules/travel-expenses`
- `/modules/time-leave-attendance`
- `/modules/documents-certificates`
- `/modules/mobile-self-service`
- `/modules/benefits-rewards`
- `/modules/performance-goals`
- `/modules/learning-skills`

Other matched company routes redirect to `/?access=denied`.

### Candidate allowlist

Candidates may access only `/profile` and descendants according to `canAccessRoute`. Candidate-specific public pages remain PRD work unless separately verified.

### Non-employee caveat

Current `canAccessRoute` returns `true` for every non-employee, non-candidate role. Fine-grained capability declarations therefore do **not** currently produce equivalent route denial for Department Manager, HR Specialist, Payroll Admin, or Recruiter. Sidebar/dashboard visibility is capability-filtered, but that is not a security boundary. This is a launch-blocking authorization gap if those roles are used with real data.

## 6. Procedure enforcement

- Employee tRPC access is an explicit allowlist (`user.me`, own leave creation/list, own documents, notifications).
- Candidate tRPC access is an explicit allowlist (`user.me`, own applications, own interviews).
- All other recognized roles currently pass `canAccessProcedure` globally.
- Some routers use `protectedProcedure` instead of a capability-specific procedure. Authentication alone is not equivalent to authorization.

Production requirement: every sensitive procedure must enforce tenant, role, capability, ownership, and where needed reporting-line scope at the server boundary.

## 7. Role-specific usability expectations

### HR Manager

- Company command center and all workspaces.
- Full operational priorities, payroll, recruitment, compliance, and settings.
- Company Onboarding operational demo is HR Manager only.
- Must see explicit demo/mock labels.

### HR Specialist

- Task-oriented access, not owner-level settings.
- Can view company payroll but cannot run payroll under current capability declarations.
- Can manage recruitment, people, documents, attendance, leave, performance, learning, cases, and compliance.
- The current sidebar/dashboard hide actions that require `payroll:run`, `integrations:manage`, or `settings:manage`; server enforcement remains required.

### Department Manager

- Team and approval focus.
- No company payroll-run capability, settings, integration management, employee-relations cases, or company document management.
- Team scope must be based on reporting lines/department, not full-tenant records.

### Employee

- Personal records only.
- Company payroll navigation is absent.
- Direct company payroll access redirects.
- Profile exposes masked identity values and no other fixture employee names.

## 8. Session and security behavior

- Auth.js credentials provider issues JWT sessions.
- Demo sessions have no production tenant ID; regulatory context defaults to `saudi`.
- Demo identities resolve only when `DEMO_MODE=true`.
- Middleware reads the role from the signed token.
- Auth callback and signup endpoints are rate-limited in middleware.
- MFA and enterprise SSO are PRD-only unless independently implemented and verified.

## 9. QA acceptance criteria

1. Login displays exactly four operational demo persona buttons.
2. Each button creates the expected person and role session.
3. Demo identities fail when demo mode is disabled.
4. Employees cannot access company payroll, settings, people, or recruitment.
5. Company Onboarding denies every role except HR Manager.
6. Every procedure has a capability/ownership test, not just a hidden button.
7. Department Manager results contain only authorized team members.
8. HR Specialist cannot perform undeclared payroll-run/settings/integration actions.
9. Unknown roles receive no capability.
10. Browser console remains free of uncaught errors during every role journey.
