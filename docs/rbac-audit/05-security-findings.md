# 05 - Security Findings

**Audit date:** 2026-07-20
**Method:** manual read of every enforcement primitive, tRPC router, custom REST route, middleware, and schema, plus targeted exploitation reasoning. Tenant DB isolation is schema-per-tenant resolved from the session (structurally sound); findings therefore concentrate in (a) the shared registry surface and (b) capability enforcement for staff roles.

## Severity summary

| ID | Severity | Title |
|---|---|---|
| SEC-001 | **Critical** | Privilege escalation via unguarded `POST /api/company/invite` (any user → super_admin) |
| SEC-002 | **High** | Cross-tenant registry disclosure via `auth.tenantsList` (no platform-vs-tenant role separation) |
| SEC-007 | **High** | `user.me` returns `passwordHash` + `mfaSecret` to the browser |
| SEC-008 | **High** | Sensitive PII & all financial data stored in plaintext despite `_enc` naming (no encryption at rest) |
| SEC-009 | **High** | `qiwa.sync` (government create/terminate) callable by roles without payroll/integration rights |
| SEC-003 | Medium | Custom `/api/company/*` REST routes miss role checks (profile PATCH, departments POST) |
| SEC-004 | Medium | `expense.list` IDOR (`pendingFor`) + tenant-wide over-exposure |
| SEC-006 | Medium | Over-permissive company-wide reads (capabilities ignored for staff roles) |
| SEC-010 | Medium | IDOR writes: offer accept/decline, recognition/survey update-any, spoofed create |
| SEC-011 | Medium | `attendance.getSubtree` dumps all-employee GPS + PII, ignores scope arg |
| SEC-012 | Medium | `leave.request.create` trusts client `employeeId` for staff roles |
| SEC-005 | Medium | Demo seed/migrate endpoints shipped in repo (raw SQL, hardcoded customer schema) |
| SEC-013 | Low-Med | Department-manager reads/writes not department-scoped (broken team scope) |

---

## SEC-001 — Privilege escalation via unguarded invite REST route

- **Severity:** Critical
- **Affected role:** any authenticated role, including base `employee`
- **Affected page:** `/settings/team`, `/company-setup` (both post to this route)
- **Affected endpoint:** `POST /api/company/invite` (`apps/web/app/api/company/invite/route.ts`)
- **Affected DB table:** `public.users`, `tenant.employee_invitations`, `public.invite_token_index`
- **Current behaviour:** the handler checks only `session?.user?.tenantId` (authenticated) - **no role check** - and reads `role` from the request body (`route.ts:15`: `const { email, role = "employee" } = body`). It writes an invitation with that arbitrary role and returns the invite row **including its `token`** in the 201 response (`route.ts:74`). The public `invite.acceptInvite` procedure then creates a `users` row with `role: invite.role` (`invite.ts:213-220`).
- **Expected behaviour:** invitation creation must be gated to `super_admin`/`hr_manager` (as the tRPC twin `invite.create` already is - `invite.ts:26` uses `requireRole("super_admin","hr_manager")`), and the assignable role must be validated against an allowlist that excludes elevating above the inviter.
- **Exploitation scenario:** a logged-in `employee` sends `POST /api/company/invite {"email":"attacker@evil.com","role":"super_admin"}`, reads the returned `token`, then calls `acceptInvite {token, password}`. A brand-new `super_admin` account now exists in their tenant - no email delivery or interception required. Chained with SEC-002, that account then enumerates every other tenant.
- **Recommended fix:** add a server-side role gate at the top of the handler (`super_admin`/`hr_manager` only) and validate `role` against an allowlist; do not return the raw token in the response for self-service callers. Prefer deleting the REST route entirely and routing the UI through the already-guarded `invite.create` tRPC procedure.
- **Files requiring changes:** `apps/web/app/api/company/invite/route.ts` (or remove it; repoint `settings/team` + `company-setup` to `api.invite.create`).
- **Test required:** RBAC-T01 (employee → invite super_admin → expect 403).

## SEC-002 — Cross-tenant registry disclosure

