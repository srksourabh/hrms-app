# Progress — hrms-app (UDS-HR)

## Current milestone: Production-ready MVP complete

### Build Status (verified 2026-07-12 by Hermes)
- [x] Build passes (`pnpm build`) — 2/2 turbo tasks, ~60s
- [x] TypeScript typecheck passes (`pnpm typecheck`) — 13/13 turbo tasks
- [x] All 63 unit tests pass (`pnpm test`)
- [x] Demo login working: admin@demo.com / Demo@1234 → redirects to /employees
- [x] Vercel deployment: https://hrms-app-chi.vercel.app/

> **Hermes correction (2026-07-12):** `progress.md` previously claimed `pnpm build` and `pnpm typecheck` passed. That was **false** as of session start. The web app had 3 TypeScript errors in `apps/web/trpc/routers/qiwa.ts` (lines 192, 327 — type narrowing on `Date | string` and missing required fields on `QiwaContract`). Both errors are now fixed; build, typecheck, and tests verified green. See the `qiwa.ts` history for the exact diff.

### PRD v5.0 Implementation Status

**Phase 1: Core HR + Payroll (Features 1.1-1.15) - COMPLETE**
- [x] Employee master record (1.1)
- [x] Organizational structure (1.2)
- [x] Saudi payroll engine (1.3)
- [x] Final settlement (1.4)
- [x] Mudad wage file export (1.5)
- [x] Bilingual payslips (1.6)
- [x] Document management (1.7)
- [x] Consistency guardrail (1.8)
- [x] Leave management (1.9)
- [ ] Hijri/Gregorian display (1.10) - **PARTIAL**: `@hrms-app/date` package built with 14 passing tests, but ZERO pages in `apps/web` import it (verified 2026-07-12). Acceptance criterion "WHEN any date is displayed, THE SYSTEM SHALL show both Hijri and Gregorian formats" is unmet until UI integration ships.
- [x] RBAC + login system (1.11)
- [x] Company setup wizard (1.12)
- [x] Employee self-service (1.13)
- [x] Notifications engine (1.14)
- [x] Basic reports (1.15)

**Phase 2: Employee Lifecycle + Recruitment - PARTIAL**
- [x] Employee referral program data model (2.16)
- [x] Succession planning data model (2.17)
- [x] Internal mobility data model (2.18)
- [x] Alumni/boomerang tracking data model (2.19)
- [ ] Workforce planning (2.15) - NOT IMPLEMENTED
- [ ] Career page (2.2) - NOT IMPLEMENTED
- [ ] Candidate management (2.3) - NOT IMPLEMENTED
- [ ] AI resume screening (2.4) - NOT IMPLEMENTED
- [ ] Interview scheduling (2.5) - NOT IMPLEMENTED
- [ ] AI interview assistant (2.6) - NOT IMPLEMENTED
- [ ] Offer letter generation (2.7) - NOT IMPLEMENTED
- [x] Onboarding workflows (2.8) - **COMPLETE** (page exists; Hijri dates NOT yet integrated, see 1.10)
- [ ] AI onboarding copilot (2.9) - NOT IMPLEMENTED
- [x] Offboarding workflows (2.10) - **DATA MODEL EXISTS, PAGE NOT IMPLEMENTED**

**Phase 3: Government Integration - NOT STARTED**
- [ ] Qiwa API integration (3.1)
- [ ] Mudad API submission (3.2)
- [ ] GOSI reporting integration (3.3)
- [ ] Muqeem integration (3.4)
- [ ] Bank integration (3.5)
- [ ] Nitaqat dashboard (3.6)
- [ ] AI executive briefings (3.7)
- [ ] AI workforce cost predictor (3.8)
- [ ] AI attrition risk analyzer (3.9)
- [ ] AI compliance copilot (3.10)
- [ ] AI payroll anomaly narrator (3.11)
- [ ] Regulatory config engine (3.12)

