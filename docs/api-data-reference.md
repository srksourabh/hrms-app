# Implemented API and Data Reference

**Scope:** current repository contracts, not the aspirational NestJS/Prisma endpoint list in PRD Section 13.3.

## 1. Architecture reality

| Concern | PRD target | Current repository |
|---|---|---|
| Web | Next.js App Router | Next.js 16 App Router |
| API | NestJS REST | Next.js route handlers + tRPC v11 |
| ORM | Prisma | Drizzle ORM |
| Hosting | AWS ECS/RDS/S3 in me-south-1 | Public demo inspected on Vercel; database/external topology not fully verified |
| Auth | NextAuth JWT, MFA, SSO | Auth.js/NextAuth credentials + JWT; MFA/SSO not established |
| Queue/cache | Redis/BullMQ | Queue package/scaffolding; production operation requires environment verification |
| AI | Claude + LangGraph | Provider-agnostic LLM layer and AI scaffolding; external key/provider optional |

Documentation and customer claims must follow current repository/deployment evidence, not planned architecture.

## 2. HTTP route handlers

| Route | Method/purpose | Authentication/status notes |
|---|---|---|
| `/api/auth/[...nextauth]` | Auth.js provider/session/callback routes | Credentials/JWT; rate-limited callback path |
| `/api/auth/signup` | Create tenant registry/schema and Super Admin account | Public validation; database required; transactional/rollback review needed |
| `/api/auth/login` | Application-specific auth helper route | Inspect before third-party use; Auth.js is canonical session path |
| `/api/auth/debug` | Auth diagnostics | Must be disabled/restricted in production |
| `/api/auth/test` | Auth test helper | Must be disabled/restricted in production |
| `/api/health` | Health response | Should distinguish process, database, queue, storage, and external dependencies |
| `/api/qiwa` | Qiwa-related route | No production credential evidence; treat as non-live until verified |
| `/api/trpc/[trpc]` | tRPC HTTP adapter | Procedure authorization applies server-side |
| `/api/cron/accrual` | Scheduled leave accrual | Requires scheduler authentication, idempotency, timezone/effective-date tests |
| `/api/cron/expiry` | Scheduled document expiry processing | Requires scheduler authentication, retry/audit, AST schedule verification |

## 3. tRPC authorization primitives

- `publicProcedure`: no authenticated session required.
- `protectedProcedure`: authenticated session required.
- `companyProcedure`: authenticated tenant/company database context required.
- `canAccessProcedure`: explicit employee/candidate allowlists; other recognized roles currently pass globally.

A production-sensitive mutation needs capability-specific authorization in addition to these primitives.

## 4. Implemented tRPC namespaces

### `user`

- `me`: current session/user context.

### `auth`

- `signup`: validated tenant/user registration path.

### `department`

- `list`, `getById`, `tree` plus create/update/delete operations in the router.
- Company-context data.

### `employee`

- `list`, `getById` plus employee lifecycle CRUD.
- Company context; Department Manager team filtering needs explicit verification.

### `leave`

- Leave-type list.
- Request list/get/create/my/approve paths.
- Employee allowlist permits type list, own create, and own requests.

### `document`

- `list`, `getById`, `myDocuments` plus document mutations.
- Employee allowlist permits `myDocuments` only.

### `payroll`

- Payroll-run list/get.
- Payslip list/get.
- Wage/check/finalization related procedures in router implementation.
- Company context; capability-specific run/finalize enforcement must be verified.

### `settlement`

- `list`, `getByEmployee` and settlement operations.
- Company context.

### `qiwa`

- `sync`, contract `list/getById/getByEmployee`, `testConnection`, `dashboard`.
- Treat external operations as dormant/mock until credentials, calls, acknowledgement, and audit are verified.

### `compliance`

- Compliance-check procedures and results.
- Product score is not legal certification.

### `notification`

- `list`, `markRead`, `markAllRead`, `unreadCount`.
- Employee allowlist includes all four.

### `recruitment`

Implemented groups include jobs, candidates, applications, interviews, offers, onboarding, referrals, background checks, and reference checks, with own-application/interview/referral paths.

Authorization warning: many use `protectedProcedure`; role, tenant, candidate ownership, hiring-team scope, and sensitive-check restrictions need procedure-level proof.

### `retention`

Large router covering goals/key results, review cycles/reviews, skills/gaps, learning, careers, succession/talent, surveys, stay interviews, recognition/rewards, compensation, and related entities.

Authorization warning: many use `protectedProcedure`; authentication alone must not grant organization-wide access.

### `ai`

Procedures cover assistants/suggestions and multiple AI result domains such as matching, feedback, skill recommendations, salary benchmarks, churn/compliance predictions, sentiment, and risk flags.

AI requirements: tenant scope, PII minimization, model/provider/version, prompt/output audit, evidence/citations, risk tier, human approval.

## 5. Public schema

| Table/enum | Purpose | Key controls |
|---|---|---|
| `tenants` | Customer registry, schema name, plan, regulatory context | Unique CR/schema, provisioning transaction, deletion/retention |
| `users` | Login identities and role | Role-enum consistency, tenant link, password hash, employee link |
| `accounts` | Auth provider accounts | Provider/token secrecy and lifecycle |
| `sessions` | Database session model support | Expiry/revocation; app currently uses JWT strategy |
| `verification_tokens` | Verification flows | One-time use, expiry, hashing |
| `plan_tier` | basic/pro/enterprise | Billing/entitlement source |
| `regulatory_context` | Saudi/India | Current product is Saudi-focused; prevent accidental rule mixing |
| `user_role` | six persisted roles | Does not include `payroll_admin` or `recruiter` despite RBAC declarations |

