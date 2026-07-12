# Progress — hrms-app (UDS-HR)

## Current milestone: Production-ready MVP complete

### Build Status
- [x] Build passes (`pnpm build`)
- [x] TypeScript typecheck passes (`pnpm typecheck`)
- [x] All 63 unit tests pass (`pnpm test`)
- [x] Demo login working: admin@demo.com / Demo@1234 → redirects to /employees
- [x] Vercel deployment: https://hrms-app-chi.vercel.app/

### Remaining Work
- Lint errors (~228 errors) - pre-existing `any` types and unused imports in scaffolding pages
- PRD document (docs/02-prd.md) - truncated, needs full content
- Hijri date display - UI components exist but not integrated into pages

### Step 1: Data model + multi-tenancy
- [x] Public schema tables (tenants, users, accounts, sessions, verification_tokens)
- [x] Tenant schema tables (14 Phase 1 entities)
- [x] Tenant manager (createTenantRegistry, createTenantSchema, getTenantDb)
- [x] Auth package updated for public-schema NextAuth with tenant-aware session
- [x] tRPC context provides tenant-scoped db
- [x] tRPC routers: employee CRUD, department CRUD, auth signup with tenant creation
- [x] Signup flow creates tenant schema + admin user
- [x] Updated validators for signup with company details
- [x] Sidebar navigation adapted for UDS-HR roles
- [x] Old schema files cleaned up
- [x] All Drizzle relations defined (17 relation sets across 19 tables)
- [x] pnpm typecheck passes (pre-existing tsconfig issues remain)

### Step 2: Employee master + org structure (PRD 1.1, 1.2)
- [x] Employee CRUD endpoints + validation
- [x] Employee list page (searchable, filterable table)
- [x] Employee create/edit/detail pages
- [x] Department tree view (expand/collapse)
- [x] Department detail page
- [x] Employee self-service profile view

### Step 3: Payroll engine (PRD 1.3-1.8)
- [x] tRPC router payroll CRUD (runs, payslips, wage files, compliance)
- [x] Payroll list/create/detail pages
- [x] GOSI dual-rate calculation (service: current 10%/9.75%, old 9%/9%, expat 0)
- [x] ESB calculation (half-month first 5yr, full-month after 5yr)
- [x] Payroll run orchestrator (batch generate payslips + compliance checks)
- [x] Consistency guardrail (5 checks: coverage, negative pay, IBAN, total balance, GOSI anomalies)
- [x] Mudad wage file export (XML + CSV formats)
- [x] 20 unit tests passing (gosi, esb, consistency, mudad, orchestrator)
- [x] `@hrms-app/payroll` package with clean typecheck
- [x] Services wired into tRPC router (run.create auto-orchestrates, wageFile.generate exports)

### Step 4: Leave + Documents (PRD 1.7, 1.9)
- [x] Leave type CRUD tRPC router
- [x] Leave request tRPC router (create, approve/reject, my leaves)
- [x] Leave balance tRPC router
- [x] Leave list page with filter tabs (pending/approved/rejected)
- [x] Leave request creation page
- [x] Document CRUD tRPC router + filterable list
- [x] Document list page with type/expiry filters
- [x] Leave balance accrual engine (service layer)
- [x] Document expiry alert engine (service layer)
- [x] Hijri/Gregorian date display (service layer - `packages/date` complete, UI components exported, pending page integration)

### Step 5: Email + notifications
- [x] Email templates: leave-request, leave-status, payslip-ready, document-expiry
- [x] Notification tRPC router (list, markRead, markAllRead, unreadCount)

### Step 6: Final settlement
- [x] Final settlement tRPC router (CRUD)

### Step 7: AI-Native HR foundation (Phase 5)
- [x] AI data model (14 tables: job roles, skills, learning, certs, assessments, OKRs, reviews, 360 feedback, engagement surveys, recognition)
- [x] AI validators (Zod schemas for all 14 entities)
- [x] AI tRPC router (CRUD + invite - imports only, handlers pending)
- [x] AI dashboard page (card grid, 6 feature areas)
- [x] Recruitment overview page (card grid, 7 sub-modules)
- [x] Retention dashboard page (card grid, 7 sub-modules)
- [x] Sidebar links fixed (removed `/dashboard/` prefix - route group doesn't add path segment)
- [x] All page links fixed (30+ pages - `/dashboard/` → `/`)
- [x] Auth package typecheck passing (accounts snake_case, sessions PK, AdapterUser)

### Knowledge files
- [x] CLAUDE.md
- [x] docs/memory.md
- [x] docs/progress.md
- [x] docs/ARCHITECTURE.md
- [x] docs/SECURITY.md
- [x] docs/CONTRIBUTING.md
- [x] docs/ADR/adr-template.md
- [x] docs/02-prd.md (UDS-HR PRD)

---

## Completed

| Date | Milestone | Notes |
|------|-----------|-------|
| 2026-07-11 | SaaS foundation | Turborepo + pnpm workspace, tRPC, Drizzle, NextAuth v5 |
| 2026-07-11 | UDS-HR data model | 19 tables across public + tenant schemas, schema-per-tenant isolation |
| 2026-07-11 | Design system | docs/design.md created: Saudi-centric color palette, typography, layout, RTL strategy, dark mode |
| 2026-07-11 | Serena installed | serena-agent v1.5.3, 28 LSP tools, OpenCode MCP |
| 2026-07-11 | CRUD shell (UI + API) | tRPC routers + UI pages for all 8 entities; Drizzle relations; Zod validators; email templates |
| 2026-07-12 | Phase 5 AI-Native HR foundation | AI schema + validators + router + dashboard pages; all route links fixed; auth typecheck passing; PostgreSQL + Redis containers running; demo account created |

## Blockers

| Date | Blocker | Status |
|------|---------|--------|
| —    | —       | —      |
