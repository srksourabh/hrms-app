# 06 - RBAC Test Matrix

**Audit date:** 2026-07-20
**Framework:** Vitest (integration, tRPC caller + REST route handlers) + Playwright (E2E route redirects). Existing RBAC tests live in `packages/auth/src/__tests__/rbac.test.ts` (capability/route unit tests). The tests below target the enforcement gaps in `05-security-findings.md`; each should be added as a failing test first (RED), then pass after the fix.

## 1. Priority regression tests (map 1:1 to findings)

| Test ID | Role | Endpoint / page | Operation | Expected | Verifies |
|---|---|---|---|---|---|
| RBAC-T01 | employee | `POST /api/company/invite {role:"super_admin"}` | create invite | **403** | SEC-001 |
| RBAC-T01b | employee | full invite→accept chain | escalate | no super_admin created | SEC-001 |
| RBAC-T02 | super_admin (tenant A) | `auth.tenantsList` | list tenants | **403** (only platform op) | SEC-002 |
| RBAC-T02b | super_admin (tenant A) | `auth.tenantsList` | - | response has no `schemaName` | SEC-002 |
| RBAC-T03 | employee | `PATCH /api/company/profile` | edit company | **403** | SEC-003 |
| RBAC-T03b | employee | `POST /api/company/departments` | create dept | **403** | SEC-003 |
| RBAC-T04 | recruiter | `expense.list {pendingFor: <other mgr id>}` | read queue | empty / **403** (not caller) | SEC-004 |
| RBAC-T06a | recruiter | `retention.review.list` | read reviews | **403** | SEC-006 |
| RBAC-T06b | payroll_admin | `recruitment.candidate.list` | read PII | **403** | SEC-006 |
| RBAC-T06c | department_manager | `settlement.getByEmployee` | read EOSB | **403** | SEC-006 |
| RBAC-T07 | any | `user.me` | read self | no `passwordHash`/`mfaSecret` in payload | SEC-007 |
| RBAC-T08 | n/a | employees insert | store `_enc` | stored value ≠ plaintext input | SEC-008 |
| RBAC-T09 | recruiter | `qiwa.sync {action:"terminate"}` | gov filing | **403** | SEC-009 |
| RBAC-T10a | recruiter | `recruitment.offer.accept {id:<any>}` | accept offer | **403** / ownership error | SEC-010 |
| RBAC-T10b | employee | `retention.recognition.update {id:<other's>}` | edit any | **403** | SEC-010 |
| RBAC-T11 | recruiter | `attendance.getSubtree` | read GPS/PII | scoped / **403** | SEC-011 |
| RBAC-T12 | payroll_admin | `leave.request.create {employeeId:<other>}` | file leave | **403** / bound to self | SEC-012 |
| RBAC-T13 | department_manager | `retention.goal.create {employeeId:<other team>}` | write | **403** (out of scope) | SEC-013 |

## 2. Cross-cutting scenarios (run each critical procedure through all 10)

For every sensitive procedure, assert the outcome under these actor conditions:

1. **Authorized role** → succeeds.
2. **Unauthorized role** → `FORBIDDEN`.
3. **User from another tenant** (valid record id from tenant B) → `NOT_FOUND`/no rows (tenant DB scoping).
4. **User with no active organisation** (no tenantId) → `UNAUTHORIZED` ("No tenant context").
5. **Deactivated / terminated user** → session rejected (add check; currently not enforced post-issue - see note).
6. **Expired session** (JWT > 30 min idle) → re-auth required.
7. **Modified request payload** (swap `employeeId`/`approverId`/`id`) → ownership check blocks (SEC-004/010/011/012).
8. **Missing permission record / unknown role** → fail-closed (`requireRole` rejects; verified in `rbac.test.ts`).
9. **Invalid role value** in token → `FORBIDDEN` (`isAppRole` guard).
10. **Platform operator** (once introduced) → cross-tenant procedures succeed only here.

## 3. Route-level E2E (Playwright)

| Test | Role | Navigate | Expected |
|---|---|---|---|
| E2E-R1 | employee | `/payroll` (direct URL) | redirect `/?access=denied` |
| E2E-R2 | employee | `/employees` | redirect `/?access=denied` |
| E2E-R3 | candidate | `/leave` | redirect `/?access=denied` |
| E2E-R4 | employee | `/profile` | allowed |
| E2E-R5 | department_manager | `/super-admin` | after SEC-002 fix: denied UI |
| E2E-R6 | recruiter | `/modules/payroll-*` | denial panel (`/modules/[slug]` allowedRoles) |

## 4. Existing coverage & gaps

- **Present:** `rbac.test.ts` covers `can()`, `canAccessRoute`, `canAccessProcedure` (unit level), `totp.test.ts`, `demo-identities.test.ts`.
- **Gap:** no integration tests exercise the tRPC procedures or REST routes with a real role context. The RBAC-T* tests above are the missing layer and should gate CI.
- **Note (deactivated users):** the JWT carries role/tenant for up to 30 min; there is no revocation check on each request. Consider a lightweight "user still active" check for sensitive procedures (out of scope for this audit; logged as future work in `07`).
