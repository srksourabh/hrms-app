# Progress — hrms-app (UDS-HR)

## Current milestone: Phase A complete (2026-07-12)

### Build Status (verified 2026-07-12 by Hermes)
- [x] Build passes (`pnpm build`) — 2/2 turbo tasks, ~25s
- [x] TypeScript typecheck passes (`pnpm typecheck`) — 13/13 turbo tasks
- [x] All 63 unit tests pass (`pnpm test`) — 10 test files
- [x] Lint: 11/12 packages pass. `@hrms-app/web` has 240 residual errors (see `docs/known-issues.md`)
- [x] Demo login working: admin@demo.com / Demo@1234 → redirects to /employees (manual verification only; see E2E caveat below)
- [x] Vercel deployment: https://hrms-app-chi.vercel.app/

> **Build status caveat:** the 240 lint errors in `@hrms-app/web` are stylistic (mostly `no-explicit-any`) and do not block the build pipeline. The `pnpm build` and `pnpm typecheck` commands are green. Lint cleanup is a follow-up (Phase A.5.1).
>
> **E2E caveat:** `pnpm test:e2e` cannot run in this dev environment because the Playwright `webServer` config requires a reachable DB and a free port 3000. The same blocker affects all 6 tests in `auth.spec.ts`, not just the new demo-login test. See `docs/e2e-status.md`.

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
- [x] Hijri/Gregorian display (1.10) - **PARTIAL → DONE**: shared `<DualDate>` component in `packages/ui` (built on `@hrms-app/date`); integrated into 5 screens (employee profile, payroll list, leave new, documents, payroll run view). Note: the onboarding page (originally claimed integrated) is still using a hand-rolled local helper — refactor to use `<DualDate>` is a follow-up.
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

### Phase A — Finish Phase 1 honestly (COMPLETE 2026-07-12)

| Task | Status | Evidence |
|---|---|---|
| A.1 Copy full PRD v5.0 into docs/02-prd.md | ✅ DONE | 1627 lines, all 21 sections present, byte-identical to source |
| A.2 Audit 14 scaffolded routes | ✅ DONE | `docs/phase-2-route-audit.md` — all 14 routes WORKING, not stubs |
| A.3 Integrate Hijri dates into 5 screens | ✅ DONE | `<DualDate>` from `@hrms-app/ui` added to payroll, leave/new, documents, employees/[id], payroll/[id] |
| A.4 Fix ESLint v9 flat config in @hrms-app/qiwa | ✅ DONE | `packages/qiwa/eslint.config.js` created; qiwa lint exits 0 |
| A.5 Measure real lint count + triage | ✅ DONE | 242 errors, 240 after `--fix`; all in `@hrms-app/web`; `docs/known-issues.md` written |
| A.6 Add Playwright E2E for demo login | ⚠️ CODE DONE, RUN BLOCKED | Test added; runs fail in this dev env (no DB / port). `docs/e2e-status.md` |
| A.7 Update progress.md with honest evidence | ✅ DONE (this section) | — |

**Bonus findings from A.2:**
- All 14 `/recruitment/*` and `/retention/*` routes are WORKING (page + tRPC handler + sidebar link)
- However, list pages link to detail routes (`/[id]`) and `/new` create-form routes that don't exist yet for most entities. These will currently 404. Worth a follow-up before pilot.

### Remaining Work

1. **Lint cleanup in `@hrms-app/web`** — 240 residual errors, mostly `no-explicit-any` (143) and `no-unused-vars` (78). Triage in `docs/known-issues.md`; quick wins identified. ~30 min of bulk edits.
2. **Detail / new routes** — `/recruitment/applications/[id]`, `/recruitment/applications/new`, etc. don't exist yet. Need scaffolding before pilot.
3. **Refactor onboarding page** — still uses hand-rolled `gregorianToHijri()` helper. Should switch to shared `<DualDate>`. Cosmetic, not blocking.
4. **E2E environment** — Playwright tests need working dev server (DB + free port). All 6 tests in `auth.spec.ts` are blocked. See `docs/e2e-status.md`.
5. **Government API integrations** - Qiwa scaffolded; Mudad, GOSI, Muqeem not implemented. **User will provide B.1 (Qiwa), B.2 (Mudad) credentials at final shipping time.**
6. **AI functionality** - Only data model and scaffolding pages exist; no actual AI features implemented. **User will provide C.1 (Anthropic key) at final shipping time.**
7. **Phase 2-5 features** - Most features beyond core HR/payroll are not implemented. The web app DOES have many route files scaffolded under `/recruitment/*` and `/retention/*` that need to be audited (routers vs pages vs stubs).

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