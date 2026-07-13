# Saudi Statutory Product Gap Analysis

**Assessment date:** 13 July 2026
**Compared:** current repository, customer-demo UI, `docs/02-prd.md`, and `saudi-statutory-requirements.md`

## 1. Executive conclusion

Taāzur has a broad Saudi HR product model, strong demo coverage, tested role/ownership foundations, dual-date UI, payroll/leave packages, tenant-schema scaffolding, and explicit mock adapters. It is **not yet safe for real Saudi payroll, statutory reporting, insurance administration, immigration case management, or legal-compliance certification**.

The largest gaps are not cosmetic. Current GOSI logic produces materially incomplete amounts, EOSB omits legal branches and service fractions, the WPS export is not an official validated file, health insurance lacks a lifecycle model, immigration/right-to-work workflows are missing, statutory rules are hard-coded/non-effective-dated, and non-employee roles are not consistently capability-enforced at routes/procedures/data scope.

## 2. Severity model

| Priority | Meaning |
|---|---|
| **P0 — block real use** | Can cause unlawful pay, under/overpayment, unauthorized disclosure/action, false authority claim, or inability to prove legal compliance |
| **P1 — required before production HR operation** | Important statutory/operational control without which manual workarounds are unsafe or unauditable |
| **P2 — maturity** | Needed for scale, automation, assurance, or differentiated UX after core legal operation is sound |

## 3. P0 gaps

### P0-1 — GOSI engine is materially incorrect/incomplete

**Evidence:** `packages/payroll/src/gosi.ts`.

Current behavior:

- non-Saudi returns employee 0 and employer 0;
- contributory base includes transport;
- `old` uses 9% employee / 9% employer;
- `current` uses 10% employee / 9.75% employer;
- no SANED branch, occupational-hazard branch, GCC protection, stage effective date, or invoice reconciliation.

Required behavior:

- legacy Saudi total: 9.75% employee / 11.75% employer on correct base;
- expected July 2026 new entrant stage: 10.75% employee / 12.75% employer, subject to GOSI invoice/API transition confirmation;
- ordinary non-Saudi: 0% employee / 2% employer occupational hazards;
- GCC: separate home-state coordination;
- basic + housing/covered remuneration, not automatic transport;
- separate branch lines, cap/minimum, effective date, source and invoice result.

**Action:** replace `gosiSystem: old|null` with explicit insurance regime, prior-contribution status, stage/effective period and authority result. Build official example tests before changing production output.

### P0-2 — EOSB/final settlement omits mandatory branches

**Evidence:** `packages/payroll/src/esb.ts`, `packages/db/src/schema/tenant/final_settlements.ts`.

Current behavior uses completed whole years and current clock, no separation date/reason, no partial service, resignation tiers, force-majeure/marriage/childbirth exceptions, Article 80 evidence, wage-basis configuration, or notice/Article 77 distinction.

**Action:** deterministic separation-date engine with day/month fractions, contract/separation reason, full/reduced/forfeited branches, qualifying wage detail, separate salary/leave/overtime/notice/Article 77/repatriation lines, legal-review gate, one/two-week deadline.

### P0-3 — Overtime is an unvalidated input amount

**Evidence:** `packages/payroll/src/orchestrator.ts` accepts an amount per employee.

Missing actual/basic hourly wage, hours, ordinary/holiday/rest/Ramadan classification, approval, compensatory leave, 10/day/60/week exceptions, and annual ceiling configuration.

**Action:** attendance-to-overtime ledger, rule version, formula components, approvals/consent, holiday calendar, comp-time balance, payroll reconciliation.

### P0-4 — WPS/Mudad output is internal, not official

**Evidence:** `packages/payroll/src/mudad.ts`.

Current XML/CSV omits required identity/bank/header/processed-result structure, leaves Iqama null, and has no bank signature/status/rejection or Mudad acknowledgement.

**Action:** obtain current bank/Mudad specification; model source and processed files; validate schema/totals/IBAN/identity/unique reference; maker-checker; bank signature/status; individual retry; Mudad acceptance/justification; 30-day SLA. Keep current UI labeled mock/internal.

### P0-5 — Health insurance lifecycle is missing

Benefits/PRD labels do not establish policy/member/CHI operation.

