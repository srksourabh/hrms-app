# Operations, Testing, and Release Guide

## 1. Scope

This runbook covers local operation, customer-demo verification, canonical quality gates, deployment evidence, and statutory release controls. It does not provide production credentials or secrets.

## 2. Toolchain

- Windows host with Git Bash/MSYS shell
- Node.js and pnpm workspace
- Next.js 16 web app
- Turbo monorepo tasks
- Vitest unit/integration tests
- Playwright production-mode E2E
- PostgreSQL for database-dependent tests and tenant operation
- Optional Redis/queue, object storage, LLM provider, and external adapter credentials

Use the repository’s pinned lockfile and package scripts. Do not use a globally mismatched package manager to install dependencies.

## 3. Environment categories

### Required for build/typecheck

Most compilation paths do not require live external credentials. Environment validation tests intentionally verify missing required variables in some scenarios.

### Required for local demo authentication

- `DEMO_MODE=true`
- `AUTH_SECRET` set to a local non-production value
- `AUTH_TRUST_HOST=true` for local host operation

Never reuse production secrets in local testing or documentation.

### Required for real tenant/database workflows

- Valid PostgreSQL connection and migration state
- Public registry and tenant schemas
- Auth secret and trusted host configuration
- Storage/queue configuration where used

### External providers

Qiwa, Mudad, GOSI, Muqeem, bank, ZATCA, insurer, email, SMS, and LLM providers require separate authorized credentials/contracts/scopes. Absence of credentials must leave adapters dormant or explicitly mocked.

## 4. Core commands

Run from repository root.

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Focused commands:

```bash
pnpm --filter @hrms-app/auth typecheck
pnpm --filter @hrms-app/web typecheck
pnpm --filter @hrms-app/web build
pnpm exec vitest run packages/auth/src/__tests__/demo-identities.test.ts
pnpm exec vitest run packages/demo/src/__tests__/company-onboarding.test.ts
pnpm --filter @hrms-app/web exec playwright test --config=../../playwright.config.ts
```

The Playwright configuration starts the fresh production build on port 3100 with deterministic local demo authentication values.

## 5. Canonical gate meanings

| Gate | Proves | Does not prove |
|---|---|---|
| Typecheck | TypeScript contracts compile | Runtime behavior or legal correctness |
| Unit tests | Covered pure/function behavior matches assertions | Missing edge cases, external specs, integration behavior |
| Build | Next.js/packages compile for production | Public deployment, database connectivity, real APIs |
| Playwright E2E | Browser journeys pass against production-mode local build | Real authority connectivity, all browsers/locations, field performance |
| Manual browser QA | Human-like navigation/rendering/console observations | Exhaustive regression coverage |
| Deployment Ready | Hosting provider built and serves alias | Correct region, database, secrets, compliance, customer acceptance |
| Public E2E | Deployed routes/journeys pass | Real-user p95, every role, every external side effect |

## 6. Required role journey matrix

### Public

- `/` redirects to `/login` without session.
- Brand, attribution, English/Arabic control, form, and four demo role buttons render.
- Invalid credentials show non-enumerating error.

### HR Manager — Reem

- Opens company command center.
- Can discover 22 modules.
- Completes Company Onboarding demo.
- Executes explicitly mock government action and sees no-authority disclosure/audit.

### HR Specialist — Aisha

- Opens Aisha session and displays `hr specialist` role.
- Can reach intended operational modules.
- Must not execute undeclared settings/integration/payroll-run actions once capability route/API enforcement is completed.

### Department Manager — Fahad

- Opens Fahad session and displays `department manager` role.
- Team/approval views must exclude out-of-team records.
- Must not run company payroll or manage company settings/integrations.

### Employee — Omar

- Opens personal command center.
- Sees ownership disclosure and masked ID.
- No company Payroll navigation.
- Direct `/payroll` is denied.
- Personal expense workflow succeeds and is attributed to Omar.

## 7. Responsive matrix

Minimum widths/heights:

- 360×800 compact mobile
- 390×844 modern mobile
- 768×1024 portrait tablet
- 1366×768 laptop
- 1440×900 desktop
- 1920×1080 full HD

