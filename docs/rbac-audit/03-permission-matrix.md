# 03 - Permission Matrix

**Audit date:** 2026-07-20
**Method:** every tRPC procedure was read and classified by its server-side guard. Enforcement primitives (`apps/web/trpc/server.ts`):

- `publicProcedure` - no auth.
- `protectedProcedure` - login required; **blocks only `employee` + `candidate`** via `canAccessProcedure` allowlist. Every other staff role passes with no further check.
- `companyProcedure` - `protectedProcedure` + explicitly blocks `employee`/`candidate` (so: all staff roles allowed).
- `requireRole(...roles)` - only the named roles pass; fail-closed on unknown role.

> **The central finding of this matrix:** the rich capability model in `rbac.ts` (`roleCapabilities`) is consulted by the **UI and navigation only** (`sidebar.tsx`, `app/page.tsx` via `can()`). The **backend does not consult capabilities for staff roles.** Backend authorization is whatever each procedure's guard says. Where a procedure uses bare `protectedProcedure`, *all* staff roles are authorized regardless of their capability set. This produces the "Over-permissive" rows below.

## 1. Enforcement status legend

- **Secure** - server guard matches intended capability.
- **Over-permissive** - server allows more roles than the capability model intends (backend gap).
- **Frontend-only** - visibility gated in UI but not enforced server-side.
- **Under-permissive** - server blocks a role the model grants (usability bug).
- **Missing** - capability declared but no backend procedure honors it.

## 2. Resource x action enforcement (backend reality)

