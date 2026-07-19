# 08 - Change Log

**Audit date:** 2026-07-20

## Audit phase (this deliverable)

**No application code was changed.** This phase produced the audit documentation only, per the execution rule "begin by auditing; do not immediately rewrite the RBAC system."

Files created (documentation only):

- `docs/rbac-audit/01-application-route-map.md`
- `docs/rbac-audit/02-role-catalogue.md`
- `docs/rbac-audit/03-permission-matrix.md`
- `docs/rbac-audit/04-page-feature-audit.md`
- `docs/rbac-audit/05-security-findings.md`
- `docs/rbac-audit/06-rbac-test-matrix.md`
- `docs/rbac-audit/07-remediation-plan.md`
- `docs/rbac-audit/08-change-log.md` (this file)
- `docs/rbac-audit/09-executive-summary.md`

## Implementation phase - Phase 0 (applied 2026-07-20)

Phase 0 emergency fixes implemented and verified (`apps/web` typecheck clean; no new lint errors introduced).

### 2026-07-20 — SEC-001 — Invite privilege escalation closed
- Change: `POST /api/company/invite` now requires the caller be `super_admin`/`hr_manager` (403 otherwise) and validates the assignable role against an allowlist `["hr_manager","department_manager","payroll_admin","employee"]` — `super_admin` can no longer be assigned via invite. Mirrors the tRPC `invite.create` gate.
- Files: `apps/web/app/api/company/invite/route.ts`
- Test required: RBAC-T01/T01b

### 2026-07-20 — SEC-007 — `user.me` credential leak closed
- Change: added an explicit safe-column projection; `passwordHash` and `mfaSecret` are no longer returned to the client.
- Files: `apps/web/trpc/routers/user.ts`
- Test required: RBAC-T07

### 2026-07-20 — SEC-009 — Qiwa government actions re-gated
- Change: `qiwa.sync`, `qiwa.testConnection`, `qiwa.dashboard` moved from `companyProcedure` to `requireRole(super_admin, hr_manager, payroll_admin)`. Recruiter/department_manager can no longer create/terminate Qiwa contracts or read the salary-bearing dashboard. Removed now-unused `companyProcedure` import.
- Files: `apps/web/trpc/routers/qiwa.ts`
- Test required: RBAC-T09

### 2026-07-20 — SEC-002 — Cross-tenant registry disclosure closed
- Change: `auth.tenantsList` no longer gates on the per-tenant `super_admin` role. It now requires the caller's email be in an env allowlist `PLATFORM_ADMIN_EMAILS` (comma-separated), fail-closed when unset — a true platform-operator boundary. Internal `schemaName` removed from the response and from the `/super-admin` UI (filter, column header, cell).
- Files: `apps/web/trpc/routers/auth.ts`, `apps/web/app/(dashboard)/super-admin/page.tsx`
- **Deploy note:** set `PLATFORM_ADMIN_EMAILS` in the environment to the operator email(s) or the `/super-admin` page will (correctly) deny everyone.
- Test required: RBAC-T02/T02b

### 2026-07-20 — SEC-005 — Demo seed/migrate routes disabled in production
- Change: `/api/seed/demo-data`, `/api/migrate/fix-critical-bugs`, `/api/migrate/fix-schema-drift` now return 404 when `NODE_ENV === "production"` (kept for demo/staging use). Token gate retained.
- Files: `apps/web/app/api/seed/demo-data/route.ts`, `apps/web/app/api/migrate/fix-critical-bugs/route.ts`, `apps/web/app/api/migrate/fix-schema-drift/route.ts`

### Verification
- `apps/web` `tsc --noEmit`: **pass**.
- Lint: no new errors from these changes; 17 pre-existing `any`/unused-var errors remain in untouched code regions.
- Pre-existing (not addressed, unrelated to this work): `packages/documents/src/letters.ts:123` unused `company` var fails `pnpm typecheck` at the monorepo level.

## Implementation phase - Phase 1 (applied 2026-07-20)

High-priority RBAC corrections. `apps/web` typecheck clean; rbac unit tests pass (6/6); no new lint errors.