Missing insurer, policy, class/network, member/dependants, relationship/eligibility, effective/expiry/cancellation, premium payer/upgrades, CHI status, additions/deletions, coverage-gap reconciliation, non-cancellation controls.

**Action:** dedicated insurance domain and workflows with current unified-policy legal review and insurer/CHI evidence. Never call a benefit assignment “covered” without acknowledgement.

### P0-6 — Non-Saudi right-to-work lifecycle is missing

Employee/document fields are insufficient for visa, work permit, Iqama, authorized occupation, skill class, profession change, transfer, exit-re-entry/final exit, passport/travel state, accreditation, dependants, fees and government references.

**Action:** immigration case model with dependencies, costs, employer/worker request type, evidence, rejection/reconciliation, Qiwa/Muqeem/Absher boundaries, expiry hard stops, Ajeer/Musaned separation.

### P0-7 — Fine-grained RBAC is not enforced consistently

**Evidence:** `packages/auth/src/rbac.ts`, `apps/web/middleware.ts`, `apps/web/trpc/server.ts`, routers.

- Employee/candidate route/procedure allowlists exist.
- Other recognized roles broadly pass routes/procedures.
- Sidebar/dashboard visibility is now capability-filtered but does not secure server data.
- Department Manager requires team/reporting-line scope.
- HR Specialist must not run payroll/manage settings/integrations.
- Sensitive compensation/talent/case/background-check fields need field-level access.

**Action:** capability-specific route/procedure guards, reporting-line scopes, ownership and field masking, export policy, database tests for every role/module/action.

### P0-8 — Persisted role enum conflicts with RBAC

`rbac.ts` declares `payroll_admin` and `recruiter`; public user-role enum omits them.

**Action:** choose canonical role model, migrate schema/session/fixtures/tests and deny unknown/stale roles.

### P0-9 — False legal/authority/region claims

Pre-audit login/dashboard copy claimed compliance, live operations and `me-south-1` hosting without evidence. Login wording was corrected; dashboard correction is in progress.

**Action:** automated prohibited-copy test and release review. “Submitted/accepted/paid/enrolled/compliant/hosted in region” requires evidence/reference.

### P0-10 — Statutory configuration is not effective-dated

Rates/rules are hard-coded or generic JSON without source, jurisdiction, cohort, effective period, approval, version, or closed-payroll immutability.

**Action:** regulatory configuration service/table with authority source, retrieved/reviewed dates, applicability expression, effective range, four-eyes publication, immutable historical version and rollback.

## 4. P1 gaps

### P1-1 — Contract/Qiwa lifecycle

Need Arabic governing version, worker acceptance/rejection, 85%/90% compliance dashboard, Saudi Nitaqat-count rule from 15 April 2026, amendments, actual-work/occupation/wage alignment, fixed/indefinite rules, notice/resignation clocks.

### P1-2 — Statutory leave templates

Generic leave accrual does not prove annual 21/30, sick 30/60/30 pay tiers, marriage/bereavement/birth, Hajj, exam, unpaid suspension, maternity, nursing, special-child and widow rules. Accrual idempotency/service-start/carryover/payout need tests.

### P1-3 — Attendance/working-time engine

Need actual-hour ledger, breaks, five-hour rule, 12-hour span, weekly 24-hour rest, Friday substitution evidence, Muslim Ramadan schedule, holidays, shift averaging/exception approvals.

### P1-4 — Wage deductions and payroll ledger

Need deduction reason/authority, 10% loan, five-day damage, one-quarter judicial/50% aggregate limits, maintenance priority, employer/employee contribution separation, negative-net hard stop, retro/correction/reversal, closed periods, GL/bank reconciliation.

### P1-5 — Nitaqat 2026–2028 engine

Current fixture’s `80% / High Green` is illustrative. Need activity, workforce size, year, band coefficients, average counts, SSCO occupation rules, salary/accreditation/worker-form counting, snapshots and Qiwa reconciliation. Occupation rules must be imported rather than transcribed universally.

### P1-6 — Discipline and employee-relations case controls

Need permitted sanction catalog, charge/investigation/defense evidence, 30/30/30/15/30 clocks, fine/suspension ceilings, fines register, grievance/appeal, conflicts, restricted files, anti-retaliation, legal hold, access audit.

### P1-7 — Termination/offboarding legal workflow

