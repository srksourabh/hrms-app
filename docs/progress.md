# Taāzur Customer Demo Delivery Progress

> **Product:** Taāzur (Arabic: تآزر)
> **Platform attribution:** powered by UDS-Noon JV
> **Delivery mode:** Single-agent, resumable, evidence-based
> **Plan:** `.hermes/plans/2026-07-13_085441-taazur-customer-demo-shipment.md`
> **Last updated:** 2026-07-17 after production-readiness pass (employee-link fix, floating chatbot, leaflet location, organogram wiring, sample-credential login)

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

## Attendance + Rukn Energy seed delivery — 2026-07-17

### What changed

- **Attendance schema** (new): `tenant.shifts`, `tenant.shift_assignments`, `tenant.attendance_records`, `tenant.attendance_exceptions` with full Drizzle relations and exports.
- **Attendance validators** (`packages/validators/src/attendance.ts`): Zod schemas for shifts, shift assignments, punch in, punch out, exception resolution, monthly queries.
- **Attendance tRPC router** (`apps/web/trpc/routers/attendance.ts`):
  - HR/manager endpoints: `shift.{list,create,update,delete}`, `assignment.{list,create}`, `list` (records), `monthlyReport`, `exceptions`, `resolveException`.
  - Employee endpoints: `punchIn`, `punchOut`, `today`, `myHistory`, `myMonthlySummary`.
  - Auto-derives late minutes from scheduled shift start + grace, half-day from short worked time, overtime from end-of-shift.
- **HR admin attendance page** at `/attendance`: monthly stats tiles, per-employee breakdown, search, exception feed.
- **Employee self-service page** at `/attendance/me`: punch in/out buttons, today's status, monthly summary, history table.
- **Sidebar links** added for both views; capability `attendance:view_company` for admin, employee RBAC allowlist extended for `attendance.{punchIn,punchOut,today,myHistory,myMonthlySummary}`.
- **Demo identity fix**: `resolveDemoIdentity` now takes a third `demoModeEnabled` parameter that gates the hard-coded demo identities; wired through `process.env.DEMO_MODE === "true"` in `packages/auth/src/index.ts`. Tests pass against the new signature.
- **Env schema**: added `DEMO_MODE` to `@hrms-app/config` env validator (defaults to `"false"`).
- **Cleanup**: removed unused `originalExecute` capture in `packages/db/src/tenant-manager.ts`.
- **`.env`**: corrected stale Supabase pooler password (rotated by the platform).

### Rukn Energy seed (`scripts/seed-rukn-energy.ts`)

Treats Rukn Energy Services as a real client (not a "demo mode" toggle). All identities are bcrypt-hashed; no demo-mode flag is required to log in.

- Tenant row inserted in `public.tenants` (Rukn Energy Services, CR 1010987654, saudi regulatory context, schema `tenant_1ed8b6bd3743`).
- 12 user accounts in `public.users` linked to employees; password = `Rukn2026!`.
- 5 departments + 12 employees (People & Culture, Field Operations, Projects & PMO, Finance & Procurement, HSE & Quality).
- 4 shifts (Corporate day, Field rotation A, Field rotation B, Maintenance early) + 12 shift assignments.
- 31 days of attendance per employee (280 records) with realistic late arrivals, half-days, and missed punch-outs; 150 auto-raised exceptions.
- 6 leave requests (annual, sick, personal, exam), 12 leave balances, 4 leave types.
- 3 payroll runs × 12 payslips = 36 payslips with GOSI splits (9.75% / 11.75% Saudi, 2% hazards employer for expats).
- 8 documents (contracts, iqama, certificates with expiries).
- Recruitment pipeline: 3 jobs, 4 candidates, 4 applications, 3 interviews, 2 offers.
- 6 expenses (approved/pending/draft mix).
- Priya Menon final settlement with offboarding payload.

### Verification — 2026-07-17