At each resolution verify:

- no horizontal overflow;
- no clipped headings/actions;
- no broken images;
- readable status/disclosures;
- keyboard/focus operation;
- 44 px touch targets where applicable;
- drawer/rail behavior for navigation;
- result/audit feedback stays visible.

## 8. Performance baseline

See `production-performance-2026-07-13.md` and `apps/web/e2e/production-performance.mjs`.

The benchmark measures navigation timing, FCP, LCP, CLS, HTTP status, broken images, and overflow across representative routes/resolutions. It is synthetic and does not replace Riyadh/Jeddah field RUM or INP.

Rerun against a chosen environment:

```bash
PLAYWRIGHT_BASE_URL='https://example.invalid' \
  pnpm --filter @hrms-app/web exec node e2e/production-performance.mjs
```

## 9. Database verification

With an isolated test database:

- apply migrations;
- create two tenant schemas;
- seed distinct records;
- prove cross-tenant read/write/update/delete denial;
- prove pooled connections do not retain another tenant’s search path;
- prove background jobs resolve the correct tenant;
- verify rollback/cleanup.

Database-dependent tests that skip without a database are not green production evidence.

## 10. External integration verification

A provider may be called “live” only after all are true:

1. Authorized account/contract and documented environment.
2. Secrets stored outside code/logs and rotation tested.
3. Least scopes and tenant authorization verified.
4. Contract-tested request/response schema.
5. Idempotency/replay protection.
6. Timeout/retry/backoff/dead-letter behavior.
7. Authority/provider acknowledgement and reference persisted.
8. Manual fallback documented and tested.
9. Audit event includes actor, request category, response status, reference, and timestamp without leaking secrets.
10. Production and sandbox states cannot be confused in UI.

## 11. Statutory calculation release gate

No payroll/statutory calculation may ship for real use until:

- rule owner and legal reviewer identified;
- authoritative primary source captured;
- applicability and effective dates encoded;
- citizen/non-citizen and transition cohorts covered;
- rate/base/cap/rounding/partial-period tests exist;
- retroactive corrections and overrides are audited;
- expected examples independently calculated;
- configuration cannot silently change closed payroll;
- output discloses rule version;
- rollback/correction process exists.

Current GOSI, EOSB, WPS, leave, overtime, and insurance gaps are documented separately and block production payroll reliance.

## 12. Documentation verification

Before release:

- verify every internal Markdown link exists;
- verify external URLs return expected official sources;
- record retrieval dates;
- find stale product names, dates, architecture, roles, and hosting claims;
- compare route inventory with Next build output;
- compare module inventory with `module-catalog.ts`;
- compare roles with RBAC and database enum;
- compare APIs/entities with implemented routers/schema, not PRD only;
- validate RAG manifest and headings;
- ensure no secrets or personal data appear.

## 13. Deployment and public verification

1. Run canonical local gates.
2. Inspect `git diff --check` and secret scan.
3. Deploy through the authorized platform/project.
4. Verify deployment is Ready and alias resolves.
5. Run public E2E with `PLAYWRIGHT_BASE_URL`.
6. Run manual browser journeys for four roles.
7. Inspect browser console/network failures.
8. Rerun performance/resolution harness.
9. Verify actual hosting/function/database/storage regions before publishing residency copy.
10. Record evidence in `docs/progress.md`.

Do not commit, push, or rewrite history unless explicitly authorized.

## 14. Incident/failure language

Use precise outcomes:

- **Prepared/generated:** artifact created locally.
- **Queued:** waiting for a worker/provider.
- **Sent:** outbound request accepted by transport/provider.
- **Submitted:** authority/provider received a request.
- **Accepted/approved:** only with authoritative acknowledgement/reference.
- **Reconciled:** compared against named source and differences resolved.
- **Paid:** bank/payment confirmation, not merely file creation.
- **Enrolled/covered:** insurer/authority confirms active membership/policy dates.
- **Failed:** include safe reason, retained work, retry/fallback, owner.

Never replace a failed provider call with a plausible success message.
