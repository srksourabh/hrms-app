# Taāzur Module Reference

**Inventory:** 22 modules, 65 distinct PRD feature references
**Current catalog distribution:** 6 live workspaces, 15 operational demos, 1 mock integration
**Sources:** `apps/web/lib/module-catalog.ts`, `packages/demo/src/module-workflows.ts`

## How to use this reference

- **Route** identifies the primary implemented or demo surface.
- **Status** follows the documentation truth model.
- **Actions** are customer-demo operations unless stated otherwise.
- A route marked **live** may still depend on unavailable database/integration configuration.
- Authority-facing behavior is never implied by a generic “success” message.

## Phase 1 — Core HR and payroll

### 1. People & Organization / الأفراد والهيكل التنظيمي

- **Status:** Implemented live workspace
- **Primary route:** `/employees`; module detail `/modules/people-organization`
- **Audience:** HR Manager, HR Specialist; Department Manager needs team-scope enforcement
- **Purpose:** employee master data, departments, reporting lines, role-aware access, dual dates
- **Capabilities:** Employee 360 profiles; organization structure; role-aware access; Hijri + Gregorian dates
- **Demo records:** Omar Al-Dossary; Priya Menon in notice period
- **Demo actions:** Create employee draft; Export bilingual employee directory
- **Usability:** employee list → profile → edit; separate “New Employee” form
- **Critical controls:** nationality, encrypted identity/passport/Iqama/IBAN, GOSI cohort/date, department, manager, salary, expiry validation, tenant isolation

### 2. Company Onboarding / تهيئة الشركة

- **Status:** Operational demo with dedicated wizard
- **Primary route:** `/modules/company-onboarding`; related settings `/settings`
- **Audience:** HR Manager only in module workflow
- **Steps:** Company identity → Saudi compliance → Branches & work → Payroll setup → Review & activate
- **Fields:** English/Arabic legal names, CR, unified number, company activity, Nitaqat activity, GOSI number, VAT number, Saudization target, branches, headquarters, work patterns, bank, IBAN, payroll day, housing/transport allowances
- **Outcome:** deterministic activation reference, success banner, audit event attributed to the user
- **Explicit limit:** does not provision a production tenant, verify bank details, or contact an authority
- **Critical controls still needed:** persistent resumable state, approval, actual tenant provisioning transaction, rollback, duplicate CR checks, regulatory effective dating

### 3. Payroll & Final Settlement / الرواتب والتسوية النهائية

- **Status:** Implemented core engine and live screens; statutory gaps remain
- **Routes:** `/payroll`, `/payroll/new`, `/payroll/[id]`, `/modules/payroll-settlement`
- **Audience:** HR Manager; Payroll Admin in RBAC; HR Specialist view-only under current capabilities
- **Capabilities:** monthly payroll, GOSI logic, EOSB settlement, bilingual payslips, consistency guardrail
- **Demo actions:** Confirm joining allowance; Generate five demo payslips
- **Core states:** draft, pre-check, ready, completed, cancelled
- **Critical warning:** current GOSI, expatriate hazard contribution, contribution base, rate effective-dating, EOSB partial-year/resignation, overtime, deductions, and Mudad format require correction/validation before production use. See statutory gap analysis.

### 4. Time, Leave & Attendance / الوقت والإجازات والحضور

- **Status:** Live leave routes plus operational module demo
- **Routes:** `/leave`, `/leave/new`, `/modules/time-leave-attendance`
- **Audience:** all four demo roles with different ownership/approval scopes
- **Capabilities:** Saudi leave types, approvals, shifts, Ramadan hours
- **Demo actions:** Approve pending leave; Record time-correction draft
- **Data:** leave types, requests, balances; attendance fixture records
- **Critical controls:** statutory leave rule templates, sick-pay tiers, maternity/paternity/bereavement/Hajj rules, working-time/overtime, Ramadan applicability, idempotent accrual, team/ownership scope

### 5. Documents & Certificates / المستندات والشهادات

- **Status:** Live document screen plus operational demo
- **Routes:** `/documents`, `/documents/upload`, `/modules/documents-certificates`
- **Audience:** HR roles for company records; employees for owned documents
- **Capabilities:** document vault, expiry alerts, certificates, employee uploads
- **Demo actions:** Add encrypted demo document; Queue bilingual expiry reminders
- **Critical controls:** malware scanning, storage encryption, signed URLs, versioning, retention/legal hold, identity masking, access audit, actual 90/60/30 scheduling

### 6. Notifications & Reports / الإشعارات والتقارير

- **Status:** Operational demo; notification procedures exist
- **Route:** `/modules/notifications-reports`
- **Capabilities:** email/SMS/in-app, headcount, payroll summary, KPI boards
- **Demo actions:** Generate workforce report; Schedule Sunday 08:00 AST report
- **Critical controls:** recipient authorization, delivery status, retry/dead-letter handling, template localization, opt-out rules where applicable, report export privacy

## Phase 2 — Employee lifecycle and recruitment