- **Severity:** High
- **Affected role:** any tenant's `super_admin` (every tenant owner is one)
- **Affected page:** `/super-admin`
- **Affected endpoint:** `auth.tenantsList` (`apps/web/trpc/routers/auth.ts:63-101`)
- **Affected DB table:** `public.tenants`, `public.users`
- **Current behaviour:** the procedure gates on `role === "super_admin"` and returns **all tenants** (company name, CR number, `schemaName`, plan tier, regulatory context) plus the 15 most recent users across **all tenants** (email, name, role, tenantId). Because `super_admin` is a per-tenant role minted at every signup (`auth.ts:34`) and there is no platform-operator distinction (`02-role-catalogue.md` §3), any tenant owner passes this gate.
- **Expected behaviour:** cross-tenant registry data must be restricted to a true platform operator that cannot be created via tenant signup or invite.
- **Exploitation scenario:** a customer signs up (becoming `super_admin` of their own tenant) and calls `auth.tenantsList`, harvesting every other customer's company name, CR number, internal Postgres `schemaName`, plan tier, and recent user emails/roles - a competitor-intelligence and PDPL breach. Exposing `schemaName` also reveals the internal isolation key for other tenants.
- **Recommended fix:** introduce a `platform_admin` role (or `users.isPlatformOperator` boolean) that is never assignable through signup/invite, and gate `auth.tenantsList` (and `/super-admin`) on it. Remove `schemaName` from any response.
- **Files requiring changes:** `apps/web/trpc/routers/auth.ts`, `packages/auth/src/rbac.ts` (or `users` schema), `apps/web/app/(dashboard)/super-admin/page.tsx`.
- **Test required:** RBAC-T02 (tenant super_admin → tenantsList → expect 403).

## SEC-007 — `user.me` leaks password hash and MFA secret

- **Severity:** High
- **Affected role:** every authenticated user (own record)
- **Affected endpoint:** `user.me` (`apps/web/trpc/routers/user.ts:4`)
- **Affected DB table:** `public.users`
- **Current behaviour:** returns the caller's entire `users` row with no column projection, including `passwordHash` (bcrypt) and `mfaSecret` (TOTP seed) - confirmed columns `users.ts:22,28`.
- **Expected behaviour:** never send credential material to the client; select explicit safe columns (id, email, name, role, tenantId, preferredLanguage, employeeId).
- **Exploitation scenario:** any user opens dev tools / the tRPC response and reads their own bcrypt hash (offline-crackable) and TOTP secret (lets them - or anyone who sees the response, e.g. via a logging/proxy layer - generate valid MFA codes, defeating MFA). A stored-XSS or malicious browser extension could exfiltrate both.
- **Recommended fix:** add a `columns: { … }` projection to the query (allowlist safe fields) or map to a DTO before returning.
- **Files requiring changes:** `apps/web/trpc/routers/user.ts`.
- **Test required:** RBAC-T07 (assert response contains no `passwordHash`/`mfaSecret`).

## SEC-008 — Sensitive PII and financial data stored in plaintext (no encryption at rest)

