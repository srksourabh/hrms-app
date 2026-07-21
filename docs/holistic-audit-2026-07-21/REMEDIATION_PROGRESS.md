# Holistic Audit Remediation — Progress Tracker

Goal: resolve audit findings, demo-ready. Started continuation 2026-07-22.
Source: `hrms-app_Detailed_Audit_Findings_2026-07-21.csv` (99 findings).

Legend: [x] done · [~] in progress · [ ] todo · [def] deferred (needs user / large effort, not demo-blocking)

## Wave 1 — committed f952130 (DONE)
API-001, API-002, API-003, API-005, API-006, API-007(p), API-008, API-011, API-012,
API-013, RBAC-001, RBAC-002, RBAC-009, AUTH-002, AUTH-009(p), AUTH-010, AUTH-011,
PRIV-002, PRIV-005, PRIV-006, PRIV-008, PRIV-009, PRIV-012(p), PRIV-013, QA-005.

## Phase 1 — Demo safety (customer-visible) — committed
- [x] UX-009 destructive delete, no confirm (Guide Map, Recruitment Jobs) — added confirm guards
- [~] UX-010 native window.confirm() → app dialog — deferred to Phase 4 (already prompts; polish only)
- [x] UX-002 dead language toggle on login page — removed dead switcher (no i18n wired)
- [def] UX-001 RTL layout not mirrored — deferred: dir=ltr everywhere, RTL never renders (i18n project)
- [x] BIZ-001 expense self-approval — blocked at create + approve
- [x] BIZ-002 / RBAC-005 expense.markPaid — gated to finance roles (requireRole)
- [x] BIZ-003 expense mutation audit trail — writeAudit on create/approve/reject/markPaid
- [x] BIZ-005 expense self-approval segregation — submitter cannot approve own
- [x] BIZ-015 (expense) atomic status guard on markPaid
- [x] BIZ-007 leave accrual compounding (~6.5x) — idempotent recompute + idempotency test
- [x] BIZ-008 duplicate EOSB settlement — guard on computed settlement per employee

## Phase 2 — Criticals: provisioning (wave 2, in progress)
- [~] DB-001 tenant DDL builds 2/24 tables → generator + generated file + wire tenant-manager + parity test
- [ ] DB-002 migrations 0001/0002 hardcode dev schema
- [ ] DB-003 audit_logs + append-only trigger in provisioning
- [ ] DB-004 iqama unique + perf indexes in provisioning
- [ ] DB-005 employees missing immigration/gcc cols + type divergence

## Phase 3 — Security / logic sweep (High → Medium)
- [x] API-004 / RBAC-003 employee.getById/list — redact salary; dept-scope getById
- [x] RBAC-004 attendance/leave company reads → requireCapability (recruiter excluded)
- [x] BIZ-004 leave overdraw re-checked at approval boundary
- [x] BIZ-005 leave self-approval blocked (segregation of duties)
- [ ] BIZ-009 payroll updateStatus state-machine shortcuts
- [ ] BIZ-010 payslip.create arbitrary amounts
- [ ] BIZ-011 compensation self-approval
- [ ] BIZ-013 referral self-crediting
- [ ] BIZ-014 self-authored performance review
- [ ] BIZ-015 approval race (atomic status guard)
- [ ] BIZ-003 expense mutation audit trail
- [ ] BIZ-006 leave back-dating
- [ ] BIZ-012 offer state-machine guard
- [ ] API-009 retention update employeeId/status spread
- [x] API-010 ai.chat no longer forwards client model string
- [ ] RBAC-007 recruitment application/referral full client payload
- [x] RBAC-008 ai.assistant list/getById → requireCapability(settings:manage)
- [ ] PRIV-010 salary cert/experience letter unaudited PII exposure
- [ ] PRIV-011 audit log omits auth/role/export/PII-view events
- [def] PRIV-001 CSP script-src 'unsafe-inline' — needs nonce-based CSP (Next hydration would break); real project, not a safe pre-demo fix
- [ ] AUTH-003 no absolute session lifetime / stale role in JWT
- [ ] AUTH-004 lockout columns absent from Drizzle schema (schema drift)
- [ ] AUTH-006 MFA not enforced by policy
- [ ] AUTH-008 MFA no backup codes / TOTP throttle
- [ ] DB-007 crypto dev-key fallback + no versioning
- [ ] DB-011 users.mfa_secret plaintext (not encryptedText)
- [ ] QA-002 attendance.getSubtree fetches whole tenant
- [ ] QA-003 leave.runAccrual per-row writes → bulk
- [ ] QA-012 employees fullName leading-wildcard search

## Phase 4 — Quality / hygiene
- [ ] QA-006 lint 372 errors (no-explicit-any / non-null-assertion) — web app
- [ ] QA-001 employees table zero indexes (covered by DB-004/provisioning + migration)
- [ ] DB-006 timestamps without tz (Riyadh) — schema withTimezone (wave 2 partial)
- [ ] UX-003 form labels htmlFor/id
- [ ] UX-004 required markers + validation not announced
- [ ] UX-005 focus outline removed (Super Admin filter)
- [ ] UX-006 icon-only clear-search no accessible name
- [ ] UX-007 Save Map View modal: dialog semantics/focus trap/Esc
- [ ] UX-008 help chat no aria-live
- [ ] UX-011 no skip-to-main link
- [ ] UX-012 Table header cells no scope="col"
- [ ] UX-013 row role=link + nested button
- [ ] API-006 error strings (done wave1) — verify

## Deferred (needs user action or large effort; not demo-blocking) — documented, not silently dropped
- [def] PRIV-003 real Supabase password in `_db_url.txt` → remove file from tree + USER must ROTATE
- [def] PRIV-004 Vercel OIDC tokens in .env.local (expected local artifact; gitignored)
- [def] PRIV-007 auth failure logs email — fix if quick
- [def] QA-004 drizzle-orm 0.38→>=0.45.2 (major bump, regression risk) — evaluate
- [def] QA-007 tests for retention/recruitment routers (large)
- [def] QA-008 un-skip tenant-isolation tests (needs DATABASE_URL)
- [def] QA-009 tests for attendance/expense/etc routers (large)
- [def] QA-010 e2e payroll/leave/recruitment (large)
- [def] QA-011 split 2 >800-line routers (refactor risk)
- [def] AUTH-012 password policy min length (product decision)
- [def] DB-008 per-tenant migration runner (arch, large)
- [def] DB-009 leave_balances uniqueness+timestamps (covered partly by provisioning EXTRA)
- [def] DB-010 / DB-012 PII columns plaintext at DB level (documented app-layer tradeoff)
- [def] PRIV-002 already wave1
