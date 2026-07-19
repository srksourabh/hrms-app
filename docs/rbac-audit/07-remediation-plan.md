# 07 - Remediation Plan

**Audit date:** 2026-07-20
Grouped by priority. Each item lists the finding, the smallest safe change, and the files touched. Nothing here has been implemented yet - this is the proposed plan awaiting go-ahead.

## Phase 0 - Immediate security fixes (before any production/customer data)

| # | Finding | Change | Files | Effort |
|---|---|---|---|---|
| 0.1 | SEC-001 | Add role gate to `/api/company/invite` (super_admin/hr_manager) + validate assignable `role`; ideally delete the route and use `invite.create` tRPC. Stop returning the raw token to self-service callers. | `api/company/invite/route.ts`, `settings/team`, `company-setup` | S |
| 0.2 | SEC-002 | Add a platform-operator distinction (new `platform_admin` role or `users.isPlatformOperator`) not mintable via signup/invite; gate `auth.tenantsList` + `/super-admin` on it; drop `schemaName` from the response. | `auth.ts`, `rbac.ts`/`users` schema, `super-admin/page.tsx` | M |
| 0.3 | SEC-007 | Project `user.me` to safe columns only. | `routers/user.ts` | S |
| 0.4 | SEC-009 | `qiwa.sync`/`testConnection` → `requireRole(super_admin,hr_manager,payroll_admin)`; gate `qiwa.dashboard` salary. | `routers/qiwa.ts` | S |
| 0.5 | SEC-005 | Delete demo `seed`/`migrate` HTTP routes (or environment-gate to non-prod). | `api/seed/**`, `api/migrate/**` | S |
| 0.6 | Config | Verify `DEMO_MODE` is unset/false in production. | env / deploy | S |

## Phase 1 - High-priority RBAC corrections

| # | Finding | Change | Files | Effort |
|---|---|---|---|---|
| 1.1 | SEC-003 | Add a `requireRoleInRoute()` helper; apply to `company/profile` PATCH, `company/departments` POST, `setup-complete`. | `api/company/**` | S |
| 1.2 | SEC-004 | Bind `expense.list` `pendingFor` to the session; scope default list by role. | `routers/expense.ts` | S |
| 1.3 | SEC-010 | Ownership checks on offer accept/decline, recognition/survey update; bind create owner ids to session. | `recruitment.ts`, `retention.ts` | M |
| 1.4 | SEC-011 | Scope `attendance.getSubtree` to the caller; restrict GPS fields. | `attendance.ts` | S |
| 1.5 | SEC-012 | Always bind `leave.request.create` to session employee; separate HR "on behalf" path. | `leave.ts` | S |

## Phase 2 - Systemic capability enforcement (closes SEC-006 cluster)

The single highest-leverage backend change:

1. Add a `requireCapability(capability: Capability)` procedure to `apps/web/trpc/server.ts` that checks `can(ctx.user.role, capability)` (reusing the existing `can()` from `rbac.ts`) - fail-closed.
2. Replace bare `protectedProcedure`/`companyProcedure` on **sensitive reads** with the matching capability:
   - `recruitment.*` reads → `requireCapability("recruitment:view")`
   - `retention.*` performance/talent reads → `requireCapability("performance:view_team")`
   - `retention` compensation reads + `settlement` reads + `qiwa.dashboard` → `requireCapability("payroll:view_company")`
   - `document.list/getById` → `requireCapability("documents:view_company")`
   - `ai.assistant.*` writes → `requireCapability("integrations:manage")` or `settings:manage`
3. This makes the **backend consult the same capability model as the UI**, eliminating the UI/enforcement drift that is the root cause of most findings.

| Effort | Files |
|---|---|
| M-L | `server.ts` (+helper), `recruitment.ts`, `retention.ts`, `settlement.ts`, `document.ts`, `qiwa.ts`, `ai.ts` |

## Phase 3 - Data protection (SEC-008)

1. Implement envelope encryption for `iqama_number_enc`, `passport_number_enc`, `bank_iban_enc` (encrypt on write, decrypt on authorized reads) with a KMS/secret-manager key via `packages/config/src/env.ts`.
2. Migration to encrypt existing rows; update seeds.
3. Decide and document which financial columns (salary, EOSB, Qiwa) need encryption vs. access-control-only.

| Effort | Files |
|---|---|
| L | `packages/db` (crypto + migration), employee/payroll paths, `packages/config`, seeds |

## Phase 4 - Page-level UX & consistency

1. Introduce `<Can capability=… />` component + `useCan()` hook backed by `can()`.
2. Replace the 6 ad-hoc `role === "..."` checks and wrap New/Edit/Delete/Approve buttons so hidden actions match server capability. (UX + maintainability; not a security boundary.)
3. Adopt the `/modules/[slug]` `allowedRoles` server-guard pattern for any page that should hard-deny by role.
4. Reconcile `payroll:run` for `payroll_admin` (capability vs `requireRole` mismatch) - pick one and align.
5. Add `profile:update_self` backend path (employees currently cannot edit their own profile).

| Effort | Files |
|---|---|
| M | `apps/web/components/` (new Can/useCan), the 6 pages, `payroll.ts`, `employee.ts` |

## Phase 5 - Department scoping (SEC-013)

Apply `getManagedDepartmentIds` scoping consistently to department_manager paths (retention writes, attendance exceptions, expense/leave lists) or restrict those to HR roles.

## Phase 6 - Automated regression testing

Implement the RBAC-T* integration tests and E2E-R* route tests from `06-rbac-test-matrix.md`; gate CI on them. Add the tenant-isolation and deactivated-user scenarios.

## Phase 7 - Documentation & hardening (future)

- Per-request "user still active" check for sensitive procedures (JWT revocation gap).
- Consider Postgres RLS as defense-in-depth behind the schema/`search_path` isolation.
- Rename/annotate `_enc` columns until encryption lands so their state is not misrepresented.

## Suggested sequencing

Phase 0 → Phase 1 → Phase 6 (tests for 0/1) → Phase 2 → Phase 3 → Phase 4/5. Phases 0-1 are small, surgical, and independently shippable; Phase 2 is the structural fix; Phase 3 is the largest (encryption).