Offboarding demo needs contract/reason-specific notice, resignation 7/30/60 clocks, Article 80/81 evidence, job-search time, service certificate, document return, insurance/GOSI deregistration, immigration/repatriation, access/asset closure and settlement evidence.

### P1-8 — PDPL operation

PRD goals lack proven privacy inventory, notices/bases, ROPA, processor/subprocessor, transfer assessment, DPIA, DSAR, retention/destruction, legal hold, incident assessment and 72-hour notification workflow.

### P1-9 — Security and encryption proof

`*_enc` column names do not prove encryption. Need key service/rotation, write/read encryption tests, masking, MFA/PAM, DLP/export/watermark, audit for views/downloads, backup/replica destruction and tenant-level residency.

### P1-10 — Tenant provisioning/onboarding persistence

Company Onboarding is a client-local operational demo. Need transactionally persistent tenant, schema, administrator, company, branch, compliance, payroll/bank and branding configuration; duplicate CR check; resumable progress; approval; rollback; tenant-isolation tests.

### P1-11 — Government connector framework

Qiwa/Mudad/GOSI/Muqeem/bank/ZATCA remain mock/dormant. Need approved credentials/scopes, contract tests, code lists, signing, idempotency/replay protection, retries/dead letters, human fallback, acknowledgement/reconciliation, immutable audit. Never scrape portals or share credentials.

### P1-12 — Inspection/evidence export

Need point-in-time read-only evidence pack with original rule version and source files. Recalculating historical records using current rules is not acceptable.

### P1-13 — Special worker protections

Need maternity/pregnancy dismissal blocks, nursing, widow leave, childcare thresholds, juvenile job/hour/register controls, disability 25-worker/4% and accommodation/redeployment, work-injury handling.

### P1-14 — Recruitment/candidate privacy and fairness

Need notice/consent and retention for candidate/background checks, lawful-purpose restriction, accredited-provider evidence, restricted results, AI decision support/explainability, human decision and correction/appeal.

### P1-15 — Tax classification

No payroll income tax engine is needed for ordinary salary, but benefits/recoveries/intercompany/non-resident services need VAT/WHT decision records and evidence. Do not generate e-invoice for salary/payslip.

## 5. P2 gaps

- Native mobile applications and secure offline conflict handling.
- Saudi field RUM/INP and verified function/database/storage regions.
- Automated regulatory-feed ingestion with legal-review workflow.
- Advanced workforce cost forecast using effective GOSI/EOSB/insurance/levy rules.
- Privacy-preserving analytics with aggregation/re-identification controls.
- Audit/evidence search, legal hold and regulator inspection workspace.
- Localization simulator covering all activity/occupation tables.
- Insurer/bank/provider sandbox certification harnesses.
- Role-specific command centers beyond capability-filtered generic dashboard.
- Complete Arabic-first RTL copy and visual regression for every route/export/PDF/email.

## 6. Module-by-module gap matrix

| Module | Existing evidence | Critical missing requirements | Priority |
|---|---|---|---|
| People & Organization | Employee/department schema/routes, demo fixture | Right-to-work, SSCO/occupation history, dependants, identity validity, field-level scope | P0/P1 |
| Company Onboarding | Dedicated 5-step operational demo/test | Persistence, tenant provisioning, duplicate/authority/bank validation, approval/rollback | P1 |
| Payroll | Orchestrator, GOSI/EOSB tests, routes | Correct GOSI branches/base/cohorts, overtime, deductions, revisions, approvals | P0 |
| Final Settlement | Schema/basic formula | Partial service, reason/notice/Article 77/80/85/86, SLA, repatriation | P0 |
| Time/Leave | Generic accrual, requests/routes | Full statutory leave/pay/attendance/Ramadan/rest rules, idempotency | P1 |
| Documents | Metadata/expiry routes/demo | Storage security, versions, malware, access audit, retention/legal hold | P1 |
| Recruitment | Broad schema/routes | Candidate notices/consent/retention, check restrictions, AI fairness | P1 |
| New-hire Onboarding | 30/60/90 routes/demo | Qiwa/GOSI/insurance/right-to-work evidence and dependency gates | P1 |
| Offboarding | Demo fixture/actions | Legal termination and complete settlement/immigration/access workflow | P1 |
| Benefits | Demo/data concepts | Mandatory insurance policy/member/dependant/CHI lifecycle | P0 |
| Government Integrations | Explicit mock workspace | Authorized live connectors and acknowledgements | P1 |
| Nitaqat | Demo scenario/compliance screens | 2026–2028 dynamic activity/occupation engine and Qiwa reconcile | P1 |
| AI | Provider-neutral layer/scaffolding | Source/effective-date RAG, PII controls, risk tiers, human decision/audit | P1 |
| Performance/Probation | Demo/routes/data | 180-day/excluded-leave contract logic, equality/bias/appeal | P1 |
| Employee Relations | Demo/data concepts | Statutory sanction/investigation/grievance clocks/confidentiality | P1 |
| Travel/Expenses | Employee demo workflow | VAT/policy/currency/duplicate/segregation/reconciliation | P1 |
| Analytics | Demo | Metric lineage, role scope, aggregation privacy, historical rules | P2 |
| Integration Marketplace | Demo | Credential vault, OAuth/scopes/signatures/replay/rate/retry/DPA | P1 |