### 7. Recruitment & Candidate CRM / التوظيف وإدارة المرشحين

- **Status:** Live route family and extensive tRPC/data model
- **Routes:** `/recruitment`; jobs, candidates, applications, interviews, offers, checks, referrals, onboarding descendants
- **Audience:** HR Manager, HR Specialist, Recruiter; Department Manager view scope
- **Capabilities:** pipeline, candidate database, scheduling, bilingual offers
- **Demo actions:** Advance candidate to offer; Prepare demo offer
- **Critical controls:** candidate consent, purpose limitation, retention, background-check legality/consent, AI explainability and human decision, salary/Nitaqat preview accuracy

### 8. Onboarding & New-Hire Copilot / التهيئة ومساعد الموظف الجديد

- **Status:** Live 30/60/90 routes plus operational module demo
- **Routes:** `/recruitment/onboarding`, `/recruitment/onboarding/new`, `/modules/onboarding`
- **Capabilities:** plans, checklists, buddy, AI copilot
- **Demo actions:** Complete manager check-in; Assign equipment task
- **Critical controls:** Saudi/non-Saudi templates, Qiwa contract, GOSI/insurance registration, work permit/Iqama for non-Saudis, due-date evidence, owner/escalation, probation milestones

### 9. Offboarding & Alumni / إنهاء الخدمة والخريجون

- **Status:** Operational demo; supporting retention/recruitment schemas exist
- **Route:** `/modules/offboarding`
- **Capabilities:** exit checklist, access/asset closure, knowledge transfer, rehire eligibility
- **Demo actions:** Complete knowledge transfer; Calculate demo settlement
- **Critical controls:** resignation/termination legal path, notice, EOSB, final wage deadline, leave payout, visa/final-exit process, insurance/GOSI deregistration, certificate of service, access revocation, legal hold

### 10. Learning, Skills & Career / التعلم والمهارات والمسار المهني

- **Status:** Operational demo with live retention route family
- **Routes:** `/retention/skills`, `/retention/skills/new`, `/retention/career`, `/retention/career/new`, `/modules/learning-skills`
- **Capabilities:** competency profiles, gaps, catalog, career pathways
- **Demo actions:** Enroll course; Verify skill evidence
- **Critical controls:** certificate expiry, role-required training, evidence verification, employee visibility, accessibility

### 11. Benefits, Rewards & Recognition / المزايا والمكافآت والتقدير

- **Status:** Operational demo with retention routes/data
- **Routes:** `/retention/rewards`, descendants, `/modules/benefits-rewards`
- **Capabilities:** benefit packages, pay bands, pay equity, recognition
- **Demo actions:** Publish recognition; Generate benefit comparison
- **Critical controls:** health-insurance eligibility/dependants/class, insurer/policy dates, taxable/payroll treatment, non-discrimination, spot-bonus approvals

## Phase 3 — Saudi government and intelligence

### 12. Government Integrations / التكاملات الحكومية

- **Status:** Mock integration only
- **Routes:** `/modules/government-integrations`, related `/qiwa`
- **Adapters:** Qiwa, Mudad, GOSI, Muqeem, bank payroll, ZATCA
- **Demo actions:** MOCK Qiwa check; MOCK Mudad validation; MOCK GOSI reconciliation
- **Mandatory copy:** “MOCK INTEGRATION · NO AUTHORITY CALL” and “No Saudi authority or bank is contacted.”
- **Critical controls:** real credentials, API eligibility, consent/authorization, contract tests, idempotency, signing, encryption, retries, manual fallback, authority acknowledgement, immutable audit

### 13. Nitaqat & Compliance / نطاقات والامتثال

- **Status:** Live compliance routes plus operational demo
- **Routes:** `/compliance`, `/compliance/new`, `/modules/nitaqat-compliance`
- **Capabilities:** band tracking, simulator, regulatory configuration, pre-submission controls
- **Demo actions:** Simulate Saudi hire; Assign expiry corrective action
- **Critical warning:** Nitaqat logic changes by activity, size, occupation, location, calculation period, and current ministerial decisions. The 80%/High Green fixture is illustrative, not an authority result.

### 14. AI Workforce Intelligence / ذكاء القوى العاملة

- **Status:** Operational demo with implemented provider-agnostic LLM layer and AI data/router scaffolding
- **Routes:** `/ai`, `/modules/ai-intelligence`
- **Capabilities:** briefings, cost prediction, attrition, compliance copilot
- **Demo actions:** Generate fixture-only brief; Explain recommendation/evidence
- **Critical controls:** PII minimization, prompt-injection resistance, source citations, effective dates, confidence limits, human approval for consequential actions, model/provider audit, no invented legal answer

## Phase 4 — Performance, engagement, expenses

### 15. Performance, Goals & Probation / الأداء والأهداف وفترة التجربة