### SEC-003 — Custom REST routes role-gated
- Change: added shared helper `apps/web/lib/route-auth.ts` (`forbidIfNotRole`, `COMPANY_ADMIN_ROLES`). Applied to `PATCH /api/company/profile`, `POST /api/company/departments`, `POST /api/company/setup-complete` — now require `super_admin`/`hr_manager`. (Signup/onboarding still works — the onboarding user is a super_admin.)
- Files: `apps/web/lib/route-auth.ts` (new), `api/company/profile/route.ts`, `api/company/departments/route.ts`, `api/company/setup-complete/route.ts`

### SEC-004 — `expense.list` IDOR + scope
- Change: `pendingFor` now uses the session employee id, not a client value (was an IDOR). Roles without company-wide sight (department_manager, recruiter) are scoped to their own expenses + their approval queue; only HR/finance (`EXPENSE_COMPANY_ROLES`) see tenant-wide.
- Files: `apps/web/trpc/routers/expense.ts`

### SEC-010 — IDOR writes closed
- Change: `recruitment.offer.accept`/`decline` → `requireRole("super_admin","hr_manager")` (was bare protectedProcedure, any staff could act on any offer). `retention.recognition.create` binds `fromEmployeeId` to the session; `recognition.update` → `requireRole`. `retention.surveyResponse.create`/`update` → `requireRole`.
- Files: `apps/web/trpc/routers/recruitment.ts`, `apps/web/trpc/routers/retention.ts`

### SEC-011 — `attendance.getSubtree` scoped
- Change: → `requireCapability("attendance:view_company")`; department_manager is constrained to their own reporting subtree (cannot pass an arbitrary root to read the whole org's GPS/PII).
- Files: `apps/web/trpc/routers/attendance.ts`

### SEC-012 — `leave.request.create` bound to session
- Change: only HR roles may file on behalf of another employee (`LEAVE_ONBEHALF_ROLES`); every other role is bound to their own session employee (a client `employeeId` is no longer trusted for staff roles).
- Files: `apps/web/trpc/routers/leave.ts`

## Implementation phase - Phase 2 (applied 2026-07-20)

Systemic capability enforcement — closes the SEC-006 over-permissive-read cluster.

### New primitive
- Added `requireCapability(capability)` to `apps/web/trpc/server.ts`. It consults the SAME capability model the UI uses (`can()` from `rbac.ts`), so backend authorization and navigation agree. Fail-closed.

### Applied to sensitive reads
- **recruitment.ts** — all 18 `list`/`getById` reads (candidate PII, background/reference checks, offers) → `requireCapability("recruitment:view")`.
- **retention.ts** — 48 performance/talent/succession/stay-interview/survey/recognition reads → `requireCapability("performance:view_team")`; 6 compensation reads (plans, adjustments, total-rewards) → `requireCapability("payroll:view_company")` (excludes department_manager).
- **settlement.ts** — `list`/`getByEmployee`/`getPayload` (EOSB financials) → `requireCapability("payroll:view_company")`.
- **document.ts** — `list`/`getById` → `requireCapability("documents:view_company")`.
- **ai.ts** — `assistant.create`/`update`/`delete` → `requireCapability("settings:manage")`; `suggestion.list` → `requireCapability("performance:view_team")`.
- Removed the now-unused `companyProcedure` import from settlement.ts and document.ts.
- Net effect: recruiter/payroll_admin/department_manager can no longer read data outside their capability set. Self-service (`*.mine`, `myDocuments`, `myApplications`, etc.) and employee/candidate allowlists are unaffected.

### Verification (Phases 1 + 2)
- `apps/web` `tsc --noEmit`: **pass**.
- rbac unit tests: **6/6 pass**.
- Lint: no new errors introduced; pre-existing `any`/non-null-assertion debt unchanged.

### Remaining (Phases 3-7)
Not yet implemented: SEC-008 (encryption at rest — largest), SEC-013 (broader department scoping), the `<Can>`/`useCan` UX layer, `payroll:run` reconciliation, `profile:update_self` backend, and the RBAC integration test suite (doc 06). See `07-remediation-plan.md`.

---

## Format for subsequent entries

```
### <date> — <finding id> — <short title>
- Change: <what changed>
- Files: <paths>
- Tests: <RBAC-T* added/passing>
- Verification: build / typecheck / test / lint results
- Regression check: <what was confirmed not broken>
```

Recommended first commit (smallest, highest-impact): SEC-001 (invite escalation) + SEC-007 (`user.me` projection) - both are surgical, low-regression-risk, and close a Critical + a High finding.