## 7. Required implementation order

### Release train A — stop incorrect statutory output

1. Keep all statutory/payroll/government output visibly Demo/Mock.
2. Replace GOSI model/engine with effective-dated branch calculation and official examples.
3. Replace EOSB/final-settlement engine.
4. Implement overtime and deduction ledgers.
5. Implement official WPS/bank/Mudad validation/reconciliation.
6. Add health-insurance and non-Saudi immigration domains.

### Release train B — authorization and evidence

7. Enforce capability/team/ownership/field scope on every route/procedure/query/export.
8. Reconcile persisted roles.
9. Implement immutable audit, regulatory version and inspection evidence.
10. Prove encryption/key management and PDPL workflows.
11. Implement persistent tenant onboarding and database isolation.

### Release train C — workforce compliance

12. Encode statutory leave/time/discipline/termination/special-worker controls.
13. Import Nitaqat/occupation rules and reconcile to Qiwa.
14. Implement approved connectors with fallback/reconciliation.
15. Legal/payroll/insurance/immigration review, sandbox certification, pilot parallel payroll.

## 8. Production acceptance criteria

Real payroll/compliance use is blocked until:

- independent Saudi payroll/legal review signs off rule version;
- current GOSI invoice/API examples pass for legacy/new/non-Saudi/GCC cohorts;
- EOSB test matrix covers fractions, all resignation tiers and exceptions;
- WPS source/output bank files validate and reconcile in sandbox;
- insured workers/dependants reconcile to CHI/insurer evidence;
- every non-Saudi has valid right-to-work dependencies;
- Nitaqat result reconciles to Qiwa for tenant activity/year;
- four-role authorization matrix passes UI/API/database/export tests;
- closed payroll is immutable and correction/reversal audited;
- PDPL notices, rights, retention, transfers, incident response and processors are operational;
- no UI copy overstates authority, compliance, payment, enrollment or hosting evidence.

## 9. Items not safely automatable without current authority input

- Exact new-GOSI transition rate around July/August 2026: take invoice/API rate.
- Nitaqat band/occupation result: reconcile to Qiwa/current procedural table.
- Work permit/Iqama/visa fees: capture government invoice.
- CHI dependant eligibility/class: apply current unified policy/insurer response.
- Public-holiday and Executive Regulation details not fully extracted: legal config review.
- Violation fine: current MHRSD schedule and inspector/court outcome.
- Record deletion date: record-class policy plus legal hold/PDPL.

## 10. Bottom line—what was missed

The PRD covers many Saudi concepts, but the implementation missed or under-modeled the operational core of:

1. correct multi-branch GOSI/SANED/occupational-hazard calculation;
2. non-Saudi employer contribution;
3. full EOSB and settlement law;
4. actual overtime and deduction calculation;
5. official WPS/bank/Mudad file lifecycle;
6. mandatory health-insurance membership/dependants;
7. end-to-end work authorization/immigration;
8. dynamic 2026–2028 Nitaqat and occupation localization;
9. statutory leave/time/discipline/special-protection rules;
10. fine-grained role/team/field authorization;
11. effective-dated regulatory configuration and point-in-time evidence;
12. PDPL operational workflows and proven encryption;
13. persistent company onboarding/tenant provisioning;
14. approved government integrations and acknowledgements;
15. accurate customer-facing legal/region/provider language.