## 6. Tenant schema by domain

### Core/audit

- `departments`
- `employees`
- `employment_history`
- `audit_logs`

Sensitive employee columns include encrypted-designated Iqama, passport, and bank IBAN fields, nationality, dates, GOSI cohort/date, and salary components. A column name ending `_enc` does not prove application encryption or key management; verify write/read paths and KMS/rotation.

### Payroll/compliance

- `payroll_runs`
- `payslips`
- `wage_files`
- `final_settlements`
- `compliance_checks`
- `qiwa_contracts`
- `qiwa_sync_logs`

Missing/weak areas to address include effective-dated statutory rule tables, contribution-line detail, earning/deduction definitions, payroll approvals, bank submission references, authority acknowledgements, settlement service fractions/reasons, and correction/reversal history.

### Leave/documents/notifications

- `leave_types`
- `leave_requests`
- `leave_balances`
- `documents`
- `notifications`

Need policy effective dates, statutory vs company entitlement source, accrual ledger/idempotency, document versions/files/access logs, delivery attempts.

### Recruitment

- `job_requisitions`
- `candidates`
- `applications`
- `interviews`
- `offers`
- `onboarding_plans`
- `referrals`
- `background_checks`
- `reference_checks`

Need explicit candidate consent/notices, retention deadline, lawful check basis, reviewer decisions, fairness/explainability evidence.

### Retention/talent/rewards

Implemented tables include:

- goals and key results
- review cycles, reviews, sections, responses
- skills, employee skills, skill gaps
- learning programs/enrollments
- career paths/roles and employee career paths
- succession plans/candidates
- engagement surveys/responses
- stay interviews
- recognitions/rewards/redemptions
- total-rewards statements
- compensation plans/adjustments
- talent reviews/participants

These domains contain sensitive evaluative/compensation data and require finer access than a generic authenticated procedure.

### AI

Implemented tables include assistants, suggestions, job-description enhancements, candidate matchings, interview feedback, skill recommendations, salary benchmarks, churn predictions, compliance predictions, survey sentiments, AI audit logs, and retention-risk flags.

Need model/version, source/evidence, purpose, input data classification, lawful basis, retention, human decision, correction/appeal, and cross-border/provider metadata.

## 7. Payroll-engine contracts

### `calculateGosi`

Current behavior:

- non-Saudi employee and employer contributions return zero;
- Saudi wage base includes basic + housing + transport, capped at SAR 45,000;
- old system uses 9% employee / 9% employer;
- current system uses 10% employee / 9.75% employer.

This is not production-safe until reconciled with authoritative effective-dated branches, SANED and occupational-hazard components, actual contributory wage definition, cohort rules, and non-Saudi employer liability.

### `calculateEsb`

Current behavior:

- uses basic + housing + transport;
- half monthly wage per completed year through five years;
- full monthly wage per completed year after five;
- calculates against current clock;
- truncates partial years;
- does not accept separation date/reason or resignation adjustment.

Production requires explicit calculation date, partial service, wage basis, separation reason, statutory exceptions, rounding, evidence, and override audit.

### Payroll orchestrator

- Calculates basic/housing/transport/overtime.
- Applies GOSI and arbitrary deductions.
- Floors net pay at zero.
- Runs consistency checks.

Need earning/deduction authorization, overtime formula/hours, absence/leave effects, loans/advances, retro pay, minimum protections, negative-net handling, approvals, correction runs, ledger/reconciliation.

### Mudad file generator

Current generator emits internal XML/CSV structures with employee ID, name, salary components, contributions, and net pay. It leaves Iqama null and does not establish compliance with a current official Mudad/WPS bank file schema. Treat as internal demo export pending official schema validation.

## 8. Multi-tenancy

Intended lifecycle:

1. Register tenant in public schema.
2. Generate unique tenant schema name.
3. Create tenant PostgreSQL schema/tables.
4. Create user linked to tenant.
5. Select tenant database context per request.

Controls:

- Never accept client-supplied schema names.
- Bind schema to authenticated tenant registry.
- Reset/avoid pooled connection `search_path` leakage.
- Test cross-tenant read/write/update/delete and background jobs.
- Ensure exports, storage objects, queues, cache keys, AI logs, search indexes, and notifications carry the same isolation.

## 9. API usability contract

Every API/procedure should document:

- purpose and authorized capabilities;
- tenant/ownership/team scope;
- input schema and sensitive fields;
- output schema and masking;
- status/error codes;
- idempotency behavior;
- audit event;
- external side effect and provider reference;
- retry/timeout/fallback;
- rate limit;
- effective statutory/config version where a calculation occurs.

## 10. Highest-priority API/data gaps

1. Fine-grained capability enforcement for all non-employee roles.
2. Persisted role enum mismatch.
3. Effective-dated statutory rule/config schema.
4. Correct GOSI/SANED/occupational-hazard cohort engine.
5. EOSB engine with partial service and separation reason.
6. Official WPS/Mudad/SIF schema validation and acknowledgement.
7. Health-insurance policies, members/dependants, classes, enrollment/expiry.
8. Work permit, visa, Iqama, passport, profession, sponsor, and mobility records/workflows.
9. Attendance/shift/overtime ledger and Ramadan rule engine.
10. Statutory leave templates and sick-pay tiers.
11. Immutable payroll and sensitive-case audit with old/new values.
12. Data-subject/consent/retention/legal-hold records and DSAR implementation.
13. Background-job authentication, idempotency, retry/dead-letter evidence.
14. Integration credential vault, scopes, signatures, replay protection, acknowledgements.