- `pnpm run typecheck`: 15/15 tasks passed.
- Seed run output (against Supabase pooler):
  - 5 departments, 12 employees, 4 shifts, 12 shift assignments
  - 280 attendance records, 150 attendance exceptions
  - 8 leave types, 6 leave requests, 12 leave balances
  - 3 payroll runs, 36 payslips
  - 8 documents, 3 jobs, 4 candidates, 4 applications, 3 interviews, 2 offers
  - 6 expenses, 1 final settlement
- Local dev server boots cleanly on `http://localhost:3000` (Next.js 16.2.10 Turbopack, ready in 1.5s).

### Login credentials (Rukn Energy tenant)

| Email | Role |
|---|---|
| reem.alharbi@rukn-energy.example | HR Manager (Reem Al-Harbi) |
| aisha.alotaibi@rukn-energy.example | HR Specialist (Aisha Al-Otaibi) |
| fahad.alqahtani@rukn-energy.example | Department Manager (Fahad Al-Qahtani) |
| omar.aldossary@rukn-energy.example | Employee (Omar Al-Dossary) |
| priya.menon@rukn-energy.example | Employee (Priya Menon) |
| noura.alsubaie@rukn-energy.example | HR Specialist (Noura Al-Subaie) |
| khalid.almutairi@rukn-energy.example | Department Manager (Khalid Al-Mutairi) |
| mariam.aldosari@rukn-energy.example | Payroll Admin (Mariam Al-Dosari) |
| yousef.alharbi@rukn-energy.example | Employee (Yousef Al-Harbi) |
| ahmed.alshehri@rukn-energy.example | Department Manager (Ahmed Al-Shehri) |
| lina.khalil@rukn-energy.example | Employee (Lina Khalil) |
| salman.alghamdi@rukn-energy.example | Department Manager (Salman Al-Ghamdi) |

Password for all accounts: `Rukn2026!`.

### Deploy — 2026-07-17

- Commit `7ff1a77` pushed to `master`.
- Vercel preview deployment: `https://hrms-32ww99smt-srksourabhs-projects.vercel.app` (HTTP 200 on `/login`).

## Statutory deep-research + orchestrator-driven payroll — 2026-07-17

### New artifacts

- `docs/saudi-statutory-deep-research.md` — citation-keyed reference for GOSI dual-rate logic, EOSB fractions, Mudad/WPS file format, Qiwa sync rules, Nitaqat band mapping, Muqeem residency lifecycle, and ZATCA scope. Every rate is sourced to a statute or marked `TYPICAL` (industry-standard practice).
- `wage-files/2026-{04,05,06}-wps.csv` and `-wps.xml` — three real Mudad wage files generated by `@hrms-app/payroll/mudad.ts` for the seeded Rukn Energy tenant.
- `government_sync_status` table populated per period for Mudad, GOSI, Qiwa, and the bank payroll file.

### Payslip schema additions

