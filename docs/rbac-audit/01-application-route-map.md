# 01 - Application Route Map

**Audit date:** 2026-07-20
**App:** hrms-app (Next.js 16 App Router, tRPC v11, Drizzle, schema-per-tenant PostgreSQL)
**Auth:** NextAuth v5 (JWT sessions), credentials provider + demo identities

This map covers every route, API surface, and the protection mechanism enforcing it. Enforcement layers referenced:

- **MW** = `apps/web/middleware.ts` (edge, role-based route redirect via `canAccessRoute`)
- **RBAC** = `packages/auth/src/rbac.ts` (capabilities, route + procedure allowlists)
- **tRPC** = per-procedure guard in `apps/web/trpc/server.ts` (`protectedProcedure` / `companyProcedure` / `requireRole`)
- **Tenant** = schema-per-tenant DB isolation, resolved server-side from the session `tenantId` (`apps/web/trpc/server.ts:23-40`)

> **Key structural fact:** the tenant database handle (`ctx.db`) is always the caller's own Postgres schema, resolved from the *session* `tenantId`, never from client input. Cross-tenant reads/writes through `ctx.db` are therefore structurally prevented. The registry (`adminDb` / `public` schema) is the only shared surface and is where cross-tenant risk concentrates (see finding SEC-002).

---

## 1. Public / unauthenticated routes

| Route | Purpose | Protection | Risk |
|---|---|---|---|
| `/login` | Sign in | Public; rate-limited (MW) | Low |
| `/signup` | Self-serve tenant + super_admin creation | Public; `auth.signup` (public tRPC) | Medium - every signup mints a tenant-level `super_admin` |
| `/forgot-password`, `/reset-password` | Password reset | Public; rate-limited (MW) | Low |
| `/(public)/careers`, `/careers/apply/[jobId]` | Public job board + apply | Public | Low |
| `/invite/[token]` | Accept an invitation, set password | Public; token-gated (`invite.getByToken` / `acceptInvite`) | **High - see SEC-001** |
| `/company-setup` | Post-signup onboarding wizard | Authenticated | Low |

## 2. Authenticated dashboard routes (`(dashboard)` group)

All matched by MW; `employee`/`candidate` are redirected to `/?access=denied` off any route not in their allowlist. **All other staff roles pass MW unconditionally** (`canAccessRoute` returns `true` for them - `rbac.ts:169-177`). Page-level data is gated at the tRPC layer.

| Route | Primary users (intended) | Data / actions | Route protection | Data protection |
|---|---|---|---|---|
| `/` (dashboard) | All | Role-aware cards | MW | tRPC per-widget |
| `/employees`, `/employees/[id]` | HR, managers | Employee list + profile (salary, IDs) | MW (staff only) | `companyProcedure`; dept scoping for dept_manager |
| `/employees/new`, `/[id]/edit` | HR | Create/edit employee | MW | `requireRole` (create); field-scoped update |
| `/departments/*` | HR | Dept CRUD, org chart | MW | `companyProcedure` read / `requireRole` write |
| `/attendance/*` | HR, managers, self | Punch, reports, exceptions | MW | mixed (self vs `companyProcedure`/`requireRole`) |
| `/leave`, `/leave/new` | All (self) + approvers | Request + approve leave | MW (employee-allowed) | self + `requireRole` for config |
| `/payroll/*` | HR, payroll_admin | Runs, payslips | MW | `requireRole(PAYROLL_VIEW_ROLES)` |
| `/expenses` | All staff + self | Submit / approve / pay | MW | ownership + approver checks |
| `/documents/*` | HR + self | Company docs + own docs | MW (employee-allowed) | `companyProcedure` / self |
| `/recruitment/*` | Recruiter, HR | Jobs, candidates, offers, checks | MW (staff only) | **mixed - many bare `protectedProcedure` reads** |
| `/retention/*` (goals, reviews, skills, talent, engagement, rewards, career) | HR, managers, self (goals/skills) | Performance & development | MW (goals/skills employee-allowed) | **mixed - many bare `protectedProcedure` reads** |
| `/offboarding/*` | HR | Settlement workflow | MW | `companyProcedure` / `requireRole` |
| `/compliance/*` | HR, payroll_admin | Compliance records | MW | `requireRole` |
| `/qiwa` | HR, payroll_admin | Saudi gov integration | MW | `companyProcedure` / `requireRole` |
| `/workforce-planning` | HR | Planning | MW | tRPC |
| `/modules`, `/modules/[slug]` | Role-dependent | Feature modules (some employee-allowed) | MW allowlist per module | tRPC |
| `/ai`, `/ai-chat` | Staff | AI assistant / prompts | MW | `companyProcedure` (config) / `protectedProcedure` (send) |
| `/settings`, `/settings/company`, `/settings/team` | super_admin, HR | Company + team settings, invites | MW | tRPC `requireRole` **but see SEC-001/SEC-003 REST duplicates** |
| `/super-admin` | Platform operator (intended) | Cross-tenant registry view | MW | `auth.tenantsList` gated to `super_admin` **- SEC-002** |
| `/profile` | All incl. candidate | Own profile | MW allowlist | `employee.me` (self) |

## 3. API surface

### tRPC (`/api/trpc/[trpc]`)
Single gateway; every procedure runs through `createTRPCContext` then its own guard. 22 routers (see `03-permission-matrix.md`). This is the primary, well-structured authorization surface.

### Custom REST routes (`apps/web/app/api/**`)
These bypass the tRPC guards and must self-enforce. **This is where enforcement is weakest.**

| Route | Method | Auth check | Role check | Risk |
|---|---|---|---|---|
| `/api/company/invite` | POST | session only | **NONE - accepts `role` from body** | **CRITICAL (SEC-001)** |
| `/api/company/invites` | GET | session only | none | Low (read own tenant) |
| `/api/company/departments` | GET/POST | session only | **NONE (POST creates)** | Medium (SEC-003) |
| `/api/company/profile` | GET/PATCH | session only | **NONE (PATCH edits company)** | Medium (SEC-003) |
| `/api/company/setup-complete` | POST | session only | none | Low |
| `/api/company/setup-status` | GET | session only | none | Low |
| `/api/upload` | POST | session only | none (tenant-scoped path) | Low-Med |
| `/api/seed/demo-data` | POST | `MIGRATION_TOKEN` (fail-closed) | n/a | Medium - remove before prod (SEC-005) |
| `/api/migrate/fix-critical-bugs` | POST | `MIGRATION_TOKEN` (fail-closed) | n/a | Medium - hardcodes a customer schema; remove (SEC-005) |
| `/api/migrate/fix-schema-drift` | POST | `MIGRATION_TOKEN` (fail-closed) | n/a | Medium - remove (SEC-005) |
| `/api/auth/*` | - | NextAuth | - | Rate-limited (MW) |
| `/api/health` | GET | none | - | Low |

---

## 4. Coverage

- Pages (page.tsx) mapped: **80+ routes** across auth, public, and dashboard groups.
- tRPC routers: **22**.
- Custom REST route handlers: **11**.
- Background jobs / queue (BullMQ): declared in stack; not yet wired into audited routers (verify before launch).

See `04-page-feature-audit.md` for per-page feature/role analysis and `05-security-findings.md` for the detailed findings referenced above.
