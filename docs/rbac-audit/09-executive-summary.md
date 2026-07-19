# 09 - Executive Summary

**Application:** hrms-app (Saudi HR SaaS - Next.js 16, tRPC, Drizzle, PostgreSQL, NextAuth)
**Audit date:** 2026-07-20
**Auditor scope:** full RBAC, multi-tenant isolation, page/feature/API/DB permission review. Documentation phase only - no code changed yet.

## RBAC maturity score: 58 / 100

**In plain English:** the foundation is genuinely good - tenant data is walled off cleanly, logins are hardened, the audit trail can't be tampered with, and most "write" actions (create/edit/delete/run payroll) are correctly locked to the right roles. But there is **one critical hole that lets any logged-in user make themselves a super admin**, a **cross-tenant leak** that lets any customer see every other customer's basic details, sensitive data (national IDs, bank numbers, salaries) is **stored unencrypted despite column names implying otherwise**, and a broad pattern where **staff roles can *read* data they shouldn't** because the backend doesn't check the same permission rules the menus do. None of these require exotic skill to exploit. They must be fixed before real customer data goes in.

## What's strong (keep it)

- **Tenant isolation:** each company's data lives in its own Postgres schema, selected from the server-side session - one tenant cannot reach another's records through the app's data layer.
- **Auth hardening:** account lockout with backoff, optional MFA, 30-minute idle timeout, login rate-limiting, bcrypt cost 12.
- **Tamper-proof audit log:** database triggers block any edit/delete of audit rows.
- **Most mutations are correctly role-gated** via a clean, centralized `requireRole` pattern; payroll/compliance/notifications/MFA routers are clean.

## Critical vulnerabilities

1. **SEC-001 (Critical) - anyone can become super_admin.** The `/api/company/invite` endpoint has no role check and accepts the role from the request body. A regular employee can invite (and then activate) a brand-new super_admin account in seconds.

## Cross-tenant risks

2. **SEC-002 (High) - every customer can list every other customer.** "super_admin" is a per-tenant role (each signup creates one), but the platform admin screen treats it as a platform operator. Any tenant owner can pull the full tenant registry: company names, commercial-registration numbers, internal database schema names, plan tiers, and recent user emails across all tenants. There is no separation between "tenant owner" and "platform operator."

## Other high findings

3. **SEC-007 (High)** - `user.me` sends the caller's password hash and MFA secret to the browser.
4. **SEC-008 (High)** - national IDs, passports, and bank IBANs are stored in plaintext even though columns are named `_enc`; no encryption exists anywhere. Salary/settlement/Qiwa financials are also plaintext. A PDPL (Saudi data-protection) exposure.
5. **SEC-009 (High)** - the government "Qiwa" sync (which can **terminate** an employee's labor contract) is callable by roles like recruiter and department manager.

## Coverage

| Item | Count |
|---|---|
| Pages audited | 80+ routes (auth, public, dashboard) |
| Roles audited | 8 (super_admin, hr_manager, department_manager, hr_specialist, payroll_admin, recruiter, employee, candidate) |
| Capabilities audited | 33 |
| tRPC routers / procedures | 22 routers, ~180 procedures |
| Custom REST routes | 11 |
| DB tables (public + tenant) | 6 registry + ~35 tenant |
| DB policies | Append-only audit triggers present; **no Row-Level Security** (schema isolation only) |
| Automated RBAC tests | Unit-level present (`rbac.test.ts`); **integration/route RBAC tests missing** (specified in doc 06) |

## Findings by severity

| Severity | Count | Resolved | Pending |
|---|---:|---:|---:|
| Critical | 1 | 0 | 1 |
| High | 4 | 0 | 4 |
| Medium | 7 | 0 | 7 |
| Low-Medium | 1 | 0 | 1 |
| **Total** | **13** | **0** | **13** |

## Page optimisation findings

| Category | Count |
|---|---:|
| Features to add (masking, `<Can>` wrapper, empty-states, request-access) | ~8 |
| Features to hide by role (unconditional New/Edit/Delete/Approve buttons) | ~10 pages |
| Duplicate features (REST route duplicating a gated tRPC procedure) | 3 (invite, departments, profile) |
| Misplaced administrative actions (`/super-admin` reachable by tenant owners) | 1 |
| Missing capability path (`profile:update_self` has no backend) | 1 |
| Under-permissive (`payroll_admin` cannot run payroll despite capability) | 1 |

## Top critical issues (with file paths)

1. `apps/web/app/api/company/invite/route.ts:10-15` - no role check, role from body (SEC-001).
2. `apps/web/trpc/routers/auth.ts:63-101` - `tenantsList` gated on per-tenant `super_admin` (SEC-002).
3. `apps/web/trpc/routers/user.ts:4` - returns `passwordHash`/`mfaSecret` (SEC-007).
4. `packages/db/src/schema/tenant/employees.ts:51-53` - plaintext `_enc` columns; no crypto in codebase (SEC-008).
5. `apps/web/trpc/routers/qiwa.ts:219` - `sync` (create/terminate) on `companyProcedure` (SEC-009).

## Immediate decisions required

1. **Approve Phase 0 emergency fixes** (SEC-001, 002, 007, 009, 005) - all small and surgical. Recommended to do now.
2. **Decide the platform-admin model** for SEC-002: dedicated `platform_admin` role vs. `isPlatformOperator` flag.
3. **Commit to encryption-at-rest** (SEC-008) scope: which columns, and the key-management approach (this is the largest single effort).
4. **Confirm `DEMO_MODE` is off in production** and remove demo seed/migrate routes.

## Recommended implementation phases

Ordered plan (detail in `07-remediation-plan.md`):

1. **Critical security fixes** - invite escalation, `user.me`, Qiwa sync, remove demo routes.
2. **Tenant isolation fix** - platform-vs-tenant role separation for `tenantsList`/`/super-admin`.
3. **Backend authorization** - add `requireCapability()` and apply to sensitive reads (closes the systemic over-permissive-read cluster).
4. **Database protection** - encryption at rest for regulated PII; consider RLS as defense-in-depth.
5. **Role/permission standardisation** - reconcile `payroll:run`, add `profile:update_self`.
6. **Page-level optimisation** - `<Can>` wrapper + `useCan()`, hide privileged buttons, field masking.
7. **Automated regression testing** - RBAC integration + E2E route tests, gate CI.
8. **Documentation** - keep this audit set current as fixes land (`08-change-log.md`).

---

### Final recommendation

The app is **not yet ready for production customer data** as-is, but it is close: the architecture is sound and the fixes are well-scoped. Phase 0 (the Critical + High fixes) is a few hours of surgical work and should be done immediately. Encryption-at-rest (SEC-008) and the systemic capability-enforcement change (SEC-006) are the two larger workstreams to schedule before launch.