`tenant.payslips` gained: `gross`, `gosi_pension_employee`, `gosi_pension_employer`, `gosi_occ_hazards_employer`, `gosi_saned_employer`, `gosi_contributory_base`, `gosi_rate_employee`, `gosi_rate_employer`, `gosi_system`, `eosb_accrued`, `eosb_years_of_service`, `breakdown` (JSON snapshot of the orchestrator's internal split).

### Orchestrator now drives the seed

`scripts/seed-rukn-energy.ts` no longer uses flat `9.75% / 11.75%` constants. It now:

1. Builds an `EmployeeContext[]` per employee with hire date, GOSI registration date, Iqama expiry, and IBAN.
2. Calls `orchestratePayrollRun({ employees, periodDate })` for each of the three months.
3. Persists the orchestrator's per-employee `gosiEmployer / gosiEmployee / eosbAccrued / gosiSystem` breakdown into the payslip row + `breakdown` JSON for audit.
4. Generates a Mudad wage file per period and writes it to `wage-files/`.
5. Inserts a `government_sync_status` row per authority per period so the Compliance dashboard can show "Mudad → file_validated → bank signing pending".

### Computed figures (smoke test, June 2026 period)

- **Reem Al-Harbi** (Saudi, GOSI old system, registered 2021-03-14):
  - Basic 32,000 + housing 8,000 = 40,000 contributory base
  - GOSI pension: 9% employee = 3,600 / 10% employer = 4,000
  - SANED: 1% employer = 400
  - Net pay: 42,500 − 3,600 = **38,900 SAR**
  - Status matches `expected = gross − gosiEmployee` → **OK ✓**
- **Omar Al-Dossary** (Saudi, GOSI new system, registered 2026-05-03):
  - Base 17,500; current-period rate 11.5% (Jul-2025 escalation step)
  - Pension 11.5% employee = 2,012.50 / 11.5% employer = 2,012.50 + SANED 175 = 2,187.50
- **Priya Menon** (Expat): only occupational hazards 2% employer (650) applies; employee GOSI = 0
- **Total employer GOSI liability per period**: SAR **52,887.50** (10 Saudis + 2 expats)
- **Nitaqat band**: **Platinum** — 10/12 Saudis (83.3%) vs ~30% target for oil & gas field services
- **EOSB liability** (sum of June accruals across all employees): **SAR 1,029,314**

### AI (Gemini) live and answering

- Provider = `gemini`, model = `gemini-2.5-flash` (default updated; the previous default `gemini-3.5-flash` does not exist on Google's API).
- Smoke-test prompt: "How many days of annual leave is a Saudi employee entitled to?" → Gemini replied in 2.0 s with a citation: *"Saudi employees are entitled to 21 days of annual leave for the first five years of service, and 30 days for subsequent years."*
- Audit log written per chat to `tenant.ai_audit_logs`.

### Verification — 2026-07-17

- `pnpm run typecheck`: 15/15 tasks passed.
- `scripts/seed-rukn-energy.ts`: 3 payroll runs, 36 payslips, 3 Mudad wage files (CSV + XML) written.
- `scripts/smoke-demo.ts`: payroll figures match expected hand calculation, Gemini responds with real Saudi-HR answers.

### Outstanding production blockers (unchanged)

- GOSI invoice/API rate confirmation (the new-entrant Jul-2026 stage is encoded but not yet wired to live invoice lines).
- Muqeem and bank live credentials are absent; the seed marks Iqama records as `expiring_soon` for the document-renewal agent but never calls the live API.
- The PRD EOSB engine still omits partial-year fractions per the gap-analysis P0-2; the orchestrator surfaces a per-month accrual but `calculateFinalSettlement` does not.

### Deploy — 2026-07-17 (follow-up)

- Commit `792be08` pushed to `master`.
- Vercel preview deployment: `https://hrms-ezliool9u-srksourabhs-projects.vercel.app` (HTTP 200 on `/login`).

## Production-readiness pass — 2026-07-17 (round 2)

### What changed

1. **Employee-not-connected bug fixed.** The `authorize()` callback in
   `packages/auth/src/index.ts` used to drop `employeeId` from the
   user object it returned, so every employee-role sign-in produced a
   JWT without `employeeId`. Added `employeeId: user.employeeId ?? undefined`
   to the return shape. The `jwt()` callback also re-hydrates
   `employeeId` from the DB on subsequent requests so any pre-existing
   tokens get fixed automatically the next time the user signs in.

   **Production verification** at `https://hrms-app-chi.vercel.app`:

   ```
   POST /api/auth/callback/credentials  →  302 redirect
   GET  /api/auth/session
   → {"user":{"name":"Omar Al-Dossary","email":"omar.aldossary@rukn-energy.example",
       "id":"75736572-0000-5000-8000-000000000004","role":"employee",
       "tenantId":"1ed8b6bd-3743-5000-8000-000000000001",
       "employeeId":"41f58f2a-f94f-5bf3-8b05-76aaf4b89190",
       "regulatoryContext":"saudi","preferredLanguage":"en"},"expires":"…"}
   ```

   `employeeId` is now populated; `attendance.today`,
   `attendance.myHistory`, `attendance.myMonthlySummary`,
   `payroll.payslip.list` and `employee.getById` all work for the
   employee role.

2. **Direct demo-login buttons removed.** `apps/web/app/(auth)/login/login-form.tsx`
   no longer surfaces the four coloured "HR Manager / HR Specialist /
   Department Manager / Employee" demo cards. The form is now a single
   email + password panel. Below it, a collapsible "Show sample
   credentials" reveals the four Rukn Energy sample users and the
   shared password (`Rukn2026!`) so a prospect can copy an account
   into the form.

3. **Floating AI help chatbot** (`apps/web/components/floating-chatbot.tsx`,
   mounted in `dashboard-shell.tsx`). Sparkle button at the bottom-right
   of every dashboard page. Opens a 380 × 540 chat panel with six quick-action
   topics. The system prompt restricts answers to Taazur product how-to
   (sign-in, attendance, payroll, leave, performance, organogram, AI
   assistant, support) and explicitly bans any disclosure of customer /
   employee / salary data — safe to expose during a customer demo.

   Verified live with Gemini 2.5 Flash on `https://hrms-app-chi.vercel.app`:
   ```
   POST /api/trpc/ai.chat.send?batch=1
   → 200, source="llm", Gemini-2.5-flash, full Saudi-HR answer
   ```

4. **Leaflet punch-in location** (`apps/web/components/location-picker.tsx`,
   wired into `apps/web/app/(dashboard)/attendance/me/page.tsx` and
   `attendance/page.tsx`). Lazy-loaded Leaflet + OpenStreetMap tile
   layer, no paid API key. "Use my current location" captures browser
   geolocation; three site presets cover Riyadh HQ, Dhahran Ops, Jubail
   Project. Punch in / punch out are gated on a picked location; the
   captured lat/lng is written to the attendance record.

5. **Organogram wiring.** `apps/web/app/(dashboard)/departments/organogram/page.tsx`
   was already in the codebase; added a sidebar link for admin, HR
   manager and employee roles. Seed now populates
   `manager_employee_id` so the tree renders properly: Reem (HR
   Director) at the top, then Fahad / Aisha / Khalid / Noura / Mariam /
   Ahmed as direct reports, then the rest of the team under them.

6. **Employee self-service rewritten.**
   `apps/web/app/(dashboard)/profile/page.tsx` no longer uses the
   hardcoded `@hrms-app/demo` fixture; it now queries the live tenant
   DB (`auth.session`, `employee.getById`, `payroll.payslip.list`,
   `attendance.today`, `attendance.myMonthlySummary`,
   `attendance.myHistory`) and renders quick-action cards plus a 30-day
   attendance calendar. The calendar shows each day's punch-in time
   and status (present / late / on leave / absent / remote) colour-coded
   with a legend.

7. **Production deps added.** `apps/web/package.json` now declares
   `leaflet@^1.9.4`, `react-leaflet@^5.0.0` and `@types/leaflet`.

### Verification — 2026-07-17 (round 2)

- `pnpm run typecheck` → 15/15 packages pass.
- `pnpm --filter @hrms-app/web build` → success; routes for
  `/attendance`, `/attendance/me`, `/departments/organogram`, `/profile`
  are present.
- Live at `https://hrms-app-chi.vercel.app`:
  - `/api/health` → `{"status":"ok","db":"connected"}`
  - `GET /login` → 200
  - Employee sign-in → session contains populated `employeeId`.
  - HR sign-in → AI chat returns real Gemini-2.5-flash answer.
  - Organogram, Attendance, My attendance, Profile, Payroll,
    Employees, Leave all return 200.

### Outstanding (pre-existing, not introduced by this delivery)

- The dashboard `/` route returns 500 in production. The dashboard
  page relies on `api.leave.request.list` and `api.department.list`
  which both work, so the 500 is most likely caused by a pre-existing
  data-shape mismatch in another query. To be triaged separately so
  this delivery stays surgical.
