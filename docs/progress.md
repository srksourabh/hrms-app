# Taāzur Customer Demo Delivery Progress

> **Product:** Taāzur (Arabic: تآزر)
> **Platform attribution:** powered by UDS-Noon JV
> **Delivery mode:** Single-agent, resumable, evidence-based
> **Plan:** `.hermes/plans/2026-07-13_085441-taazur-customer-demo-shipment.md`
> **Last updated:** 2026-07-13 after Saudi statutory research and documentation verification

## Status vocabulary

| Status | Meaning |
|---|---|
| ✅ Verified | Implemented and exercised with tool/test/browser evidence |
| 🟢 Production-backed | Persists in tenant Supabase/PostgreSQL and verified |
| 🟡 Operational demo | Working workflow using clearly labeled deterministic mock data |
| 🟠 External API pending | UI/adapter ready; live government/bank credentials or specifications unavailable |
| 🔴 Not implemented | No operational customer workflow yet |
| ⚠️ Existing debt | Pre-existing limitation not introduced by current delivery |

## Current milestone

**Customer demo implementation: VERIFIED LOCALLY · production deployment in progress**

### Completed audit evidence

- [x] Inventory: 60 tracked page routes.
- [x] Module catalog: 22 workspaces, 65 unique PRD feature IDs.
- [x] Catalog status before this program: 8 `available`, 9 `preview`, 5 `planned`.
- [x] Schema/router foundations exist for core HR, payroll, leave, documents, Qiwa, recruitment, retention, AI, compliance, notifications, and final settlement.
- [x] Existing role enum: `super_admin`, `hr_manager`, `department_manager`, `hr_specialist`, `employee`, `candidate`.
- [x] tRPC has `protectedProcedure` and `requireRole`; enforcement coverage is incomplete and demo auth exposes only one HR-manager identity.
- [x] Existing demo seed is insufficient: one generic company, one user, no five-person connected company fixture; seed contains an invalid `admin` role not present in the current enum.
- [x] Baseline branding audit found legacy naming in metadata, authentication, sidebar, module copy, i18n, styles, reports/templates, and docs; Phase 1 replacement is now implemented and pending browser/build verification.
- [x] Internal workspace scope `@hrms-app/*` appears widely; decision: keep internal package identifiers and replace only customer-facing branding in this shipment.
- [x] Competitor research completed against original sites:
  - Jisr: unified HR/Finance/Spend, task outcomes, localized compliance, travel/expenses, integration visibility.
  - ZenHR: user-friendly feature tabs, role self-service, payroll/attendance/reporting, regional government integrations.
- [x] Performance baseline from prior verified shipment: login JavaScript reduced from 902,129 to 638,256 bytes (29.3%); production login TTFB about 190–230 ms. User reports broader inside-page slowness, so route-by-route profiling remains required.

## Delivery board

| ID | Workstream | Status | Evidence / next action |
|---|---|---|---|
| 0 | Audit, traceability, plan, progress | ✅ Verified | Resumable plan and evidence ledger maintained |
| 1 | Taāzur brand + white labeling + assets | ✅ Verified | Configurable bilingual brand, original SVG assets, metadata, email/report attribution |
| 2 | Five-person, two-branch oil-company fixture | ✅ Verified | Typed connected Rukn Energy fixture; fixture tests pass |
| 3 | Admin/employee RBAC + demo credentials | ✅ Verified | Role navigation, route middleware, API deny-by-default policy, RBAC tests and E2E denial journey |
| 4 | All Preview/Planned workspaces operational | 🟡 Operational demo | 22 workspaces expose fixture records, metrics and actions; no customer-facing Preview/Planned labels |
| 5 | Government adapters | 🟠 External API pending | Deterministic Qiwa/Mudad/GOSI/Muqeem/bank/ZATCA mocks verified; no authority calls claimed |
| 6 | Interior UX redesign | ✅ Verified | Role-specific dense admin and employee command centers plus operational workspace shell |
| 7 | RAG-ready docs and HR policy corpus | ✅ Verified | 24 Markdown files / 40,834 words; statutory baseline, gap audit, product handbook, module/API/data/RBAC/operations docs and 12-entry RAG manifest validated |
| 8 | Whole-site performance | 🟡 Representative profile complete | Seven production routes and six viewport sizes measured; detailed evidence in `docs/production-performance-2026-07-13.md`; geographic RUM remains pending |
| 9 | Quality, production deployment, customer QA | 🟡 Production verified | Vercel alias is Ready and public Playwright passes 6/6; commit/push remains pending |