**Phase 4: Performance + Engagement - NOT STARTED**
- [ ] Performance reviews (4.1)
- [ ] Goals and OKRs (4.2)
- [ ] AI performance summary (4.3)
- [ ] Probation tracking (4.4)
- [ ] Surveys and feedback (4.5)
- [ ] Travel and expenses (4.6)
- [ ] Attendance and shifts (4.8)
- [ ] Total rewards (4.11)
- [ ] Recognition program (4.12)
- [ ] Stay interviews (4.13)
- [ ] Employee relations (4.14)
- [ ] Career development (4.15)
- [ ] AI succession advisor (4.16)
- [ ] Alumni analytics (4.17)

**Phase 5: Autonomous Agents + Mobile - NOT STARTED**
- [ ] Mobile app (5.1)
- [ ] Autonomous HR agents (5.2)
- [ ] AI Nitaqat advisor (5.3)
- [ ] AI recruitment agent (5.4)
- [ ] People analytics (5.5)
- [ ] ZATCA e-invoicing (5.6)
- [ ] Multi-company support (5.7)
- [ ] Custom workflow builder (5.8)

**AI Layer - NOT IMPLEMENTED**
- [ ] AI data model exists (14 tables)
- [ ] AI validators exist
- [ ] AI tRPC router exists (handlers pending)
- [ ] AI dashboard pages exist (scaffolding only)

### Remaining Work

1. **PRD document (docs/02-prd.md)** - Truncated to 49 lines, needs full v5.0 content (the file in `Downloads/UDS-HR-PRD-v5.0.md` is the source of truth).
2. **Hijri date UI integration** - `@hrms-app/date` package works and is tested, but no pages import it. Needs a `<HijriDate>` component or wrapper integrated into employee profile, payroll run, leave request screens (5 representative screens per Section 11 acceptance).
3. **Lint status unknown** - `pnpm lint` fails on `@hrms-app/qiwa` (missing ESLint v9 flat config) and other packages have not been re-measured since the 2026-07-12 fixes. The "228 errors" figure from before is unverified.
4. **Government API integrations** - Qiwa, Mudad, GOSI, Muqeem not implemented (Qiwa stub exists in `packages/qiwa` + `apps/web/trpc/routers/qiwa.ts`, but is non-functional without credentials).
5. **AI functionality** - Only data model and scaffolding pages exist; no actual AI features implemented.
6. **Phase 2-5 features** - Most features beyond core HR/payroll are not implemented. The web app DOES have many route files scaffolded under `/recruitment/*` and `/retention/*` that need to be audited (routers vs pages vs stubs).

### Knowledge files
- [x] CLAUDE.md
- [x] docs/memory.md
- [x] docs/progress.md
- [x] docs/ARCHITECTURE.md
- [x] docs/SECURITY.md
- [x] docs/CONTRIBUTING.md
- [x] docs/ADR/adr-template.md
- [ ] docs/02-prd.md (UDS-HR PRD v5.0) - **NEEDS FULL CONTENT**

---

## Completed

| Date | Milestone | Notes |
|------|-----------|-------|
| 2026-07-11 | SaaS foundation | Turborepo + pnpm workspace, tRPC, Drizzle, NextAuth v5 |
| 2026-07-11 | UDS-HR data model | 19 tables across public + tenant schemas, schema-per-tenant isolation |
| 2026-07-11 | Design system | docs/design.md created: Saudi-centric color palette, typography, layout, RTL strategy, dark mode |
| 2026-07-11 | Serena installed | serena-agent v1.5.3, 28 LSP tools, OpenCode MCP |
| 2026-07-11 | CRUD shell (UI + API) | tRPC routers + UI pages for all 8 entities; Drizzle relations; Zod validators; email templates |
| 2026-07-12 | Production build | Build, typecheck, and tests all passing; demo login working |
| 2026-07-12 | Lint fixes | Fixed unused imports, @ts-nocheck, Drizzle eq() type errors |

## Blockers

| Date | Blocker | Status |
|------|---------|--------|
| — | — | — |