- **Status:** Operational demo with live retention routes/data
- **Routes:** `/retention/reviews`, `/retention/goals`, descendants, `/modules/performance-goals`
- **Capabilities:** reviews, goals, AI drafts, probation tracking
- **Demo actions:** Record check-in; Submit demo review
- **Critical controls:** probation rule effective dates and contract clause, extension consent/registration, bias review, employee acknowledgement, appeal/correction

### 16. Engagement & Retention / المشاركة والاحتفاظ

- **Status:** Operational demo with live engagement route/data
- **Routes:** `/retention/engagement`, descendants, `/modules/engagement-retention`
- **Capabilities:** pulse surveys, eNPS, employer brand, stay interviews
- **Demo actions:** Queue five fictional invitations; Assign workload review
- **Critical controls:** anonymity thresholds, confidential free text, consent/transparency, manager access limits, anti-retaliation, action follow-through

### 17. Travel, Expenses & Delegation / السفر والمصروفات والانتداب

- **Status:** Operational demo
- **Route:** `/modules/travel-expenses`
- **Audience:** employee submission; manager approval; HR processing
- **Capabilities:** trips, claims, multi-currency, per diem, delegation
- **Demo actions:** Create personal expense draft; Approve field per diem
- **Critical controls:** policy version, receipt evidence, VAT treatment, cost center, currency rate source/date, segregation of duties, duplicate detection

### 18. Employee Relations & Cases / علاقات الموظفين وإدارة القضايا

- **Status:** Operational demo; PRD requires strict confidentiality
- **Route:** `/modules/employee-relations`
- **Audience:** HR Manager and HR Specialist only
- **Capabilities:** grievance, discipline, investigation, resolution
- **Demo actions:** Add confidential note; Record resolution draft
- **Critical controls:** legal basis, restricted fields/files, conflict handling, hearing/response evidence, sanction schedule, anti-retaliation, retention/legal hold, immutable access audit

## Phase 5 — Mobile, automation, platform

### 19. Mobile & Self-Service / الجوال والخدمة الذاتية

- **Status:** Responsive operational web demo; native apps are PRD-only
- **Route:** `/modules/mobile-self-service`
- **Capabilities:** Arabic-first UX, approvals, document capture, self-service
- **Demo actions:** Record fixture check-in; Prepare personal payslip
- **Critical controls:** device/session security, location consent, offline conflict handling, camera/file privacy, mobile accessibility

### 20. Autonomous Workflows / سير العمل الذاتي

- **Status:** Operational demo
- **Route:** `/modules/workflow-automation`
- **Capabilities:** multi-step agents, no-code rules, escalation, human gates
- **Demo actions:** Run expiry workflow; Create expense approval rule
- **Critical controls:** least privilege, dry run, approval checkpoint, idempotency, rollback/compensation, run cost ceiling, audit/evidence, kill switch

### 21. People Analytics / تحليلات الأفراد

- **Status:** Operational demo
- **Route:** `/modules/people-analytics`
- **Capabilities:** funnel, retention cohort, compensation, diversity
- **Demo actions:** Export anonymized pack; Save role-filtered view
- **Critical controls:** aggregation thresholds, role scope, re-identification prevention, metric definitions, source lineage, effective dates

### 22. API & Integration Marketplace / واجهة البرمجة وسوق التكاملات

- **Status:** Operational demo; public API/third-party connectors are not established as live
- **Route:** `/modules/integration-marketplace`
- **Capabilities:** public API vision, accounting/ERP connectors, health monitoring
- **Demo actions:** Test deterministic webhook; Save provider-neutral connector draft
- **Critical controls:** OAuth/credential vault, scopes, signatures, replay protection, rate limits, tenant boundary, secrets rotation, webhook delivery/retry, data-processing agreements

## Cross-module status and usability language

| Phrase | Required interpretation |
|---|---|
| **Connected fixture** | Component reads the deterministic demo object, not an external source |
| **Ready** | Internal workflow state only; not authority/bank acceptance |
| **Validated** | Local validation unless the screen names and proves an external acknowledgement |
| **Generated** | Artifact created/prepared; not sent unless submission evidence exists |
| **Queued** | Intent recorded; delivery not guaranteed until provider status confirms it |
| **Audit event** | Demo-local event unless persisted immutable audit storage is verified |
| **High Green** | Fixture label; not a current Nitaqat determination |
| **Compliance score** | Product/demo heuristic; not legal certification |

## Module QA checklist

For every module:

1. Verify allowed and denied roles at UI, route, and API layers.
2. Verify tenant or ownership scope.
3. Verify empty, loading, success, validation, failure, retry, and denied states.
4. Verify Arabic/English, RTL/LTR, Gregorian/Hijri where required.
5. Verify mobile, tablet, laptop, desktop, keyboard, focus, and screen reader behavior.
6. Verify audit attribution and no sensitive-value leakage.
7. Verify demo/mock labels remain visible after every action.
8. Verify external outcomes are never claimed without provider evidence.
9. Verify legal/rate calculations against effective-dated authoritative test cases.
10. Verify exports preserve authorization, masking, localization, and source lineage.