## Explicit external blockers

1. Qiwa live credentials, scopes, certificates, endpoint/sandbox specification.
2. Mudad live credentials and submission specification.
3. GOSI and Muqeem integration access/specifications.
4. Bank/WPS connectivity details and test certificates.
5. ZATCA integration scope clarification: ZATCA e-invoicing is normally financial invoicing rather than employee payroll tax; implement only the confirmed business requirement.
6. Supabase production credentials are required only to apply migrations, seed production demo data, and verify persistence. Do not add them to source.
7. Trademark registration requires professional legal clearance and similarity search. Automated design scoring cannot guarantee registrability.

## Latest-tree verification — 2026-07-13

- `pnpm typecheck`: 15/15 tasks passed.
- `pnpm test`: 18/18 test files; 91 tests passed; 3 database-dependent tests skipped.
- `pnpm build`: 2/2 tasks passed; Next.js generated 65 routes.
- `pnpm test:e2e`: 8/8 Playwright Chromium journeys passed against the production build.
- E2E coverage: branded auth/error handling, four role buttons and capability-filtered navigation, admin dashboard/catalog, mock Qiwa operation, company onboarding, employee ownership/RBAC denial, personal expense action, mobile overflow.
- Targeted ESLint for newly authored Taāzur UI/auth/catalog/middleware/E2E files: clean.
- `git diff --check`: clean.
- Added-line credential scan: clean; repository-wide high-confidence scan passed across 380 text files.
- Independent production-mode browser visual QA: login and admin dashboard render without broken assets, clipping, console errors, or JavaScript exceptions.
- Public production performance: median TTFB 54.5 ms, median LCP 598 ms, p95 full load 742.8 ms, CLS 0 across 21 samples.
- Responsive matrix: 18/18 page/viewport combinations passed with no horizontal overflow or broken images from 360×800 through 1920×1080.
- Global web lint still has historical `any` and non-null assertion debt in legacy routers; do not claim global lint clean.

## Saudi statutory research and documentation — 2026-07-13

- Official-source research covers the amended Labor Law, contracts/Qiwa, hours/Ramadan/overtime, leave, discipline, termination/EOSB, GOSI/SANED/occupational hazards, WPS/Mudad, health insurance, Nitaqat/localization, non-Saudi immigration, tax and PDPL.
- Principal HRSD, GOSI, MISA, Qiwa, ZATCA, SDAIA and 2026 Nitaqat URLs returned HTTP 200; CHI and NCA portals timed out from the research environment and are explicitly marked for direct verification.
- `docs/saudi-statutory-requirements.md` is the researched baseline; `docs/statutory-gap-analysis.md` identifies P0/P1/P2 gaps and required implementation order.
- P0 finding: current GOSI implementation omits SANED/occupational-hazard branch detail, returns zero employer contribution for ordinary non-Saudis, uses an incorrect/incomplete base/rate model, and must not be used for real payroll.
- P0 finding: current EOSB drops partial years and separation/resignation branches; Mudad output is internal rather than an officially validated bank/Mudad file.
- Login and dashboard overclaims were removed; external systems are described as workflows/mock adapters, not live compliance or authority acceptance.
- `node scripts/validate-docs.mjs`: 24 Markdown files, 40,834 words, 13 valid relative links and 12 valid RAG manifest entries.

## Resume instructions

1. Read this file.
2. Read `.hermes/plans/2026-07-13_085441-taazur-customer-demo-shipment.md`.
3. Run `git status --short` and inspect uncommitted work.
4. Continue the first non-verified workstream in the delivery board.
5. Update this file immediately after each verified milestone with actual command/browser evidence.
6. Do not change a module from Preview/Planned to operational until its route, data, action, role access, and browser verification exist.
7. Never print or commit Supabase, Gemini, government, bank, or other credentials.
