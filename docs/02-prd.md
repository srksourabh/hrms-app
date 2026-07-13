# Taāzur
## Product Requirements Document v5.0
### AI-Native Saudi HR & Payroll Platform for MSMEs

Date: 11 July 2026
Classification: Confidential
Status: Enhanced for engineering handoff (Claude Code ready)

---

## Document Control

| Version | Date | Change | Source |
|---|---|---|---|
| 2.0 | 11 Jul 2026 | Original 13-section PRD | Founding team |
| 3.0 | 11 Jul 2026 | Added 7 new sections (NFR, Accessibility, Pricing, SLA, RACI, Migration, Legal Docs), enhanced 5 existing sections (AI risk tiering, API failure playbook, security verification levels, data retention/RTO-RPO, go-live ownership) | Gap analysis against ISO 29148, ISO 27001, OWASP ASVS, WCAG 2.1 AA, PDPL, NIST AI RMF |
| 4.0 | 11 Jul 2026 | Added 13 new features closing HR generalist coverage gaps across all phases of recruitment, retention, and release (workforce planning, referrals, background/reference checks, 30/60/90 onboarding, succession planning, internal mobility, total rewards, recognition, stay interviews, employee relations, career pathing, alumni/boomerang tracking), plus new Section 21 | Research against SHRM Body of Applied Skills and Knowledge, full-cycle recruitment life cycle research, retention framework research (5 C's, total rewards), offboarding/alumni best-practice research |
| 5.1 | 13 Jul 2026 | Adopted the configurable Taāzur / تآزر product identity, bilingual lockup, UDS-Noon JV attribution, and white-label rules across product surfaces and generated outputs. Customer career domains remain tenant-configured. | Shipment branding |
| 5.0 | 11 Jul 2026 | Added Section 13.5, Data Structure & Entity Model: 45 entities across 12 domains, a core ERD, domain-grouped entity reference tables, a representative Prisma schema pattern, and indexing notes. Every entity traces back to a feature already defined in Sections 5-20; none are speculative | Brainstorm pass across every feature in the document, cross-checked against the tech stack (Section 4) and multi-tenancy model (Section 13.2) |

**Sections and features marked `[NEW]` or `[ENHANCED]` throughout this document carry an inline tag noting which revision introduced them** (v3.0 or v4.0). Untagged content is carried forward from v2.0 unchanged.

---

## Note for Claude Code / any coding agent reading this file

1. This document is the source of truth for what to build. Do not start implementation from memory of a similar product; requirements here override assumptions.
2. Section 2 (Non-Functional Requirements) sets hard numeric targets. Treat these as acceptance criteria, not aspirations.
3. Section 6.3 and Section 8 define the human-approval checkpoints and security gates that must never be bypassed, even for a "quick fix."
4. Where a requirement uses the phrasing **WHEN [trigger], THE SYSTEM SHALL [response]**, that is a testable acceptance criterion (EARS format). Write the test for it before writing the implementation.
5. If a section conflicts with another, Section 2 (NFR) and Section 8/9 (Security/Data) win. Flag the conflict rather than silently resolving it.
6. If you are running this through the `project-foundation` skill scaffold, this file maps to `docs/02-prd.md`; Sections 3 and 4 also feed `docs/03-tech-stack.md`, and Section 12 feeds `docs/04-ui-design.md`.

---

## Table of Contents

1. Product Overview `[ENHANCED]`
2. Non-Functional Requirements `[NEW]`
3. Portal & Login System
4. Tech Stack
5. Feature Plan, Five Phases
6. AI-Native Intelligence Layer `[ENHANCED]`
7. Autonomous HR Workflows
8. Compliance Plan `[ENHANCED]`
9. Application Security Plan `[ENHANCED]`
10. Data Security Plan `[ENHANCED]`
11. Accessibility Requirements (WCAG 2.1 AA) `[NEW]`
12. UI/UX Plan, All Portals
13. Backend Architecture `[ENHANCED]`
14. Scale-Up Plan
15. Pricing & Packaging `[NEW]`
16. SLA & Support Model `[NEW]`
17. RACI & Ownership Matrix `[NEW]`
18. Onboarding & Data Migration Plan `[NEW]`
19. Legal Documents Reference `[NEW]`
20. Go-Live Checklist `[ENHANCED]`
21. HR Generalist Practice Alignment `[NEW]`

---

## 1. Product Overview `[ENHANCED]`

**Product:** Taāzur, AI-Native Saudi HR & Payroll Platform for MSMEs (5-250 employees)

**Core value proposition:** An AI-native HR platform that keeps client data consistent across Qiwa, Mudad, and GOSI, automates the entire employee lifecycle from recruitment to offboarding, and gives leadership AI-powered insights to make smarter workforce decisions.

**What "AI-native" means:** AI is not a bolt-on feature. It is woven into every workflow. The recruitment pipeline uses AI to screen and rank candidates, onboarding checklists are auto-generated based on role and nationality, the compliance copilot answers HR questions in real time, and autonomous agents handle routine tasks (document renewal reminders, payroll pre-checks, training assignment) without human intervention.

**Target market:** Saudi private-sector companies with 5-250 employees.

**Languages:** Arabic (primary), English (secondary). Native RTL, not a translation layer.

**Hosting region:** AWS me-south-1 (Bahrain) for PDPL compliance.

### 1.1 Market Sizing `[NEW]`

| Metric | Estimate | Source basis |
|---|---|---|
| Total Saudi private-sector establishments, 5-250 employees | To be confirmed against GASTAT / Ministry of Commerce data before finalizing GTM spend | Placeholder, validate before Phase 3 fundraising or budget commitments |
| Serviceable segment (MSMEs currently on Excel or legacy HR tools) | To be confirmed via 15-20 discovery calls in target cities (Riyadh, Jeddah, Dammam) | Direct research, near-zero cost |
| Realistic Year 1 target | 20-40 paying companies | Matches Launch-stage infra capacity in Section 14 |

This table is intentionally left with placeholders rather than invented numbers. Do not proceed to investor materials or paid acquisition budgets until the two "to be confirmed" rows are filled from primary research.

### 1.2 Success Metrics `[NEW]`

| Metric | Target | Measured by |
|---|---|---|
| Time to first payroll run completed | Under 14 days from signup | Product analytics, onboarding funnel |
| Payroll run accuracy (zero Qiwa/GOSI mismatch at wage file export) | 100% for the consistency guardrail (Section 7); anything less blocks the export by design | Section 7 validation logs |
| Monthly active HR users per tenant | 70% of licensed seats | Product analytics |
| AI copilot query resolution without escalation to a human | 80% | Copilot session logs, Section 5.5 audit trail |
| Customer churn, first 12 months | Under 10% | Billing system |
| eNPS trend, per tenant `[NEW v4.0]` | Tracked and visible, no fixed target since baselines vary by tenant | Feature 4.5, quarterly |
| Boomerang hire rate, across all tenants `[NEW v4.0]` | Tracked as a leading indicator of offboarding quality, no fixed target in Year 1 | Feature 4.17 |

---

## 2. Non-Functional Requirements `[NEW]`

These are hard targets. Every feature in Section 5 must be built to satisfy these, not the other way around.

### 2.1 Performance

| Requirement | Target | Verified by |
|---|---|---|
| API response time, p95, standard CRUD endpoints | Under 300ms | Load test in CI, CloudWatch alarm |
| API response time, p95, AI copilot query (Claude Sonnet call) | Under 4 seconds | Load test, Section 5.4 token budget already caps this |
| Payroll batch calculation, 250 employees | Under 90 seconds | Load test against Phase 1 payroll engine |
| Page load, dashboard (any role), first contentful paint | Under 2 seconds on 4G | Lighthouse CI |
| Concurrent users supported per tenant, Launch stage | 50 concurrent without degradation | Load test matching Section 14 infra |

**WHEN** a payroll run is triggered for a tenant with up to 250 employees, **THE SYSTEM SHALL** complete calculation within 90 seconds. Verified by: automated load test with synthetic 250-employee dataset, run in CI before every payroll module release.

### 2.2 Availability

| Requirement | Target |
|---|---|
| Uptime commitment, Launch/Growth stage | 99.5% monthly (see Section 16 for tiered SLA) |
| Uptime commitment, Scale/Enterprise stage | 99.9% monthly |
| Scheduled maintenance window | Outside 08:00-18:00 AST, communicated 48 hours in advance |

### 2.3 Scalability

| Requirement | Target |
|---|---|
| Tenants supported per DB cluster before sharding | 500 (already defined in Section 14, restated here as a hard NFR) |
| Payroll queue processing during peak (25th-28th of month) | No job waits longer than 15 minutes in queue |

### 2.4 Data Integrity

**WHEN** a payroll run attempts to export a wage file, **THE SYSTEM SHALL** block the export if any employee's payroll basic + housing + allowances does not equal their Qiwa-registered contract salary. Verified by: the existing Section 7 consistency guardrail, with an automated test covering the mismatch case explicitly.


---

## 3. Portal & Login System

### 3.1 Single App, One Login, Five Roles

Taāzur is one application with one login page. Every user logs in at the same URL. The system detects their role and shows a role-specific dashboard. There is no separate "employee app" vs "HR app," it is one unified experience with permissions controlling what each role can see and do.

### 3.2 The Five Roles

| # | Role | Who | What they see | What they can do |
|---|---|---|---|---|
| 1 | Super Admin | Company owner, CEO, MD | Everything + billing + company settings | Full system control, user management, subscription, org structure |
| 2 | HR Manager | HR head, HR generalist | Full HR suite + AI insights + compliance | All HR operations, payroll, recruitment, onboarding, reports, AI copilot |
| 3 | Department Manager | Team lead, dept head | Team dashboard + approvals | Approve leave/expenses, view team payroll, performance reviews, team analytics |
| 4 | HR Specialist | Payroll officer, recruiter, HR assistant | Assigned modules only | Specific tasks: payroll processing, recruitment pipeline, document management |
| 5 | Employee | All employees | Self-service portal | View payslips, request leave, update personal info, view documents, submit expenses |

Additionally:

| # | Role | Who | What they see |
|---|---|---|---|
| 6 | Candidate (external) | Job applicants | Public career page + application tracker |

### 3.3 Login Flow

```
Login screen (AR|EN toggle) -> Email + Password -> MFA (6-digit TOTP) -> Role-based routing:
- Super Admin -> Admin Dashboard
- HR Manager -> HR Dashboard
- Manager -> Team Dashboard
- HR Specialist -> Task Dashboard
- Employee -> Self-Service Portal
```

Also supports SSO login via Microsoft (SAML/OIDC) as an alternative to email/password on the same screen.

### 3.4 Permission Matrix

| Module | Super Admin | HR Manager | Manager | HR Specialist | Employee |
|---|---|---|---|---|---|
| Company settings | Full | View | - | - | - |
| Org structure | Full | Full | View own dept | View | - |
| Employee records | Full | Full | View team | Assigned only | Own record |
| Recruitment | Full | Full | View dept openings | Assigned pipeline | Apply (candidate) |
| Onboarding/Offboarding | Full | Full | View team | Execute checklists | Own tasks |
| Payroll run | Full | Full | - | Execute (if assigned) | - |
| Payslips | Full | Full | View team (if allowed) | Generate | Own payslip |
| Leave management | Full | Full | Approve team | Process | Request own |
| Attendance | Full | Full | View team | Manage | View own |
| Performance | Full | Full | Review team | Coordinate | View own |
| Training | Full | Full | Assign team | Coordinate | View own |
| Travel/Expenses | Full | Full | Approve team | Process | Submit own |
| Documents | Full | Full | View team | Manage | View/upload own |
| Compliance/Nitaqat | Full | Full | View | View | - |
| AI Insights | Full | Full | Team insights | - | - |
| AI Copilot | Full | Full | Full | Full | Basic (leave/policy) |
| Reports | Full | Full | Team reports | Assigned reports | - |
| Surveys | Full | Full | View team results | Distribute | Respond |
| Billing | Full | - | - | - | - |
| Audit logs | Full | View | - | - | - |

---

## 4. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js 14+ (App Router) | SSR for Arabic SEO, built-in i18n routing, React Server Components |
| UI Library | Shadcn/ui + Tailwind CSS | RTL support via dir="rtl", themeable, accessible |
| State Management | TanStack Query | Server-state caching, optimistic updates, auto-refetch |
| Backend | NestJS (Node.js) | TypeScript end-to-end, modular, guards/interceptors for RBAC |
| Database | PostgreSQL 16 + pgvector | Schema-per-tenant multi-tenancy, vector search for AI RAG |
| Cache/Queue | Redis + BullMQ | Job queues, session cache, rate limiting, AI response cache |
| File Storage | AWS S3 (me-south-1) | Encrypted document storage with KMS |
| Auth | NextAuth.js + JWT | MFA, SSO (SAML/OIDC), role-based routing |
| ORM | Prisma | Type-safe queries, migrations, schema-per-tenant |
| AI/ML | Claude API (Anthropic) | Arabic support, tool-use for structured queries, large context |
| AI Agents | LangGraph (TypeScript) | Autonomous workflow orchestration, multi-step HR task agents |
| Vector Store | pgvector | Regulation embeddings, candidate resume search, policy Q&A |
| Search | Meilisearch | Fast Arabic full-text search across employees, candidates, documents |
| Real-time | Socket.io | Live notifications, approval alerts, chat-based copilot |
| Email | AWS SES | Transactional emails, offer letters, alert notifications |
| SMS | Twilio | Saudi mobile number alerts, MFA fallback |
| CI/CD | GitHub Actions -> ECR -> ECS Fargate | Zero-downtime deploys, auto-scaling |
| Monitoring | CloudWatch + Sentry | Error tracking, job monitoring, latency alerts |
| PDF | @react-pdf/renderer | Arabic payslips, offer letters, reports, certificates |
| Video Interviews | WebRTC (Daily.co) | AI-assisted video interviews with transcript analysis |

**Vendor lock-in note (added in v3.0):** hosting is single-region (AWS me-south-1) by PDPL requirement, not choice. This is a compliance constraint, not a risk to mitigate; do not propose multi-region replication for this dataset without legal sign-off.

---

## 5. Feature Plan, Five Phases

### Acceptance Criteria Convention (added in v3.0)

Every feature below should get a written acceptance criterion before implementation starts, using this format:

**WHEN [trigger], THE SYSTEM SHALL [response]. Verified by: [test].**

To keep this document usable rather than bloated, full acceptance criteria are written out for Phase 1 (launch-critical) below as a worked example. Apply the same discipline to Phase 2 through 5 features as each phase enters active development, writing the criteria into the phase's task file in Claude Code rather than retrofitting all of them into this PRD today.

### Phase 1: MVP, Core HR + Payroll

| # | Feature | Description | Acceptance Criterion |
|---|---|---|---|
| 1.1 | Employee master record | Complete profile: personal data, Qiwa contract details, nationality, GOSI system, iqama/passport/work permit with expiry, bank IBAN, emergency contacts, employment history | WHEN an HR user submits a new employee record, THE SYSTEM SHALL reject submission if iqama/passport expiry, GOSI registration date, or IBAN format is invalid. Verified by: field validation unit tests |
| 1.2 | Organizational structure | Company hierarchy: departments, teams, reporting lines, org chart visualization | WHEN a department is deleted, THE SYSTEM SHALL block deletion if active employees are assigned to it. Verified by: integration test |
| 1.3 | Saudi payroll engine | Monthly calculation with GOSI dual-system logic, overtime at 1.5x, ESB accrual, Saudi-specific deductions | WHEN payroll is calculated, THE SYSTEM SHALL apply the correct GOSI rate per Section 8.2 formula based on registration date. Verified by: unit test against all rate tiers |
| 1.4 | Final settlement | Auto-calculate on termination: unpaid salary, accrued leave, ESB by tenure and exit reason | WHEN an employee is terminated, THE SYSTEM SHALL calculate ESB using the tenure-bracket formula in Section 8.3, including resignation adjustment. Verified by: unit test covering all tenure brackets |
| 1.5 | Mudad wage file export | WPS-compatible file generation in required format | WHEN a wage file is generated, THE SYSTEM SHALL validate it against the Mudad format spec before allowing download. Verified by: schema validation test |
| 1.6 | Bilingual payslips | Arabic + English PDF payslips with Saudi terminology | WHEN a payslip is generated, THE SYSTEM SHALL render correctly in both RTL Arabic and LTR English without layout breakage. Verified by: visual regression test |
| 1.7 | Document management | Upload, store, version-track all employee documents; expiry alerts at 90/60/30 days | WHEN a document is within 90 days of expiry, THE SYSTEM SHALL trigger the alert defined in Section 6, Agent 4. Verified by: scheduled job test |
| 1.8 | Consistency guardrail | Pre-export validation: flags payroll vs Qiwa contract mismatches | See Section 2.4 NFR, this is the canonical acceptance criterion for this feature |
| 1.9 | Leave management | Saudi leave types: annual (21/30 days), sick (tiered 30/60/30), maternity (12 weeks), Hajj (10-15 days), marriage/death, Ramadan hours | WHEN a leave request exceeds the employee's remaining balance for that leave type, THE SYSTEM SHALL block submission. Verified by: unit test per leave type |
| 1.10 | Hijri/Gregorian display | Dual-date on all screens using islamic-umalqura calendar | WHEN any date is displayed, THE SYSTEM SHALL show both Hijri and Gregorian formats. Verified by: visual test on 5 representative screens |
| 1.11 | RBAC + login system | Single login, 5 roles, permission matrix, MFA | WHEN a user without payroll permission attempts a payroll API call, THE SYSTEM SHALL return 403 regardless of frontend state. Verified by: security test suite, one per matrix cell in Section 3.4 |
| 1.12 | Company setup wizard | Onboarding: CR number, Nitaqat activity, bank details, allowance templates | WHEN a company completes setup, THE SYSTEM SHALL not allow payroll module access until all required fields are confirmed. Verified by: E2E onboarding test |
| 1.13 | Employee self-service | View payslips, request leave, update personal info, view documents | Standard CRUD, covered by Section 3.4 permission matrix tests |
| 1.14 | Notifications engine | Email + SMS + in-app alerts for approvals, expirations, payroll status | WHEN an approval is pending for more than 48 hours, THE SYSTEM SHALL send a reminder notification. Verified by: scheduled job test |
| 1.15 | Basic reports | Headcount, payroll summary, leave balance, document expiry reports | Standard reporting, covered by data accuracy tests against source tables |

### Phase 2: Employee Lifecycle + Recruitment

| # | Feature | Description |
|---|---|---|
| 2.1 | Recruitment pipeline | Position creation with salary range, competency requirements, and Nitaqat impact preview |
| 2.2 | Career page | Branded public career page (company.uds-hr.com/careers) with Arabic/English job listings |
| 2.3 | Candidate management | Candidate database with CV parsing, scoring, financial expectations, document storage, reference check log, and background/police clearance check status tracking `[ENHANCED v4.0]` |
| 2.4 | AI resume screening | AI ranks candidates against job requirements; highlights skill matches and gaps |
| 2.5 | Interview scheduling | Calendar-integrated interview booking with automated candidate notifications |
| 2.6 | AI interview assistant | AI-generated interview question sets based on role; post-interview transcript summarization |
| 2.7 | Offer letter generation | AI-drafted bilingual offer letters with salary, benefits, Qiwa-ready contract terms |
| 2.8 | Onboarding workflows | Role-specific checklist templates: IT setup, document collection, training schedule, buddy assignment, plus a structured 30/60/90-day plan (learn the role, integrate with the team, set early goals) rather than stopping at Day 14 `[ENHANCED v4.0]` |
| 2.9 | AI onboarding copilot | New employee chatbot: answers "where do I find X", "what's the leave policy", "who is my manager" |
| 2.10 | Offboarding workflows | Structured exit: asset return, IT access revocation sequencing, a templated knowledge-transfer handover document with a named successor or interim owner per open task, exit interview, final settlement trigger, and a rehire-eligibility flag (yes/no + reason) set by HR at closure `[ENHANCED v4.0]` |
| 2.11 | Competency and skills | Skill profiles per employee, competency ratings, skill gap analysis vs role requirements |
| 2.12 | Training management | Training catalog, session scheduling, completion tracking, certificate storage |
| 2.13 | Employee certificates | Track professional certifications, licenses, language skills with expiry alerts |
| 2.14 | Benefits management | Define and assign benefits packages: medical insurance, housing, transport, education allowance |
| 2.15 | Workforce planning `[NEW v4.0]` | Headcount forecasting and req justification, completed before a position is opened. This is Stage 0 of the recruitment life cycle, sitting upstream of Feature 2.1, and prevents reactive hiring by forcing a documented business case (budget line, replacement vs. net-new, urgency) before a requisition is approved |
| 2.16 | Employee referral program `[NEW v4.0]` | Employees submit referrals against open positions from their self-service portal; referral status is visible to the referrer without exposing full candidate detail; referral bonus tracking ties into Feature 2.14 benefits/payroll on successful hire and probation completion |
| 2.17 | Succession planning `[NEW v4.0]` | Identify critical roles and their readiness pipeline (ready now / ready in 1-2 years / development needed); links to Feature 2.11 competency data so gaps between a successor's current skill profile and the target role are visible, not guessed |
| 2.18 | Internal talent marketplace `[NEW v4.0]` | Internal job postings visible to employees before or alongside external posting on Feature 2.2's career page; supports internal mobility as a retention lever, since unfilled internal demand is one of the most common reasons capable employees leave |
| 2.19 | Alumni network and rehire tracking `[NEW v4.0]` | Former employees flagged rehire-eligible (Feature 2.10) are retained in a searchable alumni pool; boomerang hire rate is tracked as a recruiting-cost-reduction metric (see Feature 4.17) |

### Phase 3: Government Integration + Intelligence

| # | Feature | Description |
|---|---|---|
| 3.1 | Qiwa API integration | Contract creation, amendments, resignation workflow from inside Taāzur |
| 3.2 | Mudad API submission | Direct wage file submission replacing manual upload |
| 3.3 | GOSI reporting integration | Salary change notifications within 15-day window |
| 3.4 | Muqeem integration | Iqama renewal, exit re-entry permit management |
| 3.5 | Bank integration | SIF generation for Al Rajhi, SNB, Riyad Bank |
| 3.6 | Nitaqat dashboard + simulator | Live band tracking with "what if" hire/exit scenario modeling |
| 3.7 | AI executive briefings | Monthly natural-language summaries of payroll, compliance, workforce trends |
| 3.8 | AI workforce cost predictor | Forecast quarterly/annual people costs including GOSI escalation and ESB liability |
| 3.9 | AI attrition risk analyzer | Pattern detection on ESB thresholds, leave anomalies, contract end dates |
| 3.10 | AI compliance copilot | RAG-powered Q&A on Saudi labor law with article citations |
| 3.11 | AI payroll anomaly narrator | Natural-language explanation of overtime spikes, cost anomalies, deduction patterns |
| 3.12 | Regulatory config engine | Rates, formulas, leave rules as editable config, not hard-coded |
| 3.13 | Pre-submission anomaly detection | Auto-compare payroll vs Qiwa/GOSI before wage file submission |

### Phase 4: Performance + Engagement + Travel

| # | Feature | Description |
|---|---|---|
| 4.1 | Performance reviews | Configurable review cycles (quarterly, semi-annual, annual) with multi-rater support |
| 4.2 | Goals and OKRs | Individual and team goal setting, progress tracking, alignment to company objectives |
| 4.3 | AI performance summary | AI generates review drafts from goals, feedback, and achievement data for manager review |
| 4.4 | Probation tracking | Automated 180-day probation timeline with review milestones and Qiwa contract alignment |
| 4.5 | Surveys and feedback | Employee engagement surveys, pulse checks, anonymous feedback with AI sentiment analysis, plus a standing eNPS (employee Net Promoter Score) metric tracked over time, not just one-off survey scores `[ENHANCED v4.0]` |
| 4.6 | Travel and expenses | Trip planning, expense submission with receipt upload, multi-currency support, approval workflow |
| 4.7 | Delegation management | Business travel authorization, per-diem calculation, cost allocation to departments |
| 4.8 | Attendance and shifts | Clock-in/out (web, mobile, biometric integration), shift templates, Ramadan hours auto-switch |
| 4.9 | Employer branding | Internal campaigns, employee journey mapping, EVP (Employer Value Proposition) tools |
| 4.10 | KPI dashboards | Configurable KPIs: turnover rate, time-to-hire, cost-per-hire, training completion, competency coverage |
| 4.11 | Total rewards and compensation benchmarking `[NEW v4.0]` | Pay bands per role/level, internal pay equity view, and pay-versus-market positioning; this is the foundation the "5 C's" retention research repeatedly flags as the precondition for recognition programs to actually work, comp trust has to exist before recognition moves the needle |
| 4.12 | Recognition and rewards program `[NEW v4.0]` | Peer-to-peer and manager-to-employee recognition, spot bonus workflow tied into payroll (Feature 1.3), recognition feed visible on the relevant dashboards |
| 4.13 | Stay interviews `[NEW v4.0]` | Structured, forward-looking check-ins with current employees (distinct from exit interviews), scheduled on a cadence (e.g. at the 6-month and 18-month marks) rather than only happening reactively when someone is already flight-risk flagged by Feature 3.9 |
| 4.14 | Employee relations and case management `[NEW v4.0]` | Grievance intake, disciplinary action tracking, investigation case files with confidentiality controls, and resolution logging. This closes a functional gap identified against the SHRM HR generalist competency framework: grievance and disciplinary handling is core generalist practice and was previously absent from this PRD entirely |
| 4.15 | Career development and pathing `[NEW v4.0]` | Visual career path per role showing skill and tenure requirements to progress, linked to Feature 2.11 competencies and Feature 2.17 succession readiness, so "how do I grow here" has a system-backed answer instead of a manager conversation with no data behind it |
| 4.16 | AI succession and retention advisor `[NEW v4.0]` | Extends the existing Feature 3.9 attrition risk analyzer with a paired recommendation: for each flagged flight-risk employee, suggest the most relevant retention lever (career path gap, pay-band position, recognition frequency, stay interview overdue) rather than a bare risk score with no next action |
| 4.17 | Offboarding and alumni analytics `[NEW v4.0]` | Boomerang hire rate, successor time-to-productivity, exit interview completion rate, and alumni referral volume, reported alongside the KPI dashboards in Feature 4.10 rather than as a separate disconnected view |

### Phase 5: Autonomous Agents + Mobile + Advanced AI

| # | Feature | Description |
|---|---|---|
| 5.1 | Mobile app (iOS + Android) | Arabic-first native app: leave, payslips, approvals, document upload, attendance, copilot |
| 5.2 | Autonomous HR agents | AI agents that execute multi-step workflows without human intervention (see Section 7) |
| 5.3 | AI Nitaqat advisor | Strategic Saudization planning with cost-optimized hiring recommendations |
| 5.4 | AI recruitment agent | End-to-end: parse JD, source candidates, screen resumes, schedule interviews, draft offers |
| 5.5 | People analytics | Cross-module analytics: recruitment funnel, retention cohorts, compensation benchmarking, diversity metrics |
| 5.6 | ZATCA e-invoicing | Integration with Saudi e-invoicing for contractor payments |
| 5.7 | Multi-company support | Manage multiple CRs (subsidiaries) under one Taāzur account with consolidated reporting |
| 5.8 | Custom workflow builder | No-code workflow designer for approval chains, escalation rules, automated notifications |
| 5.9 | API marketplace | Open API for third-party integrations: accounting (Qoyod, Wafeq), ERP (SAP, Odoo) |


---

## 6. AI-Native Intelligence Layer `[ENHANCED]`

### 6.1 Overview

AI is embedded in every module, not a separate "AI section." The system uses Claude API for language tasks, LangGraph for multi-step agent orchestration, and pgvector for knowledge retrieval.

**AI Provider:** Claude API (Anthropic), Arabic support, tool-use, large context windows.
**Agent Framework:** LangGraph (TypeScript), stateful multi-step workflows with human-in-the-loop checkpoints.
**Data boundary:** No PII in prompts. Aggregated/anonymized data only. Zero-retention API.

### 6.2 AI Across Every Module, with Risk Tiering `[ENHANCED]`

Every AI feature is now classified as **Informational** (a human reads it and decides what to do; a wrong output causes inconvenience, not harm) or **Consequential** (the output can change a payroll figure, a compliance status, or a hiring decision if acted on without review; a wrong output causes real damage). Consequential features must always terminate at a human checkpoint before any downstream system-of-record change. This classification did not exist in v2.0 and is the single most important addition in this revision.

| Module | AI Feature | How it works | Risk Tier |
|---|---|---|---|
| Recruitment | Resume screening + ranking | AI parses CVs, matches against job requirements, scores candidates 1-100 | Informational (score is a recommendation, HR decides) |
| Recruitment | Interview question generation | Role-specific behavioral and technical questions generated from JD | Informational |
| Recruitment | Offer letter drafting | AI drafts bilingual offer with salary, benefits, compliant Qiwa terms | Consequential (must be human-approved before sending, per Section 7 Agent 1) |
| Onboarding | Smart checklist generation | AI creates role + nationality-specific onboarding tasks (Saudi vs expat flows differ) | Informational |
| Onboarding | New hire copilot | Chatbot that answers new employee questions using company policy knowledge base | Informational |
| Payroll | Anomaly detection + narration | Flags unusual patterns and explains them in plain language | Consequential (flag must be resolved by HR before payroll clears, per Section 7 Agent 3) |
| Payroll | Pre-run consistency check | AI validates payroll against Qiwa contracts before processing | Consequential (blocking check, cannot be overridden without audit-logged human action) |
| Compliance | Regulation copilot | RAG-powered Q&A with Saudi Labor Law, GOSI rules, MHRSD circulars | Informational, always shown with article citation and an "AI-generated, verify before acting" label |
| Compliance | Regulatory change alerts | AI monitors for regulation changes and explains impact on the company | Informational |
| Performance | Review draft generation | AI generates performance review drafts from goals, feedback, and achievements | Informational (manager must edit/approve, never auto-submitted) |
| Performance | Skill gap analysis | AI identifies competency gaps and recommends training programs | Informational |
| Analytics | Executive briefings | Monthly natural-language summaries of workforce metrics | Informational |
| Analytics | Cost forecasting | Predict payroll obligations including GOSI escalation and ESB growth | Informational |
| Analytics | Attrition risk scoring | Structural pattern detection for flight risk identification | Informational (never surfaced to the flagged employee, HR-only) |
| Surveys | Sentiment analysis | AI analyzes open-ended survey responses for themes and sentiment | Informational |
| Training | Course recommendations | AI recommends training based on skill gaps and role requirements | Informational |
| Nitaqat | Strategic advisor | Cost-optimized Saudization roadmap with hiring recommendations | Informational |
| Documents | Smart extraction | AI extracts data from uploaded documents (iqama scans, certificates) | Consequential (extracted data feeds the employee record; must be confirmed by HR before saving) |
| Expenses | Receipt parsing | AI reads receipt photos and auto-fills expense claims | Informational (employee reviews before submitting) |
| Recruitment | Referral-to-role matching `[NEW v4.0]` | AI matches submitted employee referrals (Feature 2.16) against currently open positions and surfaces the fit | Informational |
| Retention | Succession and retention advisor `[NEW v4.0]` | Pairs each attrition-risk flag (Feature 3.9) with a specific recommended action (Feature 4.16) | Informational, never auto-executes a pay change or promotion, always a human-reviewed suggestion |
| Retention | Stay interview theme analysis `[NEW v4.0]` | Aggregates stay interview notes (Feature 4.13) across the team to surface recurring themes for the manager | Informational |
| Employee Relations | Case pattern detection `[NEW v4.0]` | Flags if multiple grievance/disciplinary cases (Feature 4.14) cluster under the same manager or team, for HR awareness | Consequential (a false or biased pattern flag could unfairly implicate a manager, so this always requires HR review before any conversation with that manager, and is never shown to anyone outside HR) |

### 6.3 AI Architecture

```
AI Service (NestJS Module)          Agent Engine (LangGraph)         Knowledge Base (pgvector)
- Prompt builder                    - Recruitment agent               - Labor Law
- Context assembler                 - Onboarding agent                 - GOSI
- Response parser                   - Compliance monitor               - Nitaqat
- PII filter                        - Document processor               - MHRSD
                                                                          - Company policies
                                                                          - Training catalog
        |                                    |                                 |
        v                                    v                                 |
        Claude API (Anthropic)
        - Claude Haiku: classification, routing, extraction
        - Claude Sonnet: insights, copilot, review drafts
        - Tool use: structured data queries, calculations

Cache (Redis)                       Data Aggregator
- 24hr insight cache                - Payroll stats
- Embedding cache                   - Headcount
- Rate limiter                      - Trends, Anonymizer
```

### 6.4 AI Cost Controls

| Control | Implementation |
|---|---|
| Caching | 24-hour TTL on insights; invalidate on data change |
| Model routing | Haiku for simple tasks (classification, extraction); Sonnet for complex (insights, copilot) |
| Token budgets | Max 4,000 output tokens per request; 6-month context window |
| Rate limits | 50 AI requests/tenant/day; 20 copilot queries/user/day |
| Batching | Briefings generated once on payroll close, not per dashboard load |
| Tiered pricing | Basic plan: limited AI; Pro plan: full AI suite (see Section 15) |

### 6.5 AI Privacy

| Requirement | Implementation |
|---|---|
| PDPL compliance | Only aggregated/anonymized data in prompts. No names, iqamas, IBANs |
| No training | Anthropic API zero-retention option enabled |
| Audit trail | Every AI query logged: timestamp, user, prompt hash, response summary |
| Human override | Every AI output labeled "AI-generated," dismissible, flaggable, overridable |
| Bias monitoring | Quarterly review of recruitment screening and attrition predictions for demographic bias |
| Explainability | Every insight shows its data sources |

---

## 7. Autonomous HR Workflows

### 7.1 What Are Autonomous Agents?

AI agents that execute multi-step HR workflows end to end, with human approval at critical checkpoints. Built on LangGraph with a state machine per workflow.

### 7.2 Agent Catalog

**Agent 1: Recruitment Agent**
Trigger: HR creates a new position.
AI generates job description, posts to career page, parses and scores incoming applications, checks Nitaqat impact, shortlists candidates. **[HUMAN CHECKPOINT]** HR reviews shortlist. AI schedules interviews, summarizes transcripts. **[HUMAN CHECKPOINT]** HR makes final decision. AI drafts bilingual offer letter. **[HUMAN CHECKPOINT]** HR approves offer. AI sends offer, tracks acceptance, triggers onboarding agent.

**Agent 2: Onboarding Agent**
Trigger: Candidate accepts offer.
AI determines onboarding template by nationality and role, creates personalized checklist, assigns tasks, sends welcome email, monitors completion, activates copilot on Day 1, triggers probation review reminders at Day 30/90/180. **[HUMAN CHECKPOINT]** Manager completes probation review.

**Agent 3: Payroll Pre-Check Agent**
Trigger: 3 days before scheduled payroll run date.
AI validates every active employee against Qiwa contract and GOSI rate, flags expired documents, checks pending leave affecting pay, generates pre-run report. **[HUMAN CHECKPOINT]** HR resolves flagged issues before AI clears payroll for processing.

**Agent 4: Document Renewal Agent**
Trigger: Daily scan at 08:00 AST.
AI checks all iqamas, work permits, passports, exit re-entry visas. 90 days before expiry: reminder to HR + employee. 60 days: escalate to HR manager. 30 days: alert Super Admin, block affected employee in next payroll. AI pre-fills renewal application data. **[HUMAN CHECKPOINT]** HR submits renewal through Muqeem.

**Agent 5: Compliance Monitor Agent**
Trigger: Continuous background monitoring.
Monitors Nitaqat ratio, GOSI rate changes, Qiwa/payroll consistency, scans for regulatory updates, generates weekly compliance health score. **[HUMAN CHECKPOINT]** HR reviews flagged compliance risks.

**Agent 6: Training Assignment Agent**
Trigger: Skill gap detected OR new hire onboarding.
AI compares competencies vs role requirements, recommends courses. **[HUMAN CHECKPOINT]** Manager approves training plan. AI enrolls employee, tracks completion, alerts on expiring mandatory certifications.

### 7.3 Agent Safety Guardrails `[ENHANCED with cost and recovery targets]`

| Guardrail | Implementation |
|---|---|
| Human-in-the-loop | Every agent has clearly defined checkpoints where a human must approve before proceeding |
| Rollback | All agent actions are reversible; audit log tracks every step |
| Scope limits | Agents cannot modify payroll amounts, delete records, or submit to government systems without human approval |
| Failure handling | If an agent encounters an error, it pauses, notifies the assigned HR user, and waits for resolution |
| Failure recovery time (new) | An HR user must be notified of a paused agent within 5 minutes of failure, via the existing notifications engine (Feature 1.14) |
| Cost ceiling per agent run (new) | No single agent workflow run may exceed 50 AI requests against the Section 6.4 rate limit; if it does, the agent pauses and flags for review rather than silently continuing |
| Rate limiting | Max 100 agent actions per tenant per hour |
| Transparency | Every agent action is logged with reasoning; users can view the full decision chain |

---

## 8. Compliance Plan `[ENHANCED]`

### 8.1 Compliance Matrix

| System | What must match | Validation rule |
|---|---|---|
| Qiwa -> Payroll | Contract salary = payroll basic + housing + allowances | Block wage file if mismatch |
| Payroll -> Mudad | Payroll net = wage file amount per employee | Auto-generated from same run |
| Payroll -> GOSI | Contribution base = basic + housing (capped 45K) | Dual-rate by registration date |
| Employee -> Muqeem | Iqama/passport data current | Expiry alerts; block payroll if expired |
| Recruitment -> Nitaqat | New hire doesn't break band | AI pre-checks before offer |

### 8.2 GOSI Dual-Rate Logic

```
if employee.nationality != 'Saudi':
    employer_rate = 2%   # occupational hazards only
    employee_rate = 0%
elif employee.gosi_registration_date < '2024-07-01':
    employer_rate = 12%  # old system, fixed
    employee_rate = 9.5%
else:
    # New system, escalates 0.5% each July
    years_since = floor((current_date - '2024-07-01') / 365)
    employer_rate = 12% + (years_since * 0.25%)
    employee_rate = 9.75% + (years_since * 0.25%)

contribution_base = min(basic + housing, 45000)
```

### 8.3 ESB Calculation

```
if tenure <= 5 years:
    esb = (basic_salary / 2) * tenure_years
else:
    esb = (basic_salary / 2 * 5) + (basic_salary * (tenure_years - 5))

# Resignation adjustment:
# < 2 years -> no ESB
# 2-5 years -> 1/3 of ESB
# 5-10 years -> 2/3 of ESB
# 10+ years -> full ESB
```

### 8.4 Regulatory Monitoring

- Assign one team member to track Saudi Gazette, MHRSD, and GOSI circulars monthly.
- All rates and rules as database-driven config, not hard-coded.
- AI compliance monitor agent scans for regulatory changes continuously.

### 8.5 Third-Party API Failure Playbook `[NEW]`

Qiwa, Mudad, GOSI, and Muqeem are government systems outside Taāzur's control. This subsection did not exist in v2.0 and closes the largest operational gap identified in the July 2026 gap analysis.

| Scenario | System behavior |
|---|---|
| Qiwa API unreachable during contract creation | Queue the request, retry with exponential backoff up to 6 hours, notify HR of delay, allow manual contract entry with a flag for later sync |
| Mudad API unreachable at wage file submission time | Fall back to manual wage file download (already supported per Feature 1.5), notify HR with clear instructions, log the fallback event for audit |
| GOSI reporting window (15-day) at risk due to API outage | Escalate to Super Admin immediately, not just HR, since this carries a compliance deadline risk |
| Muqeem unreachable during iqama renewal | Pre-filled data (Agent 4) is retained and re-attempted on next scheduled sync; HR is notified renewal must be completed manually if the outage exceeds 24 hours |
| Any government API changes its response format without notice | Integration tests against a contract-tested mock catch this in CI before it reaches production; on production detection, the integration is automatically disabled with a clear error rather than silently corrupting data |

**WHEN** any government API integration fails 3 consecutive retry attempts, **THE SYSTEM SHALL** notify the assigned HR user and Super Admin, and switch the affected workflow to its documented manual fallback. Verified by: chaos test simulating API failure for each of the four integrations.


---

## 9. Application Security Plan `[ENHANCED]`

### 9.1 Threat Model Summary `[NEW]`

Primary threats for a multi-tenant Saudi payroll SaaS, in priority order: (1) cross-tenant data leakage, (2) credential compromise leading to payroll fraud, (3) prompt injection against the AI copilot causing incorrect compliance guidance, (4) PII exposure of iqama/IBAN data, (5) government-API-adjacent supply chain risk. Every control below maps to one of these five.

### 9.2 Controls with OWASP ASVS Verification Level `[ENHANCED]`

| Layer | Measure | OWASP ASVS Level | Addresses Threat |
|---|---|---|---|
| Authentication | Email + password (bcrypt); MFA via TOTP; SSO via SAML/OIDC for enterprise | L2 | Credential compromise |
| Authorization | RBAC with per-endpoint permission guards; tenant schema isolation | L2, moving to L3 for payroll-write endpoints | Cross-tenant leakage, payroll fraud |
| API Security | Rate limiting (100 req/min/user); input validation (class-validator); CORS whitelist | L1 | General hardening |
| Sessions | JWT access tokens (15 min); refresh tokens (7 days, httpOnly, secure, sameSite) | L2 | Credential compromise |
| Injection | Prisma parameterized queries; CSP headers; XSS sanitization | L1 | General hardening |
| File Uploads | Type whitelist (PDF, JPG, PNG, DOCX); 10 MB limit; ClamAV scan before S3 | L1 | PII exposure via malicious upload |
| Audit Trail | Immutable append-only log: user, timestamp, IP, action, old/new values | L2 | Payroll fraud detection |
| AI Security | PII filter on all AI prompts; prompt injection detection; output validation | L2, custom control not in standard ASVS categories | Prompt injection |
| Pentesting | Annual third-party pentest; OWASP ZAP in CI | L2 baseline | All |
| Dependencies | npm audit in CI; Dependabot; no wildcard versions | L1 | Supply chain |

**Target: ASVS Level 2 for the full application, Level 3 specifically for payroll-write and government-API-write endpoints**, given the financial and regulatory consequence of a breach in those paths.

### 9.3 Security Testing Cadence `[NEW]`

| Activity | Frequency |
|---|---|
| Automated OWASP ZAP scan | Every CI run against staging |
| Dependency vulnerability scan | Daily, via Dependabot |
| Third-party penetration test | Annual, plus before any major release touching auth or payroll |
| Internal security review gate | Before every production deploy touching Section 9.2 L2/L3 controls |

---

## 10. Data Security Plan `[ENHANCED]`

### 10.1 Core Controls

| Concern | Approach |
|---|---|
| Data Residency | AWS me-south-1 (Bahrain). No replication outside GCC |
| Encryption at Rest | AES-256 via KMS; S3 SSE; RDS encryption |
| Encryption in Transit | TLS 1.3; HSTS; certificate pinning on mobile |
| Backup | Daily RDS snapshots; 30-day retention; cross-AZ; monthly restore test |
| PII | Field-level encryption for iqama, IBAN, salary data |
| Access Control | Least privilege; IAM roles; VPC private subnets for DB |
| PDPL | Consent on onboarding; processing register; 72-hour breach notification |
| Tenant Isolation | Schema-per-tenant; connection-level context; no cross-tenant queries |
| AI Privacy | Aggregated/anonymized data only; zero-retention API; prompt audit log |
| Logging | CloudWatch + application audit; 1-year retention |

### 10.2 Data Retention and Right-to-Erasure `[NEW]`

| Data type | Retention period | Deletion trigger |
|---|---|---|
| Active employee records | Duration of employment + 5 years (Saudi labor record-keeping norm) | Automatic archive at year 5 post-termination, full deletion requires explicit company request |
| Payroll and wage file records | 10 years (audit and GOSI dispute window) | Not deletable on request; regulatory retention overrides erasure requests for this category |
| AI copilot query logs | 1 year | Automatic purge |
| Candidate data (non-hired) | 1 year from application date, per standard recruitment data practice | Automatic purge unless candidate re-applies |
| Document scans (iqama, passport) | Duration of employment + 5 years | Same as employee records |

### 10.3 Data Subject Access Request (DSAR) Workflow `[NEW]`

**WHEN** an employee or former employee submits a data access or deletion request through the self-service portal or via HR, **THE SYSTEM SHALL** log the request with a 30-day response deadline (matching PDPL norms), route it to the Super Admin for review, and provide an exportable record of all held personal data on approval. Verified by: DSAR workflow integration test, including the payroll-record exception case in 10.2.

Requests that fall into a regulatory-retention category (payroll, wage files) are fulfilled as an export for review but not deleted; the system must clearly explain this distinction to the requester rather than silently ignoring the deletion portion of the request.

### 10.4 Breach Response Runbook `[NEW]`

| Step | Action | Owner | Timeline |
|---|---|---|---|
| 1 | Detect and confirm breach scope | Engineering on-call | Immediate |
| 2 | Contain (revoke credentials, isolate affected tenant schema) | Engineering on-call | Within 1 hour of confirmation |
| 3 | Assess PII exposure | Super Admin + Engineering | Within 4 hours |
| 4 | Notify PDPL authority | Super Admin | Within 72 hours of confirmed breach (PDPL requirement) |
| 5 | Notify affected tenants | Super Admin | Within 72 hours, alongside regulatory notification |
| 6 | Post-incident review, log in wiki | Engineering | Within 7 days |

### 10.5 Disaster Recovery: RTO/RPO `[NEW]`

| Target | Value | Basis |
|---|---|---|
| Recovery Point Objective (RPO) | 24 hours | Matches existing daily RDS snapshot cadence in Section 10.1; no new infrastructure spend required to meet this |
| Recovery Time Objective (RTO) | 4 hours | Restore from snapshot to a new RDS instance in me-south-1, validated by the existing monthly restore test |

**WHEN** a full database restore is required, **THE SYSTEM SHALL** be back online within 4 hours using the most recent snapshot (maximum 24 hours of data loss). Verified by: the existing monthly restore test in Section 10.1, with time-to-restore logged and reviewed if it exceeds 4 hours.

---

## 11. Accessibility Requirements (WCAG 2.1 AA) `[NEW]`

This section did not exist in v2.0 despite Section 3 and Section 12 both claiming mobile-responsive, all-portal support. WCAG 2.1 AA is the baseline for any product claiming broad usability, and several target markets treat this as a legal requirement for B2B software procurement.

### 11.1 Core Requirements

| Requirement | Standard | Applies to |
|---|---|---|
| Color contrast, text against background | Minimum 4.5:1 for normal text, 3:1 for large text | All portals, both Arabic and English |
| Keyboard navigation | Every interactive element reachable and operable via keyboard alone | All portals, especially the AI Copilot chat interface and multi-step wizards (Feature 1.12) |
| Screen reader support | Semantic HTML, ARIA labels on custom Shadcn/ui components, alt text on all icons and status indicators (green/yellow/red per Section 12 design principles) | All portals |
| Focus indicators | Visible focus state on every interactive element | All portals |
| Form error identification | Errors described in text, not color alone (relevant since Section 12 uses green/yellow/red status coding) | All forms, especially payroll pre-check and onboarding checklists |
| RTL accessibility | Screen reader and keyboard navigation must work correctly in RTL mode, not just LTR with a mirrored layout | Arabic interface specifically |
| Touch target size (mobile) | Minimum 44x44px | Phase 5 mobile app, and mobile browser usage of all portals before then |

### 11.2 Implementation Note

Shadcn/ui components are built on Radix UI primitives, which have strong accessibility defaults out of the box (keyboard navigation, ARIA attributes, focus management). This significantly lowers implementation cost versus building from scratch; the primary engineering work is verifying custom components (the AI Copilot chat interface, the Nitaqat simulator, the org chart visualization) meet the same bar, since those are the components least likely to inherit Radix defaults.

### 11.3 Verification

**WHEN** a new UI component is merged, **THE SYSTEM SHALL** pass an automated axe-core accessibility scan in CI with zero critical or serious violations. Verified by: CI pipeline gate, with manual screen reader spot-checks on the five highest-traffic screens (login, HR Manager dashboard, payroll run, leave request, AI Copilot) before each phase go-live.


---

## 12. UI/UX Plan, All Portals

### 12.1 Design Principles

1. Arabic-first RTL, layout designed right-to-left; English is the mirror.
2. Role-adaptive, same app, different experience per role.
3. One action per screen, minimize cognitive load for SME HR teams.
4. Status colors, Green (OK), Yellow (warning), Red (blocked/overdue). Per Section 11.1, status must never be conveyed by color alone; pair with text or icon.
5. AI inline, insights appear contextually within workflows, not in a separate section.
6. Mobile-responsive, all portals work on mobile browsers; native app in Phase 5.

### 12.2 Super Admin Dashboard

```
Taāzur [AR|EN]  Alerts(5)  [Admin]

Sidebar: Dashboard, Org Chart, Employees, HR Ops, Recruitment, Payroll,
Compliance, AI Insights, Reports, Settings, Billing, Audit Log

COMPANY OVERVIEW
[Total Emp: 47, Saudi: 12, Expat: 35] [Monthly Payroll: SAR 423K] [Nitaqat Band: GREEN 25.5%]

AI Executive Brief:
"June payroll SAR 423,500 (+3.2%). GOSI up SAR 1,200 from rate change.
ESB liability at SAR 380K, budget SAR 42K/month provision.
Attrition risk: 4 employees at 2-year ESB threshold in Ops dept."
[Full briefing ->]

Compliance Score: 94/100 (Qiwa sync OK, GOSI current OK, Iqamas: 2 expiring)
Pending: Approvals 3, Leaves 2, Expenses 1, Offers 1
```

### 12.3 HR Manager Dashboard

```
Taāzur [AR|EN]  Alerts(8)  [HR Mgr]

Sidebar: Dashboard, Employees, Recruitment, Onboarding, Offboarding, Payroll,
Leave, Attendance, Performance, Training, Skills, Travel, Surveys, Documents,
Compliance, AI Copilot, Reports, Settings

TODAY'S PRIORITIES (AI-generated)
1. Payroll due in 3 days, pre-check has 2 issues to resolve
2. 3 candidates shortlisted for Sr. Accountant, review needed
3. Ahmed's iqama expires in 28 days
4. Probation review due for Sara (day 85 of 180)

[Open Positions: 3] [Pending Leave: 4] [Expiring Docs (30 day): 5]

Recruitment Pipeline: Sr. Accountant 12 applied/3 short, Driver 8 applied/1 short,
Sales Exec 25 applied/5 short

Ask AI Copilot: [Ask anything about HR policy... ->]
```

### 12.4 Department Manager Dashboard

```
Taāzur [AR|EN]  Alerts(3)  [Manager]

Sidebar: My Team, Approvals, Leave, Performance, Goals, Training, Expenses,
AI Copilot, Reports

MY TEAM, Engineering (8 members)
Present today: 6, On leave: 1 (Fatima, annual), Remote: 1 (Omar)

Pending Approvals:
- Leave: Ali requests 5 days annual (Aug 10-14) [Approve][Reject]
- Expense: Khalid, SAR 1,200 business trip [Approve][Reject]
- Training: Sara requests Python course [Approve][Reject]

Team AI Insights:
"Your team's overtime increased 20% this quarter. 2 team members haven't
used annual leave in 6 months, consider encouraging time off."

Upcoming Reviews: Omar Q2 review due Jul 15, Sara probation review day 85
[AI Draft Available]
```

### 12.5 HR Specialist Dashboard

```
Taāzur [AR|EN]  Tasks(6)  [Specialist]

Sidebar: My Tasks, Payroll, Recruitment, Documents, Onboarding, AI Copilot

MY ASSIGNED TASKS
TODAY: Process June payroll (due Jul 25, pre-check complete, 2 flags),
Upload 3 new hire documents, Schedule interviews for Sr. Accountant candidates
THIS WEEK: Renew iqama for Ahmed (exp 30 days), Complete onboarding checklist
for Youssef (day 3 of 14), Distribute engagement survey

Quick Actions: [+Add Employee] [Run Payroll] [Post Position] [Upload Document]
Ask AI Copilot: [Ask about labor law, policy... ->]
```

### 12.6 Employee Self-Service Portal

```
Taāzur [AR|EN]  [Ahmed Al-Rashidi]

Sidebar: Home, My Profile, Payslips, Leave, Attendance, Documents, Training,
Expenses, Goals, Ask AI

Welcome, Ahmed
[Leave Balance: 12 days] [Next Payslip: Jul 25] [My Documents: All OK]

Quick Actions: [Request Leave] [View Payslip] [Submit Expense] [Update Profile]

My Recent Payslip, June 2026:
Basic SAR 8,000, Housing SAR 2,000, Transport SAR 500, GOSI -SAR 950, Net SAR 9,550
[Download PDF] [View All]

Ask AI: "How many sick leave days do I have?" [Type your question... ->]

My Documents: Iqama exp 22 Dec 2026, Passport exp 03 May 2029,
Contract active since 15 Mar 2022
```

### 12.7 Candidate Portal (External)

```
[Company Name] Careers, Powered by Taāzur [AR|EN]

Open Positions:
- Senior Accountant, Finance Dept, Riyadh, Full-time, SAR 8,000-12,000, Posted 5 days ago [Apply ->]
- Warehouse Supervisor, Operations, Jeddah, Full-time, SAR 5,000-7,000, Posted 12 days ago [Apply ->]
- Sales Executive, Commercial, Riyadh, Full-time, SAR 6,000-9,000, Posted 2 days ago [Apply ->]

After applying, Application Tracker:
Applied -> Screening -> Interview -> Offer
[Done] [Current] [ ] [ ]
"Your application is being reviewed by our hiring team. You'll hear back within 5 business days."
```

### 12.8 AI Copilot Screen (HR Manager, Manager, Specialist, Employee)

```
Taāzur AI Copilot [AR|EN]

HR: "Can we extend Ahmed's probation?"

AI: "Yes. Under Article 53 of the Saudi Labor Law, probation can be extended
once for up to 180 days total, provided the extension is documented in
writing and registered in Qiwa. Ahmed has used 120 days; you can extend by
up to 60 more days. Note: the extension must be agreed in writing before the
current probation expires. Ref: Saudi Labor Law, Article 53"
[Copy] [Create Task] [Share with team]

HR: "What about for employees whose contract doesn't mention probation?"

AI: "If probation is not explicitly stated in the Qiwa-registered contract,
the employee is legally considered to have no probation period. You cannot
retroactively add a probation clause. This is a common issue, always ensure
probation is included in the initial Qiwa contract.
Ref: Saudi Labor Law, Article 53, Paragraph 1"

[Ask a question about HR policy or labor law...] [Send ->]
Suggested: "Overtime rules" "Maternity leave" "Resignation process" "End of service calculation"
```

### 12.9 Recruitment Pipeline Screen (HR Manager / Specialist)

```
Recruitment, Senior Accountant

Position: Senior Accountant, Finance, Riyadh
Salary: SAR 8,000-12,000, Nitaqat impact: No change
Posted Jul 6, Applications 12, AI Shortlisted 3

Pipeline: Applied(12) Screened(5) Interview(3) Offer(0)

AI Top Candidates:
1. Nora Al-Salem, Score 92/100, 5yr exp, CPA, Saudi national
   AI: "Strong match on all 4 competencies. Saudi hire improves Nitaqat by 0.8%."
   [Schedule Interview] [View CV] [Reject]
2. Mohammed Ibrahim, Score 87/100, 7yr exp, ACCA, Egyptian
   AI: "Exceeds experience requirement. Expat, no Nitaqat benefit."
   [Schedule Interview] [View CV] [Reject]
3. Lina Bakr, Score 84/100, 4yr exp, CMA, Saudi national
   AI: "Meets requirements. Saudi hire improves Nitaqat by 0.8%."
   [Schedule Interview] [View CV] [Reject]

[AI: Generate Interview Questions] [AI: Draft Offer Letter for Selected Candidate]
```

### 12.10 Onboarding Workflow Screen

```
Onboarding, Youssef Al-Harbi (Day 3 of 14)

Role: Sales Executive, Start: Jul 9, Saudi National
AI-generated checklist (Saudi national template)
Progress: 5 of 12 tasks complete

HR Tasks: [x] Create Qiwa contract, [x] Register in GOSI, [x] Collect bank IBAN,
[ ] Issue company ID badge (due Jul 11), [ ] Enroll in medical insurance (due Jul 14)

IT Tasks: [x] Create email account, [x] Setup laptop,
[ ] Grant system access (due Jul 11)

Manager Tasks: [ ] Assign buddy/mentor (due Jul 11), [ ] Schedule intro meetings
(due Jul 14), [ ] Set probation goals (due Jul 23)

Training: [ ] Company orientation video (due Jul 11), [ ] Sales process training (due Jul 18)

AI Copilot is active for Youssef (answering his questions)
```

### 12.11 Performance Review Screen (Manager)

```
Performance Review, Omar Hussain, Q2 2026

AI-Generated Draft Review:
"Omar met 3 of 4 Q2 goals. Completed the API integration project ahead of
schedule. Code quality metrics improved 15%. The Q2 training on cloud
architecture was completed with a certification. Missed the documentation
goal, 60% complete vs 100% target. Recommend: extend documentation deadline
to Q3."
Overall rating: [Meets Expectations v]
[Edit Draft] [Accept as-is] [Regenerate]

Goals: API integration 100% on time, Code quality +15% exceeded,
Cloud architecture cert 100% complete, API documentation 60% behind

Competencies: Technical skills 4/5 (up from 3.5), Communication 3.5/5,
Problem solving 4.5/5
AI Recommendation: "Consider advanced leadership training to prepare for team lead track."

[Save Draft] [Submit Review] [Schedule Meeting]
```


---

## 13. Backend Architecture

### 13.1 Module Structure

```
src/
├── modules/
│   ├── auth/                # Login, MFA, JWT, RBAC guards, SSO
│   ├── tenant/               # Company onboarding, schema management
│   ├── org-structure/        # Departments, teams, reporting lines, org chart
│   ├── employee/             # Employee CRUD, employment history
│   ├── recruitment/          # Positions, candidates, candidatures, pipeline
│   ├── workforce-planning/   # Headcount forecasting, req justification (new v4.0)
│   ├── referrals/            # Employee referral submissions, bonus tracking (new v4.0)
│   ├── onboarding/           # Onboarding templates, checklists, task tracking, 30/60/90 plans
│   ├── offboarding/          # Offboarding workflows, exit process, knowledge transfer, rehire flag
│   ├── alumni/               # Alumni pool, boomerang tracking (new v4.0)
│   ├── succession/           # Critical role pipeline, readiness tracking (new v4.0)
│   ├── internal-mobility/    # Internal job postings, career pathing (new v4.0)
│   ├── total-rewards/        # Pay bands, comp benchmarking, pay equity (new v4.0)
│   ├── recognition/          # Peer/manager recognition, spot bonuses (new v4.0)
│   ├── employee-relations/   # Grievance intake, disciplinary case files, investigations (new v4.0)
│   ├── stay-interviews/      # Structured retention check-ins (new v4.0)
│   ├── payroll/              # Calculation engine, payslip generation
│   ├── leave/                # Leave types, requests, approvals, calendar
│   ├── attendance/           # Time tracking, shifts, Ramadan logic
│   ├── performance/          # Reviews, appraisals, probation tracking
│   ├── goals/                # OKRs, individual/team goals, progress tracking
│   ├── competencies/         # Skills, ratings, gap analysis, certificates
│   ├── training/             # Training catalog, sessions, completion tracking
│   ├── benefits/              # Benefits packages, assignment, tracking
│   ├── travel-expenses/       # Delegations, expenses, reimbursement, approvals
│   ├── compliance/            # Qiwa sync, GOSI calc, consistency checks
│   ├── wage-file/             # Mudad file generation + API submission
│   ├── documents/             # File management, versioning, expiry alerts
│   ├── nitaqat/                # Ratio calculation, band simulation
│   ├── surveys/                 # Survey creation, distribution, response tracking
│   ├── employer-branding/       # Campaigns, employee journey, career page
│   ├── ai/                      # AI service layer
│   │   ├── insights/            # Executive briefings, cost forecasts
│   │   ├── copilot/             # RAG-powered compliance Q&A
│   │   ├── recruitment/         # Resume screening, interview Qs, offer drafts
│   │   ├── performance/         # Review draft generation
│   │   ├── anomaly/             # Payroll anomaly detection + narration
│   │   ├── agents/              # LangGraph autonomous workflow agents
│   │   └── embeddings/          # Regulation + policy embedding management
│   ├── notifications/           # Email (SES), SMS (Twilio), in-app, push
│   ├── reports/                 # Payroll, compliance, HR analytics, KPIs
│   └── career-page/             # Public career site, application forms
├── common/
│   ├── guards/                  # Auth + tenant + role guards
│   ├── interceptors/            # Audit logging, response transform
│   ├── pipes/                   # Validation pipes
│   └── utils/                   # Hijri conversion, PII filter, Saudi rounding
├── config/                      # Env, DB, Redis, S3, AI, SMS, Email config
└── prisma/
    ├── schema.prisma
    └── migrations/
```

### 13.2 Multi-Tenancy Model

```
PostgreSQL
├── public schema      # Tenant registry, plans, system config, regulation embeddings
├── tenant_001 schema  # Company A, all modules, fully isolated
├── tenant_002 schema  # Company B, fully isolated
└── tenant_NNN schema  # Each company gets its own schema
```

### 13.3 Key API Endpoints

```
# Auth
POST /auth/login
POST /auth/mfa/verify
POST /auth/refresh
POST /auth/sso/saml

# Org Structure
GET /org/departments
POST /org/departments
GET /org/chart

# Employees
GET /employees
POST /employees
GET /employees/:id
PATCH /employees/:id
GET /employees/:id/documents
GET /employees/:id/employment-history
GET /employees/:id/competencies
GET /employees/:id/training

# Workforce Planning (new v4.0)
POST /workforce-planning/requisition-request
GET /workforce-planning/requisition-request/:id
PATCH /workforce-planning/requisition-request/:id/approve

# Recruitment
GET /recruitment/positions
POST /recruitment/positions
GET /recruitment/positions/:id/candidates
POST /recruitment/positions/:id/candidates
PATCH /recruitment/candidates/:id/stage
POST /recruitment/candidates/:id/schedule-interview
PATCH /recruitment/candidates/:id/background-check-status
PATCH /recruitment/candidates/:id/reference-check-status

# Referrals (new v4.0)
POST /referrals/submit
GET /referrals/mine
GET /referrals/:id/status

# Onboarding / Offboarding
POST /onboarding/start/:employeeId
GET /onboarding/:id/checklist
PATCH /onboarding/:id/tasks/:taskId
GET /onboarding/:id/30-60-90-plan
POST /offboarding/start/:employeeId
GET /offboarding/:id/checklist
POST /offboarding/:id/knowledge-transfer
PATCH /offboarding/:id/rehire-eligibility

# Alumni (new v4.0)
GET /alumni
POST /alumni/:employeeId/enroll
GET /alumni/boomerang-rate

# Succession & Internal Mobility (new v4.0)
GET /succession/critical-roles
POST /succession/critical-roles/:id/candidate
GET /internal-mobility/postings
POST /internal-mobility/postings/:id/apply

# Total Rewards, Recognition, Stay Interviews (new v4.0)
GET /total-rewards/pay-bands
GET /total-rewards/pay-equity-report
POST /recognition/give
GET /recognition/feed
POST /stay-interviews/schedule
GET /stay-interviews/:employeeId/history

# Employee Relations (new v4.0)
POST /employee-relations/case
GET /employee-relations/case/:id
PATCH /employee-relations/case/:id/resolve

# Payroll
POST /payroll/run
GET /payroll/run/:id/review
POST /payroll/run/:id/finalize
GET /payroll/run/:id/payslips
POST /payroll/run/:id/wage-file

# Leave
GET /leave/balance/:employeeId
POST /leave/request
PATCH /leave/request/:id/approve
GET /leave/calendar

# Attendance
POST /attendance/clock-in
POST /attendance/clock-out
GET /attendance/report/:month

# Performance
POST /performance/reviews
GET /performance/reviews/:id
POST /performance/reviews/:id/ai-draft
PATCH /performance/reviews/:id/submit

# Goals
GET /goals/employee/:id
POST /goals
PATCH /goals/:id/progress

# Training
GET /training/catalog
POST /training/sessions
POST /training/enroll/:employeeId/:sessionId
GET /training/completions/:employeeId

# Competencies
GET /competencies/employee/:id
POST /competencies/employee/:id/rate
GET /competencies/gap-analysis/:employeeId

# Travel & Expenses
POST /expenses/submit
GET /expenses/pending
PATCH /expenses/:id/approve
POST /travel/delegation

# Surveys
POST /surveys
POST /surveys/:id/distribute
GET /surveys/:id/responses

# Compliance
GET /compliance/consistency-check/:payrollRunId
GET /compliance/gosi-summary/:month
GET /compliance/health-score

# Nitaqat
GET /nitaqat/current
POST /nitaqat/simulate

# AI
GET /ai/briefing/:month
GET /ai/forecast/cost
GET /ai/risks/attrition
GET /ai/anomalies/:payrollRunId
POST /ai/copilot/ask
POST /ai/recruitment/screen/:positionId
POST /ai/recruitment/interview-questions/:positionId
POST /ai/recruitment/draft-offer/:candidateId
POST /ai/performance/draft-review/:reviewId
GET /ai/copilot/history

# Career Page (public)
GET /careers/:tenantSlug/positions
POST /careers/:tenantSlug/apply/:positionId

# Documents & Reports
GET /documents/expiring
GET /reports/payroll-summary
GET /reports/headcount
GET /reports/recruitment-funnel
GET /reports/training-completion
GET /reports/kpi-dashboard

# Data Subject Access (new in v3.0, supports Section 10.3)
POST /privacy/dsar-request
GET /privacy/dsar-request/:id
GET /privacy/export/:employeeId
```

### 13.4 Background Jobs (BullMQ)

| Queue | Job | Schedule |
|---|---|---|
| payroll | Monthly payroll calculation | On-demand |
| wage-file | Mudad file generation | After payroll finalization |
| payslips | PDF payslip generation | After payroll finalization |
| alerts | Document expiry checks | Daily 08:00 AST |
| gosi-rates | Rate update check | July 1 annually |
| ai-briefing | Executive briefing generation | After payroll finalization |
| ai-embeddings | Knowledge base update | On regulatory config change |
| ai-screening | Candidate resume screening | On new application |
| onboarding | Onboarding task monitoring | Daily 09:00 AST |
| surveys | Survey distribution + reminders | On schedule |
| compliance | Compliance health score | Weekly Sunday 08:00 AST |
| training | Certification expiry checks | Weekly Monday 08:00 AST |
| privacy-dsar | DSAR response deadline tracking (new) | Daily, flags requests approaching the 30-day deadline |

### 13.5 Data Structure & Entity Model `[NEW v5.0]`

This section did not exist before v5.0. No prior version of this PRD defined the actual data entities behind its 60+ features, which meant Claude Code (or any engineer) would have had to invent the schema from the API endpoint names alone. The brainstorm below walked every feature in Sections 5 through 20 and asked "what table or tables does this actually need," grouped by the same module domains used in Section 13.1. 45 entities came out of that pass. None are speculative additions beyond what a feature already in this document requires.

#### 13.5.1 Core Backbone (ERD)

Every entity below hangs off `Tenant` and, in almost every case, off `Employee`. This is the shape that matters most to get right first, since it determines the tenant-isolation and cascade-delete behavior for everything else.

```
Tenant (1) ----< (many) User
Tenant (1) ----< (many) Department ----< (many) Department  [self-referencing: parent_department_id]
Tenant (1) ----< (many) Employee
Department (1) ----< (many) Employee
Employee (1) ----< (many) Employee  [self-referencing: manager_employee_id]
Employee (1) ---- (0..1) User        [an Employee has at most one login User record]
Employee (1) ----< (many) Document, EmploymentHistory, LeaveRequest, AttendanceRecord,
                            Payslip, PerformanceReview, TrainingEnrollment, CompetencyRating,
                            ExpenseClaim, EmployeeRelationsCase, StayInterview
Tenant (1) ----< (many) Position ----< (many) Candidate ----< (many) Interview, BackgroundCheck, Offer
Candidate (0..1) ---- (1) Employee   [set only once a candidate is hired]
```

Everything in the platform ultimately answers to `tenant_id`. Per Section 13.2, this is enforced at the schema level (schema-per-tenant), not just a WHERE clause, so a bug in application code cannot leak data across tenants the way a shared-schema-plus-tenant-column design could.

#### 13.5.2 Entity Reference by Domain

**Identity & Tenancy**

| Entity | Key fields | Relationships | Notes |
|---|---|---|---|
| Tenant | id, company_name, cr_number, nitaqat_activity, plan_tier, schema_name, created_at | Root of everything | One row per row in `public.tenant_registry`; `schema_name` points at the tenant's isolated schema |
| User | id, tenant_id, employee_id (nullable), email, password_hash, role (enum), mfa_secret, sso_provider | Belongs to Tenant, optionally linked to Employee | `role` is one of the 6 fixed values in Section 3.2, not a flexible permission table. Candidates get a User record with role=candidate and no employee_id |
| AuditLog | id, tenant_id, user_id, action, entity_type, entity_id, old_value (jsonb), new_value (jsonb), ip, timestamp | References User | Append-only, matches Section 9.2's immutable audit trail requirement |

**Organization & Employee Core**

| Entity | Key fields | Relationships | Notes |
|---|---|---|---|
| Department | id, tenant_id, name, parent_department_id (self-ref), head_employee_id | Belongs to Tenant | Self-referencing for the org chart in Feature 1.2 |
| Employee | id, tenant_id, department_id, national_id/iqama_number (encrypted), passport_number (encrypted), nationality, employment_status, hire_date, termination_date, gosi_registration_date, gosi_system, bank_iban (encrypted), salary_basic, salary_housing, salary_transport, manager_employee_id (self-ref), rehire_eligible (bool), rehire_reason | Central entity, referenced by nearly every other domain | `iqama_number`, `passport_number`, `bank_iban` carry field-level encryption per Section 10.1, this is the single most sensitive row in the schema |
| EmploymentHistory | id, employee_id, event_type (promotion/transfer/salary_change), effective_date, details (jsonb) | Belongs to Employee | Supports Feature 1.1's employment history requirement |
| Document | id, employee_id, type (iqama/passport/certificate/contract), file_url, expiry_date, version | Belongs to Employee | Backs Feature 1.7; `expiry_date` drives Agent 4 (Document Renewal) in Section 7.2 |

**Recruitment (full cycle, per Section 21.1)**

| Entity | Key fields | Relationships | Notes |
|---|---|---|---|
| WorkforceRequisition | id, tenant_id, department_id, justification, budget_line, status, requested_by, approved_by | Belongs to Tenant/Department | Backs Feature 2.15, Stage 0 of the recruitment life cycle, precedes Position |
| Position | id, tenant_id, requisition_id, title, salary_range_min, salary_range_max, competency_requirements (jsonb), nitaqat_impact_preview, status | Belongs to Tenant, optionally to WorkforceRequisition | Backs Feature 2.1 |
| Candidate | id, tenant_id, position_id, name, cv_file_url, ai_score, financial_expectation, source (referral/career_page/agency) | Belongs to Position | Backs Feature 2.3, 2.4 |
| Referral | id, tenant_id, referrer_employee_id, candidate_id, position_id, bonus_status | Links Employee to Candidate | Backs Feature 2.16 |
| Interview | id, candidate_id, scheduled_at, interviewer_employee_ids (array), transcript_url, ai_summary | Belongs to Candidate | Backs Feature 2.5, 2.6 |
| BackgroundCheck | id, candidate_id, check_type (background/reference), status, completed_at | Belongs to Candidate | Backs the enhanced Feature 2.3, closes the gap flagged in Section 21.1 |
| Offer | id, candidate_id, salary, benefits (jsonb), status, sent_at, accepted_at | Belongs to Candidate | Backs Feature 2.7. On `accepted_at`, triggers Employee record creation and Agent 2 (Onboarding) |

**Onboarding, Offboarding & Alumni (per Section 21.3)**

| Entity | Key fields | Relationships | Notes |
|---|---|---|---|
| OnboardingChecklist | id, employee_id, template_type (saudi/expat), progress_pct | Belongs to Employee | Backs Feature 2.8 |
| OnboardingTask | id, checklist_id, assigned_to_user_id, due_date, status, phase (day1_14/day30/day60/day90) | Belongs to OnboardingChecklist | `phase` field is what makes the enhanced 30/60/90 plan queryable rather than just descriptive text |
| OffboardingChecklist | id, employee_id, initiated_at, reason, rehire_eligible (bool), rehire_reason | Belongs to Employee | Backs Feature 2.10 |
| OffboardingTask | id, checklist_id, task_type, owner_user_id, status | Belongs to OffboardingChecklist | Covers asset return, IT deprovisioning, final settlement trigger |
| KnowledgeTransferItem | id, offboarding_checklist_id, task_description, successor_employee_id (nullable), status | Belongs to OffboardingChecklist | This is the structural fix for the "label only, no structure" gap noted in Section 21.3, each item names a specific successor or interim owner |
| AlumniRecord | id, tenant_id, former_employee_id, rehire_eligible, rehire_reason, last_contact_date | References former Employee | Backs Feature 2.19 |

**Payroll & Compliance**

| Entity | Key fields | Relationships | Notes |
|---|---|---|---|
| PayrollRun | id, tenant_id, period_month, status, total_amount | Belongs to Tenant | Backs Feature 1.3 |
| Payslip | id, payroll_run_id, employee_id, basic, housing, transport, gosi_employee, gosi_employer, overtime, net_pay, pdf_url | Belongs to PayrollRun and Employee | Backs Feature 1.6 |
| WageFile | id, payroll_run_id, format, generated_at, submitted_at | Belongs to PayrollRun | Backs Feature 1.5 |
| FinalSettlement | id, employee_id, esb_amount, unpaid_salary, accrued_leave_payout, exit_reason | Belongs to Employee | Backs Feature 1.4, uses the Section 8.3 ESB formula |
| ComplianceCheck | id, payroll_run_id, check_type, status, flagged_issues (jsonb) | Belongs to PayrollRun | Backs Feature 1.8 and Section 8.5's API failure playbook logging |
| NitaqatSnapshot | id, tenant_id, snapshot_date, saudi_count, expat_count, band | Belongs to Tenant | Backs Feature 3.6, one row per calculation, not overwritten, so the "what if" simulator in Feature 3.6 has real history to compare against |

**Leave & Attendance**

| Entity | Key fields | Relationships | Notes |
|---|---|---|---|
| LeaveType | id, tenant_id, name, days_allowed, rules (jsonb) | Belongs to Tenant | Backs Feature 1.9, config-driven per Section 8.4 |
| LeaveRequest | id, employee_id, leave_type_id, start_date, end_date, status, approved_by_user_id | Belongs to Employee | Backs Feature 1.9 |
| LeaveBalance | id, employee_id, leave_type_id, balance, year | Belongs to Employee | Recalculated on approval/accrual |
| AttendanceRecord | id, employee_id, clock_in, clock_out, method (web/mobile/biometric) | Belongs to Employee | Backs Feature 4.8 |
| Shift | id, tenant_id, name, start_time, end_time, ramadan_variant (bool) | Belongs to Tenant | Backs Feature 4.8's Ramadan auto-switch |

**Performance, Learning & Succession (per Section 21.2)**

| Entity | Key fields | Relationships | Notes |
|---|---|---|---|
| PerformanceReview | id, employee_id, cycle, ai_draft (text), final_rating, status | Belongs to Employee | Backs Feature 4.1, 4.3 |
| Goal | id, employee_id, description, progress_pct, target_date | Belongs to Employee | Backs Feature 4.2 |
| ProbationRecord | id, employee_id, start_date, day_count, extended (bool), review_milestones (jsonb) | Belongs to Employee | Backs Feature 4.4 |
| Competency | id, tenant_id, name, category | Belongs to Tenant | Backs Feature 2.11 |
| CompetencyRating | id, employee_id, competency_id, rating, rated_by_user_id, rated_at | Links Employee and Competency | Backs Feature 2.11, feeds Feature 2.17 succession readiness |
| TrainingCourse | id, tenant_id, title, provider | Belongs to Tenant | Backs Feature 2.12 |
| TrainingEnrollment | id, employee_id, course_id, status, completion_date, certificate_url | Links Employee and TrainingCourse | Backs Feature 2.12, 2.13 |
| SuccessionPlan | id, tenant_id, critical_role_department_id, readiness_status | Belongs to Tenant | Backs Feature 2.17 |
| SuccessionCandidate | id, succession_plan_id, employee_id, readiness_level (ready_now/1_2yr/development_needed) | Links SuccessionPlan and Employee | Backs Feature 2.17 |
| InternalJobPosting | id, tenant_id, position_id, visible_internally_from | Links to Position | Backs Feature 2.18 |
| CareerPath | id, tenant_id, from_role, to_role, required_competencies (jsonb), required_tenure_months | Belongs to Tenant | Backs Feature 4.15 |

**Total Rewards, Recognition & Employee Relations (per Section 21.2)**

| Entity | Key fields | Relationships | Notes |
|---|---|---|---|
| PayBand | id, tenant_id, role_level, min_salary, max_salary, market_percentile | Belongs to Tenant | Backs Feature 4.11 |
| BenefitPackage | id, tenant_id, name, components (jsonb) | Belongs to Tenant | Backs Feature 2.14 |
| BenefitAssignment | id, employee_id, benefit_package_id | Links Employee and BenefitPackage | Backs Feature 2.14 |
| RecognitionEvent | id, tenant_id, from_employee_id, to_employee_id, message, type (peer/manager), spot_bonus_amount | Links two Employees | Backs Feature 4.12 |
| StayInterview | id, employee_id, scheduled_date, notes (text), ai_theme_tags (array) | Belongs to Employee | Backs Feature 4.13 |
| EmployeeRelationsCase | id, tenant_id, employee_id, case_type (grievance/disciplinary), filed_by_user_id, confidentiality_level, status, resolution_notes | Belongs to Employee | Backs Feature 4.14. Access-controlled per Section 21.4: query layer must restrict this table to HR Manager and Super Admin roles regardless of the requesting employee's direct manager relationship |

**Travel, Expenses & Surveys**

| Entity | Key fields | Relationships | Notes |
|---|---|---|---|
| ExpenseClaim | id, employee_id, amount, currency, receipt_url, ai_parsed_data (jsonb), status | Belongs to Employee | Backs Feature 4.6 |
| TravelDelegation | id, employee_id, destination, per_diem_amount, cost_center | Belongs to Employee | Backs Feature 4.7 |
| Survey | id, tenant_id, type, questions (jsonb) | Belongs to Tenant | Backs Feature 4.5 |
| SurveyResponse | id, survey_id, employee_id (nullable if anonymous), answers (jsonb), sentiment_score | Belongs to Survey | Backs Feature 4.5 |
| EngagementScore | id, tenant_id, period, enps_score | Belongs to Tenant | Backs the enhanced Feature 4.5, one row per measurement period so the trend is queryable, not just the latest value |

**AI, Agents & System**

| Entity | Key fields | Relationships | Notes |
|---|---|---|---|
| AIQueryLog | id, tenant_id, user_id, prompt_hash, response_summary, risk_tier (informational/consequential), timestamp | References User | Backs Section 6.5's audit trail requirement; `risk_tier` makes Section 6.2's classification queryable, not just documented |
| AgentRun | id, tenant_id, agent_type, status, checkpoint_stage, ai_requests_used | Belongs to Tenant | Backs Section 7's agent catalog; `ai_requests_used` enforces the Section 7.3 cost ceiling per run |
| AgentCheckpoint | id, agent_run_id, checkpoint_name, approved_by_user_id, approved_at | Belongs to AgentRun | Every `[HUMAN CHECKPOINT]` in Section 7.2 is a row here once passed, giving the full decision chain Section 7.3 requires |
| Notification | id, tenant_id, user_id, channel (email/sms/inapp), message, status | References User | Backs Feature 1.14 |
| DSARRequest | id, tenant_id, requester_employee_id, request_type (access/deletion), status, deadline_date | Belongs to Employee | Backs Section 10.3 |

#### 13.5.3 Representative Prisma Schema Pattern

Rather than writing all 45 models out in full Prisma syntax here (which would roughly double this document's length for a mechanical transformation Claude Code can do directly from the tables above), three representative models are given below. They establish the pattern, field naming, and access-control annotation convention to apply consistently across the rest.

```prisma
model Tenant {
  id            String   @id @default(uuid())
  companyName   String
  crNumber      String   @unique
  nitaqatActivity String
  planTier      PlanTier @default(BASIC)
  schemaName    String   @unique
  createdAt     DateTime @default(now())

  employees     Employee[]
  departments   Department[]
  users         User[]
}

model Employee {
  id                String   @id @default(uuid())
  tenantId          String
  departmentId      String?
  managerEmployeeId String?
  // Encrypted fields, see Section 10.1: field-level encryption, not just column-level DB encryption
  iqamaNumberEnc    String?
  passportNumberEnc String?
  bankIbanEnc       String?
  nationality       String
  employmentStatus  EmploymentStatus @default(ACTIVE)
  hireDate          DateTime
  terminationDate   DateTime?
  gosiRegistrationDate DateTime?
  gosiSystem        GosiSystem
  salaryBasic       Decimal
  salaryHousing     Decimal
  salaryTransport   Decimal
  rehireEligible    Boolean?
  rehireReason      String?

  tenant            Tenant   @relation(fields: [tenantId], references: [id])
  department        Department? @relation(fields: [departmentId], references: [id])
  manager           Employee?   @relation("EmployeeManager", fields: [managerEmployeeId], references: [id])
  reports           Employee[]  @relation("EmployeeManager")
  documents         Document[]
  payslips          Payslip[]
  leaveRequests     LeaveRequest[]
}

model EmployeeRelationsCase {
  id                 String   @id @default(uuid())
  tenantId           String
  employeeId         String
  caseType           CaseType // GRIEVANCE | DISCIPLINARY
  filedByUserId      String
  confidentialityLevel ConfidentialityLevel @default(HR_ONLY)
  status             CaseStatus @default(OPEN)
  resolutionNotes    String?

  tenant             Tenant   @relation(fields: [tenantId], references: [id])
  employee           Employee @relation(fields: [employeeId], references: [id])

  // Row-level access enforced in the NestJS guard layer, per Section 21.4:
  // only HR_MANAGER and SUPER_ADMIN roles may read this model, regardless of
  // reporting-line relationship to the employee in question.
}
```

#### 13.5.4 Indexing and Query Pattern Notes

| Concern | Approach |
|---|---|
| Tenant isolation | Enforced by schema-per-tenant (Section 13.2), not by a `tenant_id` filter alone; every query connection is scoped to the tenant's schema at the connection level |
| Employee lookups | Composite index on `(department_id, employment_status)` for the common "active employees in department X" query pattern used across dashboards |
| Payroll batch performance | Index on `(payroll_run_id)` across Payslip; this is the query the Section 2.1 90-second NFR target depends on most directly |
| Document expiry scans | Index on `(expiry_date)` across Document, since Agent 4 (Section 7.2) runs a full scan daily at 08:00 AST |
| Arabic full-text search | Employee, Candidate, and Document names sync to Meilisearch (Section 4) rather than relying on PostgreSQL full-text search, which handles Arabic tokenization poorly by comparison |
| AI embeddings | Regulation and policy text embeddings live in `public` schema (shared across tenants, since Saudi Labor Law doesn't vary by tenant), while company-specific policy embeddings for the onboarding copilot live per-tenant-schema |

---

## 14. Scale-Up Plan

| Stage | Companies | Employees | Infrastructure |
|---|---|---|---|
| Launch | 1-20 | Up to 2,000 | Single ECS, single RDS (db.r6g.large), 1 Redis node |
| Growth | 20-100 | Up to 15,000 | ECS auto-scaling (2-6), RDS read replica, Redis cluster |
| Scale | 100-500 | Up to 75,000 | Multi-AZ ECS, RDS Multi-AZ + replicas, ElastiCache, CDN |
| Enterprise | 500+ | 100,000+ | Tenant sharding, dedicated compute, API gateway |

### Key Decisions

- Schema-per-tenant up to approximately 500 tenants per DB cluster; shard beyond that.
- Payroll is CPU-bound and bursty (25th-28th), scale on BullMQ queue depth.
- AI requests are API-bound, cache aggressively, separate rate limits.
- Recruitment screening is async, separate worker pool.
- PgBouncer for connection pooling after 50 tenants.
- Meilisearch scales independently from PostgreSQL.


---

## 15. Pricing & Packaging `[NEW]`

This section was entirely absent in v2.0 beyond one line referencing "Basic" and "Pro" plans inside the AI cost control table. It is flagged as an "Elephant" risk in the gap analysis: without it, sales conversations and billing integration cannot proceed. The structure below is a starting draft, not a final commercial decision; validate against 3-5 target MSME conversations before locking pricing.

### 15.1 Tier Structure (draft)

| Tier | Target company size | Included | AI access |
|---|---|---|---|
| Basic | 5-30 employees | Phase 1 core HR + payroll, self-service portal, basic reports | Limited: compliance copilot only, capped queries per Section 6.4 |
| Pro | 30-150 employees | Everything in Basic + Phase 2 recruitment/lifecycle + Phase 3 government integrations | Full AI suite: briefings, forecasting, attrition risk, autonomous agents |
| Enterprise | 150-250 employees, or multi-company | Everything in Pro + Phase 4/5 features, multi-company support, dedicated support tier | Full AI suite + custom workflow builder |

### 15.2 Billing Model (draft, needs finance sign-off)

- Per-employee-per-month pricing, with a minimum seat count per tier to keep unit economics sane at the low end.
- Annual billing discount to improve cash flow predictability, standard SaaS practice.
- No AI usage overage charges in Year 1; rate limits (Section 6.4) function as the cost control instead of pass-through billing, to keep the pricing conversation simple during market entry.

### 15.3 Open Question

Exact per-employee rate is not set in this document. This requires a proper willingness-to-pay exercise against target MSMEs before Phase 1 go-live, since Saudi payroll software pricing varies significantly by feature depth and government-integration completeness. Do not quote a rate externally until this is resolved.

---

## 16. SLA & Support Model `[NEW]`

### 16.1 Uptime Commitment by Stage

| Stage (per Section 14) | Uptime commitment | Rationale |
|---|---|---|
| Launch | 99.5% monthly | Matches single-ECS infra; do not promise higher than infra supports |
| Growth | 99.5% monthly | Auto-scaling reduces incident frequency but single-region risk remains |
| Scale/Enterprise | 99.9% monthly | Multi-AZ infra justifies the higher commitment |

### 16.2 Support Response Time by Severity

| Severity | Definition | Response time | Resolution target |
|---|---|---|---|
| S1, Critical | Payroll run blocked, data breach, full outage | 1 hour | 4 hours |
| S2, High | Single module down, government integration failing | 4 hours | 1 business day |
| S3, Medium | Feature bug, non-blocking | 1 business day | 5 business days |
| S4, Low | Cosmetic, question, feature request | 2 business days | Best effort |

### 16.3 Support Channels

- In-app AI Copilot for basic policy/how-to questions (all tiers).
- Email/ticket support (all tiers).
- Phone support (Pro and Enterprise tiers only).
- Dedicated account contact (Enterprise tier only).

### 16.4 Reporting Cadence

Monthly uptime and incident report available to Super Admin via the existing Reports module (Section 13.3, `/reports` endpoints); no new infrastructure required, this is a reporting view on existing CloudWatch/Sentry data.

---

## 17. RACI & Ownership Matrix `[NEW]`

This is the single-page ownership reference flagged as a P0 gap. Fill in actual names before Phase 1 kickoff; roles are placeholders showing the structure.

| Module/Area | Responsible | Accountable | Consulted | Informed |
|---|---|---|---|---|
| Product requirements (this PRD) | Product lead | Founder/CEO | Engineering lead | All stakeholders |
| Payroll engine (Section 5, Feature 1.3-1.8) | Backend engineer(s) | Engineering lead | Compliance advisor | HR ops |
| Government integrations (Section 5, Phase 3) | Backend engineer(s) | Engineering lead | Legal/compliance advisor | Founder/CEO |
| AI/Agent layer (Sections 6-7) | AI engineer(s) | Engineering lead | Product lead | Founder/CEO |
| Security (Section 9) | Engineering lead | Founder/CEO | External pentest vendor | All stakeholders |
| Data privacy/DSAR (Section 10) | Engineering lead | Founder/CEO | Legal counsel | All stakeholders |
| Accessibility (Section 11) | Frontend engineer(s) | Engineering lead | Design | Product lead |
| UI/UX (Section 12) | Design/Frontend | Product lead | Engineering lead | All stakeholders |
| Pricing (Section 15) | Product lead | Founder/CEO | Finance/Sales | All stakeholders |
| Go-live sign-off (Section 20) | Engineering lead | Founder/CEO | All module owners | All stakeholders |

**Decision authority rule:** any scope change to a P0 item in this PRD requires Founder/CEO sign-off before Engineering proceeds. Scope changes to P1/P2 items can be approved by the Engineering lead alone, logged in the change record.

---

## 18. Onboarding & Data Migration Plan `[NEW]`

Most target MSMEs are moving off Excel or a legacy HR tool. This did not exist in v2.0.

### 18.1 Import Path

| Step | Action |
|---|---|
| 1 | Client provides employee data via a Taāzur-provided Excel template (columns matching Feature 1.1 employee master record fields) |
| 2 | System validates: required fields present, iqama/passport format, IBAN format, date formats, no duplicate national IDs within the tenant |
| 3 | Validation errors are returned as a downloadable annotated file, not a blocking wall of text; client corrects and re-uploads |
| 4 | On successful validation, records are staged, not committed, and shown to HR for a final review screen before committing to the live database |
| 5 | Post-commit, an audit log entry records the bulk import as a single traceable event |

### 18.2 Rollback

**WHEN** a bulk import is committed and an error is discovered within 24 hours, **THE SYSTEM SHALL** allow the Super Admin to roll back the entire import batch as a single action, restoring the pre-import state. Verified by: integration test simulating import, discovery of a data error, and rollback.

### 18.3 What Is Explicitly Out of Scope for Migration

Automated migration from specific third-party HR tools (e.g. direct API pull from a competitor's system) is not in scope for Phase 1 or Phase 2. The Excel template path above is the only supported import method until client demand justifies building specific integrations.

---

## 19. Legal Documents Reference `[NEW]`

This PRD does not contain full legal text; it links out to where each document lives once drafted, and states what must be true of each based on the technical decisions already made elsewhere in this PRD.

| Document | Must reflect | Status |
|---|---|---|
| Privacy Policy | Data types collected (Section 1.1 employee master record), retention periods (Section 10.2), DSAR process (Section 10.3), AI data handling (Section 6.5) | Not yet drafted, draft in-house from this PRD, external legal review before publishing |
| Terms of Service | Uptime commitment (Section 16.1), support model (Section 16.2), pricing/billing terms (Section 15.2) | Not yet drafted |
| Data Processing Agreement (DPA) | PDPL processor obligations, breach notification timeline (Section 10.4), sub-processor list (AWS, Anthropic, Twilio, etc.) | Not yet drafted, required before any Enterprise-tier contract signing |
| AI Usage Disclosure | Which features are AI-generated (per the labeling requirement in Section 6.5), human override rights | Not yet drafted, can be a short standalone page rather than folded into the main Privacy Policy |

**Recommendation:** draft all four using this PRD as the factual source, then send for a single external legal review pass rather than iterating with counsel line by line. This keeps legal cost proportional to a startup budget while still getting a qualified review before anything is published or signed.

---

## 20. Go-Live Checklist `[ENHANCED]`

Every item below now has an explicit owner and sign-off authority. No item may be checked by the person who implemented it; sign-off requires a second person, matching standard change-control practice.

### Core HR + Payroll

| Item | Owner | Sign-off authority |
|---|---|---|
| Payroll correct for 5 scenarios (Saudi old, Saudi new, expat, overtime, final settlement) | Backend engineer | Engineering lead |
| Wage file validates against Mudad format | Backend engineer | Engineering lead |
| Consistency check flags salary mismatches | Backend engineer | Engineering lead |
| GOSI dual-rate verified against manual calculation | Backend engineer | Compliance advisor |
| ESB calculation verified across tenure brackets | Backend engineer | Compliance advisor |
| Arabic payslips render correctly (RTL, terminology) | Frontend engineer | Product lead |
| Hijri dates display using islamic-umalqura | Frontend engineer | Product lead |
| Leave management handles all Saudi leave types correctly | Backend engineer | Compliance advisor |
| Document expiry alerts fire at 90/60/30 days | Backend engineer | Engineering lead |

### Portal + Access

| Item | Owner | Sign-off authority |
|---|---|---|
| Single login works for all 5 roles | Frontend engineer | Engineering lead |
| Each role sees correct dashboard and menu items | Frontend engineer | Product lead |
| Permission matrix enforced, tested cross-role access attempts | Backend engineer | Engineering lead |
| MFA works via TOTP authenticator | Backend engineer | Engineering lead |
| Employee self-service: view payslip, request leave, update profile | Frontend engineer | Product lead |
| Manager: approve leave, approve expense, view team | Frontend engineer | Product lead |
| SSO tested with Microsoft Entra ID (if applicable) | Backend engineer | Engineering lead |

### AI Layer

| Item | Owner | Sign-off authority |
|---|---|---|
| AI copilot answers regulatory questions with correct citations | AI engineer | Compliance advisor |
| AI briefings generate with anonymized data (no PII in prompts) | AI engineer | Engineering lead |
| AI rate limits enforced per tenant and per user | AI engineer | Engineering lead |
| AI outputs labeled "AI-generated" with override option | Frontend engineer | Product lead |
| AI risk tiering applied per Section 6.2 (informational vs consequential) | AI engineer | Founder/CEO |

### Security + Infrastructure

| Item | Owner | Sign-off authority |
|---|---|---|
| Tenant isolation verified (tenant A cannot access tenant B) | Backend engineer | Engineering lead |
| AWS me-south-1 deployment confirmed | DevOps | Engineering lead |
| S3 encryption + KMS configured | DevOps | Engineering lead |
| TLS 1.3 enforced | DevOps | Engineering lead |
| Audit logging captures all write operations | Backend engineer | Engineering lead |
| Backup restore tested | DevOps | Engineering lead |
| RTO/RPO targets met in a live restore drill (new, Section 10.5) | DevOps | Founder/CEO |
| WCAG 2.1 AA axe-core scan passes with zero critical/serious violations (new, Section 11.3) | Frontend engineer | Product lead |
| Pilot client's PRO validates first payroll cycle | HR Specialist (pilot) | Founder/CEO |

### Rollback Trigger `[NEW]`

**WHEN** any Security + Infrastructure item above fails sign-off, or any Core HR + Payroll payroll-accuracy item fails sign-off, **THE SYSTEM SHALL NOT** go live, regardless of how many other checklist items pass. Founder/CEO is the only authority who can grant an exception, and any exception must be logged with a written justification and a remediation date.

---

---

## 21. HR Generalist Practice Alignment `[NEW]`

This section did not exist before v4.0. It documents the research basis for the Phase 2 and Phase 4 additions above, and shows, phase by phase, that every stage of recruitment, retention, and release now has a corresponding feature. Sources: the SHRM Body of Applied Skills and Knowledge (the standard reference for what an HR generalist's job actually covers), current full-cycle recruiting research, employee retention framework research, and offboarding/alumni best-practice research.

### 21.1 Recruitment: All Phases Covered

The standard full-cycle recruitment model runs seven stages: workforce planning, job analysis/preparation, sourcing, screening, interviewing/selection, hiring (offer, negotiation, background/reference checks), and onboarding through the first 90 days.

| Recruitment stage | Taāzur feature(s) | Status before v4.0 | Status after v4.0 |
|---|---|---|---|
| Workforce planning (Stage 0) | Feature 2.15 | Missing | Covered |
| Job analysis / preparation | Feature 2.1 (position creation, competency requirements) | Covered | Covered |
| Sourcing, external | Feature 2.2 (career page) | Covered | Covered |
| Sourcing, internal/referral | Feature 2.16, Feature 2.18 | Missing | Covered |
| Screening | Feature 2.3, Feature 2.4 (AI resume screening) | Covered | Covered |
| Interviewing/selection | Feature 2.5, Feature 2.6 | Covered | Covered |
| Hiring: offer and negotiation | Feature 2.7 | Covered | Covered |
| Hiring: background and reference checks | Feature 2.3 (enhanced) | Missing | Covered |
| Onboarding, Day 1-14 | Feature 2.8 (original) | Covered | Covered |
| Onboarding, 30/60/90-day integration | Feature 2.8 (enhanced) | Missing | Covered |

### 21.2 Retention: All Phases Covered

Retention research converges on a small set of consistently cited levers: fair and transparent compensation, recognition, career development and internal mobility, manager relationship quality (stay interviews), succession visibility, and measured engagement (eNPS, pulse surveys). The "5 C's" framing (Communication, Connection, Culture, Contribution, Career Development) and the "Respect, Recognition, Rewards" framing both point at the same underlying levers from different angles.

| Retention lever | Taāzur feature(s) | Status before v4.0 | Status after v4.0 |
|---|---|---|---|
| Fair, transparent compensation (Total Rewards) | Feature 4.11 | Missing | Covered |
| Recognition | Feature 4.12 | Missing | Covered |
| Career development / internal mobility | Feature 2.18, Feature 4.15 | Missing | Covered |
| Succession visibility (for high-potential employees specifically) | Feature 2.17 | Missing | Covered |
| Manager relationship quality / proactive check-ins | Feature 4.13 (stay interviews) | Missing | Covered |
| Reactive flight-risk detection | Feature 3.9 (AI attrition risk analyzer) | Covered | Covered |
| Flight-risk detection paired with an actual recommendation | Feature 4.16 | Missing, risk score had no attached action | Covered |
| Engagement measurement | Feature 4.5 (enhanced with eNPS) | Partial (surveys existed, no standing eNPS metric) | Covered |
| Grievance and disciplinary handling (employee relations) | Feature 4.14 | Missing entirely | Covered |
| Benefits | Feature 2.14 | Covered | Covered |
| Training and skill development | Feature 2.11, Feature 2.12, Feature 2.13 | Covered | Covered |

### 21.3 Release: All Phases Covered

Modern offboarding research treats release as a relationship transition, not a termination event: departure conversation, time-boxed knowledge transfer with a named recipient, exit interview, asset/access recovery, and, distinctly, an alumni relationship that keeps rehire and referral value on the table. Boomerang hires are a large enough share of hiring at many companies now that treating rehire eligibility as an afterthought is a measurable cost, not just a nicety.

| Release stage | Taāzur feature(s) | Status before v4.0 | Status after v4.0 |
|---|---|---|---|
| Departure notification / process trigger | Feature 2.10 | Covered | Covered |
| Structured knowledge transfer with a named successor/owner per task | Feature 2.10 (enhanced) | Present as a label only, no structure | Covered |
| Asset return and IT access revocation sequencing | Feature 2.10 | Covered | Covered |
| Exit interview | Feature 2.10 | Covered | Covered |
| Final settlement | Feature 1.4, Feature 2.10 | Covered | Covered |
| Rehire eligibility determination | Feature 2.10 (enhanced) | Missing | Covered |
| Alumni network / ongoing relationship | Feature 2.19 | Missing entirely | Covered |
| Offboarding outcome metrics (boomerang rate, successor ramp time, alumni referrals) | Feature 4.17 | Missing | Covered |

### 21.4 One Item Outside the Original Scope, Flagged for a Decision

Employee relations and case management (Feature 4.14, grievance intake and disciplinary tracking) is not strictly a "recruitment, retention, or release" phase item; it is a fourth SHRM core function (part of the Employee Engagement / Employee Relations functional area) that this PRD had no coverage for at all before v4.0. It is included here because an HR generalist tool that cannot log a grievance or a disciplinary write-up is missing a function most MSME buyers will assume is included. Confirm this stays in scope for Phase 4, given it does carry its own confidentiality and access-control requirements beyond the standard permission matrix in Section 3.4, specifically, case files should be visible only to HR Manager and Super Admin by default, not to the employee's direct manager, since the manager may be a party to the case.

---

*Taāzur, Product Requirements Document v5.0*
*AI-Native Saudi HR & Payroll Platform*
*Confidential, 11 July 2026*