- **Severity:** High (compliance + confidentiality)
- **Affected role:** n/a (data-at-rest)
- **Affected DB table:** `tenant.employees`, `tenant.payslips`, `tenant.final_settlements`, `tenant.payroll_runs`, `tenant.qiwa_contracts`
- **Current behaviour:** columns named with an `_enc` suffix - `iqama_number_enc`, `passport_number_enc`, `bank_iban_enc` (`employees.ts:51-53`) - are plain `text` and store cleartext (writers put raw values in: `api/seed/demo-data/route.ts:113-126`, `scripts/seed-rukn-energy.ts:597-609`). **No encrypt/decrypt exists anywhere** in the codebase (no cipher/AES/key-from-env; `pgcrypto` is enabled but never used on these columns; `packages/payroll/src/mudad.ts:82-85` explicitly notes decoding is "out of scope"). All salary components, GOSI breakdowns, EOSB settlement amounts, and Qiwa contract salaries are likewise plaintext.
- **Expected behaviour:** national ID/iqama, passport, and bank IBAN are regulated personal data under Saudi PDPL and must be encrypted at rest (application-level envelope encryption or `pgp_sym_encrypt` with a KMS-managed key); the `_enc` naming currently misrepresents the protection state.
- **Exploitation scenario:** any read path, DB backup, replica, log, or a successful SQL/registry compromise exposes national IDs, passports, and bank IBANs in cleartext for the entire workforce. The misleading column names also risk a false "it's encrypted" assumption during incident response.
- **Recommended fix:** implement envelope encryption for the three `_enc` columns (encrypt on write, decrypt on the few authorized read paths) with a key from a secret manager; add a migration to encrypt existing rows; document which financial columns require encryption vs. access-control-only protection. Until implemented, rename or flag the columns so their state is not misrepresented.
- **Files requiring changes:** `packages/db` (crypto helper + migration), employee/payroll write+read paths, `packages/config/src/env.ts` (key), seeds.
- **Test required:** integration test asserting stored value ≠ input for `_enc` columns.

## SEC-009 — Government sync (create/terminate) callable by wrong roles

