# 02 - Role Catalogue

**Audit date:** 2026-07-20
**Sources of truth:** `packages/auth/src/rbac.ts` (roles + capabilities), `packages/db/src/schema/public/users.ts` (DB enum), `packages/auth/src/demo-identities.ts` (demo personas)

## 1. Canonical roles

The role list is **consistent** across code and database: both `rbac.ts:1-10` (`appRoles`) and the Postgres `user_role` enum (`users.ts:4-13`) declare the same 8 roles. (A prior model-mismatch noted in `docs/roles-permissions.md` - the DB enum missing `payroll_admin`/`recruiter` - has since been resolved.)

| # | Role code | Tier | Scope | Description |
|---|---|---|---|---|
| 1 | `super_admin` | **Tenant owner** | Whole tenant | Every capability. Created automatically for each new tenant at signup (`auth.ts:34`). |
| 2 | `hr_manager` | Staff | Whole tenant | All capabilities except `dashboard:view_employee`. |
| 3 | `department_manager` | Staff | **Own department(s)** (intended) | Team views, leave/expense approval, team performance, reports. |
| 4 | `hr_specialist` | Staff | Whole tenant | People ops, documents, recruitment, compliance, performance, cases. Cannot run payroll or change settings. |
| 5 | `payroll_admin` | Staff | Whole tenant | Payroll run + view, compliance, integrations. No people/recruitment management. |
| 6 | `recruiter` | Staff | Whole tenant | Recruitment only + company people view + reports. |
| 7 | `employee` | Self | **Own records only** | Self-service: profile, leave, payslip, own documents, own expenses, own goals/skills. |
| 8 | `candidate` | External | Own application | Profile + own applications/interviews only. |

## 2. Naming consistency

- **No duplicate or ambiguous role names.** A single canonical `snake_case` vocabulary is used in code, DB enum, JWT claim, middleware, and sidebar. No `admin`/`Admin`/`administrator` drift.
- Role is carried in the NextAuth JWT (`role` claim) and mirrored into the session (`packages/auth/src/index.ts:205-213`). Middleware reads it from the signed token (`middleware.ts:88-93`).

## 3. The critical scope gap: platform vs tenant

**There is no platform-operator role.** `super_admin` is a *per-tenant* role - `users.tenantId` is `NOT NULL` (`users.ts:18-20`) and every signup creates a `super_admin` bound to the new tenant (`auth.ts:28-37`).

Consequence: any procedure that treats `role === "super_admin"` as "platform administrator" is actually reachable by **every tenant's owner**. This is exploited by `auth.tenantsList` (see `05-security-findings.md` SEC-002). Implementation standard #8 ("separate platform roles from organisation roles") is **violated**.

**Recommendation:** introduce a distinct platform capability - either a dedicated `platform_admin` role that is never mintable via tenant signup/invite, or an `isPlatformOperator` boolean on `users` (default false, settable only out-of-band). Gate all cross-tenant/registry procedures on that, not on `super_admin`.

## 4. Scope model per role

The permission scopes actually implemented:

| Scope | Roles it should apply to | Enforced where |
|---|---|---|
| Platform (all tenants) | *(none exists - gap)* | `auth.tenantsList` mis-gates on `super_admin` |
| Tenant (all records) | super_admin, hr_manager, hr_specialist, payroll_admin, recruiter | tenant DB handle + `companyProcedure`/`requireRole` |
| Department (own team) | department_manager | `getManagedDepartmentIds` (`trpc/scoping.ts`) - **applied only in `employee.list`; not consistently elsewhere** |
| Self (own records) | employee, candidate | ownership checks + `canAccessProcedure` allowlist |

**Note:** department-level scoping is implemented for the employee list (`employee.ts:24-28`) but is **not applied** to most other company reads a department_manager can reach (attendance reports, retention, expenses tenant-wide list). See `05-security-findings.md` SEC-006.

## 5. Demo identities

`DEMO_MODE=true` exposes 4 login personas (`demo-identities.ts`): HR Manager, HR Specialist, Department Manager, Employee. `resolveDemoIdentity` returns `null` when demo mode is off, so demo credentials cannot be used in production. Demo sessions carry a fixed demo tenant context. **Confirm `DEMO_MODE` is unset/false in the production environment before launch.**