| Resource | Action | Procedure | Guard | Intended roles (capability) | Status |
|---|---|---|---|---|---|
| employees | view | `employee.list/getById` | `companyProcedure` | people:view_company (all staff) | Secure (dept scope only on `list`) |
| employees | create | `employee.create` | `requireRole(super_admin,hr_manager,hr_specialist)` | people:manage | Secure |
| employees | update (profile) | `employee.update` | `protectedProcedure` + in-body role check | people:manage | Secure (field-scoped) |
| employees | update (salary) | `employee.update` | in-body `SALARY_AUTHORISED_ROLES` | super_admin,hr_manager,payroll_admin | Secure |
| employees | delete (soft) | `employee.delete` | `requireRole(super_admin)` | - | Secure |
| employees | update **self** | *(none)* | - | profile:update_self (employee) | **Missing** |
| departments | view | `department.list/getById/tree` | `companyProcedure` | people:view_company | Secure |
| departments | create/update | `department.create/update` | `requireRole(super_admin,hr_manager)` | settings/people:manage | Secure |
| departments | delete | `department.delete` | `requireRole(super_admin)` | - | Secure |
| attendance | punch self | `attendance.punchIn/Out/today/myHistory` | `protectedProcedure` (self) | attendance:view_self | Secure |
| attendance | company view | `attendance.list/monthlyReport/exceptions` | `companyProcedure` | attendance:view_company (excl. recruiter) | **Over-permissive** (recruiter reaches it) |
| attendance | punch for employee | `attendance.punchInForEmployee` | `requireRole(super_admin,hr_manager,hr_specialist)` | attendance:manage | Secure |
| attendance | resolve exception | `attendance.resolveException` | `requireRole(...,department_manager)` | attendance:manage | Secure |
| leave | request self | `leave.request.create` | `protectedProcedure` (self-bound) | leave:request_self | Secure (verify ownership binding) |
| leave | company view | `leave.request.list` | `companyProcedure` | leave:view_company (excl. recruiter) | **Over-permissive** (recruiter) |
| leave | approve/reject | `leave.request.updateStatus` | `requireRole(super_admin,hr_manager,department_manager)` | leave:approve | Secure |
| leave | config (types/accrual) | `leave.type.*` / `runAccrual` | `requireRole(super_admin,hr_manager)` | settings | Secure |
| payroll | view | `payroll.*.list/getById` | `requireRole(...PAYROLL_VIEW_ROLES)` | payroll:view_company | Secure |
| payroll | run/create | `payroll.run.create/updateStatus/reopen` | `requireRole(super_admin,hr_manager)` | payroll:run | Secure (payroll_admin **cannot** run - see note) |
| payslip | view self | `payroll.payslip.myLatest` | `protectedProcedure` (self) | payslip:view_self | Secure |
| expenses | submit/edit/cancel self | `expense.create/update/cancel` | `protectedProcedure` + ownership | expenses:submit_self | Secure |
| expenses | list | `expense.list` | `protectedProcedure` | - | **Over-permissive** + **IDOR** (SEC-004) |
| expenses | approve/reject | `expense.approve` | `protectedProcedure` + approver/HR check | expenses:approve | Secure (ownership-based) |
| expenses | mark paid | `expense.markPaid` | `companyProcedure` | finance | **Over-permissive** (any staff role) |
| documents | company view/manage | `document.list/create/update` | `companyProcedure` / `requireRole` | documents:* | Secure |
| documents | view self | `document.myDocuments` | `protectedProcedure` (self) | documents:view_self | Secure |
| documents | generate letter | `document.generateLetter` | `requireRole(super_admin,hr_manager,hr_specialist)` | documents:manage | Secure |
| recruitment | view (jobs/candidates/apps) | `recruitment.*.list/getById` | `protectedProcedure` | recruitment:view (recruiter,HR,dept_mgr) | **Over-permissive** (payroll_admin reaches candidate PII) |
| recruitment | manage | `recruitment.*.create/update` | `requireRole(...,recruiter)` | recruitment:manage | Secure |
| recruitment | candidate self | `recruitment.myApplications/myInterviews` | allowlisted (candidate) | - | Secure |
| performance/retention | view | `retention.*.list/getById` | `protectedProcedure` | performance:view_team (HR,dept_mgr) | **Over-permissive** (recruiter, payroll_admin) |
| performance/retention | manage | `retention.*.create/update/delete` | `requireRole` | performance:manage | Secure |
| performance | own goals | `retention.goal.mine` | `protectedProcedure` (self) | performance:view_self | Secure |
| settlement/offboarding | view | `settlement.list/getByEmployee/getPayload` | `companyProcedure` | (HR finance) | **Over-permissive** (recruiter sees settlement financials) |
| settlement | manage/complete | `settlement.create/complete/initiate/...` | `requireRole` | - | Secure |
| compliance | all | `compliance.*` | `requireRole(super_admin,hr_manager,payroll_admin)` | compliance:manage | Secure |
| qiwa | view | `qiwa.list/getById/getByEmployee` | `requireRole(...PAYROLL_VIEW_ROLES)` | integrations | Secure |
| qiwa | sync/test/dashboard | `qiwa.sync/testConnection/dashboard` | `companyProcedure` | integrations:manage (payroll_admin,HR) | **Over-permissive** (recruiter, dept_mgr) |
| audit log | view | `audit.list` | `requireRole(super_admin,hr_manager)` | - | Secure |
| invites | create/revoke | `invite.create/revoke/resend` | `requireRole(super_admin,hr_manager)` | settings | Secure (tRPC) - **but REST duplicate is not, SEC-001** |
| tenants (registry) | list all | `auth.tenantsList` | in-body `role === super_admin` | platform operator | **Broken (cross-tenant, SEC-002)** |
| company profile | edit | `PATCH /api/company/profile` | session only | settings:manage | **Over-permissive (SEC-003)** |
| company departments | create | `POST /api/company/departments` | session only | people:manage | **Over-permissive (SEC-003)** |
| invitations | create w/ role | `POST /api/company/invite` | session only | settings | **CRITICAL escalation (SEC-001)** |

**Note on `payroll:run`:** the capability model grants `payroll:run` to `payroll_admin`, but the procedure `payroll.run.create` uses `requireRole("super_admin","hr_manager")` - excluding `payroll_admin`. This is **Under-permissive** (capability says yes, backend says no). Reconcile intent.

## 3. Intended capability matrix vs enforcement reality

The intended per-role capability grid is documented in `docs/roles-permissions.md` §4 and remains the design intent for the **UI**. The table above is the **enforced backend reality**. The gaps between the two are exactly the "Over/Under-permissive" and "Missing" rows - the actionable delta this audit exists to surface.

Summary of deltas:
- **6 over-permissive read clusters** (attendance, leave, recruitment PII, retention/performance, settlement financials, qiwa) - all *within-tenant* horizontal over-exposure among staff roles (Medium confidentiality risk, not cross-tenant, not write-escalation).
- **1 IDOR** (`expense.list` `pendingFor`) - SEC-004.
- **1 under-permissive** (`payroll:run` vs `payroll_admin`).
- **1 missing** (`profile:update_self` has no backend path).
- **3 REST-route authorization gaps** (SEC-001 critical, SEC-003 medium x2).
- **1 broken cross-tenant** (SEC-002).

See `05-security-findings.md` for exploitation detail and fixes.