- **Severity:** High
- **Affected role:** `recruiter`, `department_manager` (any staff role)
- **Affected endpoint:** `qiwa.sync` (`apps/web/trpc/routers/qiwa.ts:219`)
- **Current behaviour:** `sync` is only `companyProcedure`, yet it submits create/update/**terminate** actions for an employee to the Qiwa government platform and writes a `qiwa_contracts` (salary) row. Roles with no payroll/integration capability can trigger it for any employee by id. `qiwa.dashboard` (`qiwa.ts:457`) also leaks `qiwa_contracts.salary` to those roles.
- **Expected behaviour:** government-filing actions must be `requireRole` (super_admin, hr_manager, payroll_admin) and the salary-bearing dashboard restricted to `PAYROLL_VIEW_ROLES`.
- **Exploitation scenario:** a `recruiter` calls `qiwa.sync {employeeId, action:"terminate"}`, filing a wrongful termination of any employee's labor contract with the government - a high-impact, outward-facing, hard-to-reverse action.
- **Recommended fix:** change `sync`/`testConnection` to `requireRole(...)`; gate `dashboard` on payroll roles or strip salary.
- **Files requiring changes:** `apps/web/trpc/routers/qiwa.ts`.
- **Test required:** RBAC-T09 (recruiter → qiwa.sync → expect 403).

## SEC-003 — Custom `/api/company/*` REST routes miss role checks

- **Severity:** Medium
- **Affected role:** any authenticated user (incl. employee)
- **Affected endpoints:** `PATCH /api/company/profile`, `POST /api/company/departments`, `POST /api/company/setup-complete`
- **Current behaviour:** each checks `session?.user?.tenantId` only, no role check. `PATCH /api/company/profile` lets any user edit company industry/size/website; `POST /api/company/departments` lets any user create departments; `setup-complete` lets any user flip onboarding state. All are tenant-scoped (no cross-tenant risk).
- **Expected behaviour:** gate on `super_admin`/`hr_manager` to match the tRPC equivalents (`department.create` is `requireRole`).
- **Exploitation scenario:** a disgruntled employee rewrites the company profile or spams departments.
- **Recommended fix:** add a shared `requireRoleInRoute(session, [...])` helper and apply to every state-changing custom route; or migrate these to tRPC.
- **Files requiring changes:** `apps/web/app/api/company/profile/route.ts`, `.../departments/route.ts`, `.../setup-complete/route.ts`.
- **Test required:** RBAC-T03.

## SEC-004 — `expense.list` IDOR and tenant-wide over-exposure

- **Severity:** Medium
- **Affected role:** any staff role
- **Affected endpoint:** `expense.list` (`apps/web/trpc/routers/expense.ts:33-79`)
- **Current behaviour:** the `pendingFor` branch (`expense.ts:40-51`) filters on the **client-supplied** `input.pendingFor` approver id with no check that it equals the caller - any staff user can read the pending-approval queue (amounts, descriptions, employee names) of any manager. Separately, the fallback branch returns the **whole tenant's** expenses to every non-employee role (recruiter, department_manager included), rather than scoping department_manager to their reports.
- **Expected behaviour:** bind `pendingFor` to `ctx.user.employeeId` (or validate the caller manages that approver); scope the default list by role.
- **Recommended fix:** ignore client `pendingFor` and use the session employee id; add department scoping for department_manager.
- **Files requiring changes:** `apps/web/trpc/routers/expense.ts`.
- **Test required:** RBAC-T04.

## SEC-006 — Over-permissive company-wide reads (capabilities ignored for staff roles)

- **Severity:** Medium (systemic; within-tenant confidentiality)
- **Affected roles:** `recruiter`, `payroll_admin`, `department_manager` (varies by resource)
- **Affected endpoints (bare `protectedProcedure`/`companyProcedure` reads):**
  - `retention.*` list/getById - performance reviews, 9-box talent ratings, succession plans, stay interviews, **compensation plans/adjustments/total-rewards (financial)**, survey responses joined to employee.
  - `recruitment.*` list/getById - **candidate PII, background-check results (criminal/credit), reference checks, offer compensation**.
  - `settlement.list/getByEmployee/getPayload` - **EOSB amounts, exit-interview content**.
  - `document.list/getById` - employee documents (contracts, IDs).
  - `attendance.list/monthlyReport/exceptions`, `leave.request.list` - reachable by recruiter (low sensitivity).
  - `ai.suggestion.list` - per-employee AI suggestions.
- **Current behaviour:** `protectedProcedure`/`companyProcedure` authorize by "not employee/candidate," ignoring the capability model. Roles read sensitive data their capabilities exclude.
- **Expected behaviour:** each read gated to the roles holding the matching capability (`performance:view_team`, `recruitment:view`, `payroll:view_company`, `documents:view_company`).
- **Recommended fix:** introduce capability-checking procedures (e.g. `requireCapability("recruitment:view")`) and apply to these reads. This is the systemic fix that closes the whole cluster - see `07-remediation-plan.md`.
- **Files requiring changes:** `apps/web/trpc/server.ts` (new helper), `retention.ts`, `recruitment.ts`, `settlement.ts`, `document.ts`, `ai.ts`, `qiwa.ts`.
- **Test required:** RBAC-T06 matrix (per role × resource).

## SEC-010 — IDOR writes (accept/decline/update-any, spoofed create)

- **Severity:** Medium
- **Affected endpoints:**
  - `recruitment.offer.accept` / `decline` (`recruitment.ts:514,525`) - `protectedProcedure`, mutate **any** offer by id, no ownership/role check.
  - `retention.recognition.update` (`retention.ts:1189`) and `retention.surveyResponse.update` (`retention.ts:1061`) - update **any** row by id, no ownership check.
  - `retention.surveyResponse.create` / `recognition.create` - trust client `employeeId`/`fromEmployeeId` (spoofing).
  - `recruitment.application.create` / `referral.create` - trust full client payload with no session binding.
- **Current behaviour:** client-supplied ids/owners are trusted; any staff (some reachable by employee via allowlist?) can act on records they don't own.
- **Expected behaviour:** verify the record belongs to the caller (or the caller has the managing capability); bind owner ids to the session.
- **Recommended fix:** add ownership checks and session-bound owner fields; gate offer accept/decline to the candidate/authorized role.
- **Files requiring changes:** `apps/web/trpc/routers/recruitment.ts`, `retention.ts`.
- **Test required:** RBAC-T10.

## SEC-011 — `attendance.getSubtree` dumps all-employee GPS + PII

- **Severity:** Medium
- **Affected endpoint:** `attendance.getSubtree` (`apps/web/trpc/routers/attendance.ts:709`)
- **Current behaviour:** `protectedProcedure`; takes a client `rootEmployeeId` but ignores it and loads **every** employee, returning the org tree plus each employee's last known GPS `lat`/`lng`, managerId and status. Any staff role gets company-wide location tracking.
- **Expected behaviour:** scope to the caller's subtree (managed departments / reporting line); gate location data to authorized roles.
- **Recommended fix:** derive the root from the session, scope the query, and restrict GPS fields.
- **Files requiring changes:** `apps/web/trpc/routers/attendance.ts`.
- **Test required:** RBAC-T11.

## SEC-012 — `leave.request.create` trusts client `employeeId` for staff roles

- **Severity:** Medium
- **Affected endpoint:** `leave.request.create` (`apps/web/trpc/routers/leave.ts:160`)
- **Current behaviour:** session binding of `employeeId` is applied only when `role === "employee"`; every other staff role can pass an arbitrary `input.employeeId`, filing leave for any employee. Not `requireRole`-gated.
- **Expected behaviour:** either bind to the session for self-service, or require an HR capability to file on behalf of others (and audit it).
- **Recommended fix:** always bind self-service to the session employee; add a separate HR-gated "file on behalf" path.
- **Files requiring changes:** `apps/web/trpc/routers/leave.ts`.
- **Test required:** RBAC-T12.

## SEC-005 — Demo seed/migrate endpoints shipped in repo

- **Severity:** Medium (operational)
- **Affected endpoints:** `/api/seed/demo-data`, `/api/migrate/fix-critical-bugs`, `/api/migrate/fix-schema-drift`
- **Current behaviour:** token-gated via `MIGRATION_TOKEN` (fail-closed when unset - good), but they execute raw SQL string-built statements, operate on `adminDb` (registry level), and `fix-critical-bugs` hardcodes a real customer schema name (`rukn_energy_services`). Comments say "delete after the demo."
- **Expected behaviour:** administrative/destructive migration endpoints should not exist as public HTTP routes in production; migrations belong in the drizzle migration pipeline.
- **Exploitation scenario:** if `MIGRATION_TOKEN` leaks (it's a single static shared secret), these allow arbitrary registry-level writes. Hardcoded schema name leaks a customer identifier into source.
- **Recommended fix:** delete these routes before production; move any needed backfills into versioned migrations. If kept for staging, restrict by environment and network.
- **Files requiring changes:** remove `apps/web/app/api/seed/**`, `apps/web/app/api/migrate/**`.
- **Test required:** deployment check that the routes 404 in production.

## SEC-013 — Department-manager scope not enforced beyond employee list

- **Severity:** Low-Medium
- **Affected role:** `department_manager`
- **Affected endpoints:** `retention.goal/review.*` writes, `attendance.resolveException`, `expense.list`, `leave.request.list` and other company reads.
- **Current behaviour:** department scoping (`getManagedDepartmentIds`, `trpc/scoping.ts`) is applied **only** in `employee.list` (`employee.ts:24-28`). Elsewhere a department_manager sees/acts tenant-wide - e.g. creating goals/reviews for any employee, resolving any attendance exception.
- **Expected behaviour:** department_manager reads/writes must be scoped to their reporting line/department.
- **Recommended fix:** apply `getManagedDepartmentIds` scoping consistently to department_manager code paths, or restrict those procedures to HR roles.
- **Files requiring changes:** `retention.ts`, `attendance.ts`, `expense.ts`, `leave.ts`.
- **Test required:** RBAC-T13 (dept_manager sees only own-team records).

---

## What is already solid (do not "fix")

- **Tenant isolation** via per-tenant Postgres schema resolved from the session - cross-tenant data (in tenant schemas) is structurally unreachable through `ctx.db`.
- **Audit log** is DB-level append-only (BEFORE UPDATE/DELETE triggers, migration `0007`) - tamper-resistant.
- **Payroll, compliance, notification, mfa, department, policy** routers - correctly `requireRole`/self-scoped.
- **Auth hardening** - per-account lockout with backoff, 30-min idle JWT, MFA gate, login rate-limiting, bcrypt cost 12.
- **`employee.update`** - correct field-level split (salary vs profile) gated by role, fully audited.
- **`expense.approve`** - correct ownership (approver) model.
