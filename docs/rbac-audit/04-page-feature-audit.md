# 04 - Page & Feature Audit

**Audit date:** 2026-07-20
**Scope:** every dashboard page; per-role visibility, features to add/remove/hide/move, and security/UX concerns.

## 1. How access control is applied at the page layer (structural findings)

Evidence from a full sweep of `apps/web/app/**` and `apps/web/components/**`:

1. **No reusable guard component exists.** There is no `RoleGate`, `Can`, `PermissionGuard`, or `usePermissions` hook anywhere in source. The only RBAC primitive is `can(role, capability)` from `packages/auth/src/rbac.ts`.
2. **Page access is delegated to middleware + tRPC.** The `(dashboard)/layout.tsx` gate is **auth-only** (redirects to `/login` if no session; no role check). Route-level role enforcement is entirely `middleware.ts`, which only redirects `employee`/`candidate`.
3. **In-page role gating is ad-hoc and inconsistent.** Only 7 pages do any in-page role logic; 6 of them use hardcoded string comparisons (`role === "hr_manager"`, `["super_admin","hr_manager"].includes(role)`) instead of `can()`. Only `app/page.tsx` (home) and `sidebar.tsx` use the capability API.
4. **Most privileged action buttons render unconditionally client-side** (e.g. "New Payroll Run" on `/payroll`, "New Employee" on `/employees`). They are not security boundaries - the tRPC mutation behind them is (or should be) the boundary. Where the mutation is properly `requireRole`-gated this is *safe but poor UX* (a button that always errors for some roles). Where the mutation is bare `protectedProcedure`, it is a real gap.

**Cross-cutting recommendation:** introduce a single `<Can capability=... />` wrapper and a `useCan()` hook backed by `can()`, and replace the scattered `role === "..."` checks. This removes UI/enforcement drift and makes "hide the button" consistent. It is a UX + maintainability fix, **not** a substitute for server enforcement.

## 2. Per-page feature classification

Legend for **Recommendation**: Keep / Add / Remove / Hide-by-role / Disable-with-reason / Move / Simplify.

### `/` — Command center (`app/page.tsx`)
- **Guarded:** yes - `can()` used for module cards, metric tiles, quick actions, compliance block. Good reference implementation.
- **Features to add:** role-aware empty-state guidance for employees (currently minimal); "request access" affordance when a tile is hidden.
- **Concern:** none material. This is the model other pages should follow.

### `/employees`, `/employees/[id]`
- **Intended:** super_admin, hr_manager, hr_specialist, recruiter, payroll_admin, department_manager (own dept).
- **Features present:** list, search, sort, "New Employee" link, profile with salary + identity + documents + payslips.
- **Add:** column-level masking of salary/identity for roles without `payroll:view_company` (recruiter, department_manager should not see salary on the profile - currently `getById` returns full row incl. salary to any staff role).
- **Hide-by-role:** "New Employee" / "Edit" for roles lacking `people:manage` (recruiter, payroll_admin, department_manager). Currently rendered for all.
- **Security concern:** `employee.getById` (`companyProcedure`) returns the full employee record - including plaintext salary and (plaintext) iqama/passport/IBAN - to **any** staff role, including recruiter and department_manager who lack `payroll:view_company`. Field-level masking needed (see SEC-007 / SEC-008).

### `/payroll/*`
- **Intended:** super_admin, hr_manager, hr_specialist (view), payroll_admin (view; run is currently blocked - see matrix note).
- **Backend:** correctly `requireRole(PAYROLL_VIEW_ROLES)`. Secure.
- **Hide-by-role:** "New Payroll Run" button renders for everyone who can reach the page; hide for non-`payroll:run` roles. UX only (mutation is gated).
- **Reconcile:** `payroll_admin` has `payroll:run` capability but `payroll.run.create` excludes it - decide and align.

### `/recruitment/*`
- **Intended:** recruiter, hr_manager, hr_specialist, department_manager (view).
- **Security concern:** list/detail reads are bare `protectedProcedure` - `payroll_admin` (no `recruitment:view`) can read candidate PII. **Hide + backend-gate** on `recruitment:view` (SEC-006 cluster).
- **Add:** candidate PII masking in list view; audit trail on offer approvals.

### `/retention/*` (performance, reviews, goals, skills, talent, engagement, rewards, career)
- **Intended:** hr_manager, hr_specialist, department_manager; employee for own goals/skills.
- **Security concern:** most `list`/`getById` are bare `protectedProcedure` - recruiter and payroll_admin can read performance reviews and talent/succession data they have no capability for. **Backend-gate** on `performance:view_team` (SEC-006 cluster).
- **Move:** succession/talent planning is sensitive - consider restricting to hr_manager + super_admin only.

### `/expenses`
- **Backend:** submit/edit/cancel/approve are ownership-checked (secure). But `list` is over-permissive + has an IDOR on `pendingFor` (SEC-004).
- **Hide-by-role:** approve controls already gated in-page to managers (good). 
- **Fix:** scope `list` so department_manager sees only their reports, not the whole tenant; bind `pendingFor` to the caller.

### `/offboarding/*` (settlements)
- **Security concern:** settlement financials readable by any staff role via `companyProcedure` (recruiter included). Restrict to HR/finance roles (SEC-006 cluster).

### `/compliance/*`, `/qiwa`
- Compliance is properly `requireRole`. Qiwa read is gated to payroll roles, but `sync`/`dashboard`/`testConnection` are `companyProcedure` (any staff). Gate integration actions to `integrations:manage` roles.

### `/settings`, `/settings/company`, `/settings/team`
- **Intended:** super_admin, hr_manager.
- **In-page:** `/settings/team` gates invite actions to `["super_admin","hr_manager"]` (good UX). `/settings` shows role read-only.
- **CRITICAL security concern:** the settings pages / onboarding wizard post to `POST /api/company/invite`, which does **not** check role and accepts an arbitrary `role` in the body - any authenticated user can call it directly (SEC-001). Also `PATCH /api/company/profile` and `POST /api/company/departments` lack role checks (SEC-003).

### `/super-admin`
- **Intended:** platform operator only.
- **Concern:** no in-page or middleware role check; relies solely on `auth.tenantsList` rejecting non-super_admins. But `super_admin` is per-tenant, so this page shows **every tenant** to any tenant owner (SEC-002). Both the page and the procedure must be re-gated to a true platform role.

### `/modules/[slug]`
- **Best-in-class:** server-side `allowedRoles` gate with a denial UI. Use this pattern as the template for page-level guards.

### `/attendance/*`, `/leave`, `/documents`, `/departments/*`, `/profile`
- Backend mostly `companyProcedure`/`requireRole`/self - largely secure. Over-permissive reads limited to recruiter reaching company attendance/leave (low-sensitivity). "New"/"Edit" buttons render unconditionally (UX hide recommended).

## 3. Summary counts

| Category | Count (approx.) |
|---|---|
| Pages with proper capability-based guards | 2 (`/`, sidebar) + `/modules/[slug]` |
| Pages using ad-hoc `role === "..."` checks | 6 |
| Pages with **no** in-page guard (rely on MW + tRPC) | ~70 |
| Pages exposing sensitive data via over-permissive backend reads | recruitment/*, retention/*, offboarding/*, employee profile |
| Unguarded privileged buttons (UX hide recommended) | employees, payroll, departments, recruitment, retention (New/Edit/Delete) |

The single highest-leverage UX change is introducing a `<Can>` wrapper + `useCan()` hook and applying it to the New/Edit/Delete/Approve controls. The single highest-leverage **security** changes are SEC-001, SEC-002, SEC-003 (see `05-security-findings.md`).
