# Taāzur HRMS — Protocol v3.0 RAG audit and remediation plan

**Date:** 19 July 2026
**Source of truth:** `Taazur_HRMS_Master_Test_Protocol_v3.md` (~150 cases across 10 parts)
**Method:** read-only code audit of the current `master` branch (four parallel audits: compliance math, auth/security, RBAC/multi-tenancy, functional/non-functional). Highest-stakes findings (GOSI rates, deduction caps, EOSB accrual, `employee.update`) verified by hand against the code.
**Status of this document:** audit + plan only. No application code has been changed.

---

## 1. Executive summary (plain English)

The app is a broad, well-structured HR platform with genuinely strong foundations in a few areas, but **it is not production-grade for real Saudi payroll, compliance, or data protection today.** There are multiple "S1" blockers - the protocol's own rule is that *any open S1 is an automatic No-Go for go-live.*

The three things that matter most:

1. **Money is wrong or unprotected.** GOSI contribution rates are miscalculated on every Saudi payslip (employers are over-charged), and there is no legal cap on salary deductions - the system will happily deduct an employee down to near-zero net pay, which is illegal under Saudi labour law. A routine no-fault layoff currently calculates zero end-of-service pay.
2. **Anyone signed in can change anyone's salary, and nothing is recorded.** The single most sensitive action in an HR system - editing pay - has no proper permission check, no approval step, and no audit log. The audit-log table exists but is never written to. This fails RBAC, PDPL, and basic internal-control requirements at once.
3. **Account security is thin.** No real password reset, no brute-force lockout, no multi-factor login for payroll roles, and sessions never time out. A captured login stays valid for 30 days even after logout.

The good news: the hardest structural thing - keeping one company's data completely separate from another's (multi-tenancy) - is done correctly and would likely survive a penetration test. The end-of-service *formula* is largely correct. The fixes below are mostly well-scoped engineering, not a rewrite.

**Overall verdict: No-Go until the P0 blockers in section 4 are closed and re-tested.**

---

## 2. RAG scorecard

RAG = Red (missing/wrong) · Amber (partial/weak/unverified) · Green (correct and present).

| Part | Area | Green | Amber | Red | Headline |
|------|------|:---:|:---:|:---:|----------|
| 1 | Authentication & session | 1 | 2 | 6 | No real reset, no lockout, no MFA, no timeout |
| 2A | EOSB | 5 | 7 | 2 | Formula good; no-fault termination path pays 0; Art 87/80 not enforced end-to-end |
| 2B | Payroll & deductions | 2 | 0 | 8 | No deduction caps; no proration; no period lock |
| 2C | GOSI | 3 | 2 | 2 | **Rates wrong on every Saudi payslip** |
| 2D | Mudad/WPS | 0 | 1 | 2 | Demo-only file, not a submittable WPS |
| 2E | Qiwa/Nitaqat | 0 | 0 | 5 | Nitaqat engine and contract-conversion not implemented |
| 2F | Leave | 1 | 2 | 6 | Entitlement keyed to nationality, not tenure (Art 109) |
| 2G | Contracts | 1 | 1 | 3 | Art 77 remaining-period, probation cap, Art 79 lifecycle missing |
| 3 | Core functional (CRUD/ESS/workflow/docs/reports) | ~8 | ~14 | ~14 | Audit trail, approval→balance, dup-ID, doc generation all missing |
| 4 | RBAC & multi-tenancy | 6 | 0 | 6 | Tenant isolation strong; intra-tenant role/ownership ad-hoc |
| 5 | Security | 6 | 6 | 2 | BOLA on employee edit; stack-trace leak; weak CSP |
| 6 | Input validation | 6 | 6 | 4 | No Saudi ID format, no date-order/future-date guards, no `.strict()` |
| 7 | Non-functional | ~9 | ~9 | 3 | RTL only after toggle; toggle not persisted; no custom 404 |
| 8 | Integrations | 2 | 3 | 2 | Gov integrations demo-grade; failed Qiwa sync not queued |
| 9 | PDPL & lifecycle | 0 | 1 | 5 | No audit, no retention/erasure, no lawful-basis, hard deletes |

*(Counts are approximate where a suite mixes many small cases; exact per-case verdicts are in section 6.)*

**Bright spots to protect:** cross-tenant isolation (schema-per-tenant, session-derived) is solid; the EOSB accrual formula is correct; parameterised queries throughout (no SQL injection); Zod strips unknown keys (mass-assignment mostly closed); Hijri/dual-date localization works; bcrypt cost 12; production stack-trace suppression on the generic error page.

---

## 3. The critical contradiction to know about

The 19 July commit "correct payroll engine per 2026 legal audit" reports "all 22 payroll tests passing," and they do pass. **But the tests assert the wrong GOSI numbers**, so a green test suite is hiding a live money bug. Passing tests here do not mean correct output. This is the single most important thing to understand before trusting the payroll engine: the tests must be re-baselined against the protocol's verified values, not the other way around.

---

## 4. P0 blockers (must fix before go-live) — the No-Go list

Each item is a confirmed S1. Ordered by blast radius.

### P0-1 — GOSI rates are wrong on every Saudi payslip
- **What:** On a 20,000 base the code deducts more than the law allows. Existing-system employer comes out at 12.75% (2,550) instead of 11.75% (2,350); new-system (Jul 2026) comes out at 10.5% pension each side, giving employee 2,250 / employer 2,650 instead of 2,150 / 2,550.
- **Why it happens:** two constants. `packages/payroll/src/gosi.ts:57` sets existing-system employer pension to `0.10` (should be `0.09`); `gosi.ts:66` sets new-system base pension to `0.095` (should be `0.09`, so Jul-2026 lands on 10%, not 10.5%).
- **Compounding:** `packages/payroll/src/regulatory-config.ts` holds a *second, conflicting* set of GOSI rates that `calculateGosi` never reads. Two sources of truth.
- **Fix:** correct the two constants; delete or wire up the duplicate config so there is one source of truth; **re-baseline `gosi.test.ts` to the protocol's verified values** (GOSI-001/003/005) before touching output.
- **Protocol cases:** GOSI-001, GOSI-003, GOSI-005.

### P0-2 — No statutory cap on payroll deductions (Art 92/93)
- **What:** deductions are subtracted with only a "never below zero" floor. A 5,400 deduction on a 10,000 salary is applied in full; it should be capped at 50% (5,000). Employer-loan deductions have no 10%/month sub-cap.
- **Why:** `packages/payroll/src/orchestrator.ts:46-47` computes `net = gross − gosi − deductions` with `Math.max(0, …)` and no cap logic.
- **Fix:** enforce total-deduction ≤ 50% of wage and loan ≤ 10%/month; block or cap with a clear reason; surface the cap on the payslip.
- **Protocol cases:** PAY-001, PAY-002.

### P0-3 — No-fault employer termination pays zero EOSB
- **What:** booking a routine layoff as "termination" returns SAR 0 end-of-service, because `"termination"` is hard-mapped to Article 80 (for-cause misconduct = zero). Same bug zeroes the EOSB accrual shown on every payslip (`orchestrator.ts:58` passes `separationReason: "termination"`).
- **Why:** `packages/payroll/src/esb.ts:96-116` conflates "termination" with Article 80.
- **Fix:** separate "employer termination without cause" (full award) from Article 80 for-cause (zero + enforced documentation); fix the accrual call to use the full-award path.
- **Protocol cases:** EOSB-005, EOSB-010, plus the per-payslip accrual.

### P0-4 — Anyone signed in can change any employee's salary, unlogged
- **What:** `employee.update` runs on a bare `protectedProcedure` with no role gate and no ownership check. Any authenticated non-employee role (HR specialist, department manager, payroll admin, recruiter) can overwrite `salaryBasic/Housing/Transport` on any record. No approval routing (HR Specialist salary changes should route to HR Manager). A code comment claims "downstream RLS / ownership scopes" prevent this - **no such enforcement exists.**
- **Why:** `apps/web/trpc/routers/employee.ts:68-77`; `updateEmployeeSchema` includes salary fields (`packages/validators/src/employee.ts:15-20`).
- **Fix:** split salary mutations behind `requireRole`, add object-level ownership checks, add approval routing for HR Specialist, and gate field-level edits per the access matrix. Add step-up re-auth on salary/EOSB.
- **Protocol cases:** RBAC-003, RBAC-004, WF-003, SEC-001 (BOLA), ESS-003, AUTH-011.

### P0-5 — Audit trail never written, and not immutable
- **What:** the `audit_logs` table is defined but has **zero writers** anywhere in the codebase. No sensitive action (salary change, payroll run, EOSB, login, failed login) is recorded. The table is also an ordinary mutable table - no append-only control.
- **Why:** `packages/db/src/schema/tenant/audit_logs.ts` exists; grep finds no inserts.
- **Fix:** central audit helper invoked by every sensitive mutation (actor, timestamp, old/new value, acting role); log failed logins; make the table append-only (revoke UPDATE/DELETE / DB trigger).
- **Protocol cases:** RBAC-006, PDPL-002, PDPL-004, EMP-003.

### P0-6 — Authentication hardening (multiple S1/S2)
- **What:** no real password reset (the "Forgot password?" link is a `mailto:`); no failed-attempt lockout; login rate limit is an in-memory, per-instance, IP-spoofable 10-req/second (~600/min) filter that resets on cold start; sessions are stateless JWT with no idle timeout (30-day default) and no server-side revocation, so logout does not invalidate a captured token; no MFA for HR Manager / Payroll Admin.
- **Why:** `packages/auth/src/index.ts:48` (no `maxAge`); `app/(auth)/login/login-form.tsx:106-111` (mailto); `middleware.ts:9,27,31` (weak limiter); no MFA code anywhere.
- **Fix:** durable (Redis) rate limit + account lockout; real single-use, time-limited, hashed reset tokens (the `verification_tokens` table already exists); short session `maxAge`+`updateAge` with a revocation/jti denylist; TOTP MFA for privileged roles.
- **Protocol cases:** AUTH-002/003/004/007/008/009/010/011, SEC-008.

### P0-7 — Duplicate / unvalidated national ID and iqama
- **What:** no unique index on iqama, no national-ID column at all, no Saudi ID format validation, no pre-insert existence check. Duplicate or ghost employees can be created - a direct Qiwa/GOSI compliance risk.
- **Why:** `packages/db/src/schema/tenant/employees.ts:51`; `packages/validators/src/employee.ts:9`.
- **Fix:** add national-ID field, format regex per nationality, unique constraints, and a duplicate check on create.
- **Protocol cases:** EMP-006, VAL-005.

### P0-8 — Stack-trace leakage on login error
- **What:** `/api/auth/login` returns `details: String(e)` **and `stack: e.stack`** to the client on a 500. Framework internals and paths leak to anyone who can trigger an error.
- **Why:** `app/api/auth/login/route.ts:37-38`.
- **Fix:** generic client error; log details server-side only. (Also delete `app/api/auth/test/route.ts`, a live provider whose `authorize()` returns a user for *any* input, and remove the hardcoded `"demo-fix-2026"` default on the migrate/seed token routes.)
- **Protocol cases:** SEC-010, plus latent auth-bypass surface.

### P0-9 — Hard deletes with no retention or history guard
- **What:** `employee.delete` is a hard `db.delete` with no check for existing payroll history and no soft-delete column. This is both data loss and a PDPL retention violation.
- **Why:** `apps/web/trpc/routers/employee.ts:79-84`; no `deletedAt` in schema.
- **Fix:** soft-delete (`deletedAt`), block hard-delete when payroll history exists, document a retention rule.
- **Protocol cases:** EMP-004, EMP-005, PDPL-003.

---

## 5. P1 (required before real HR operation) and P2 (maturity)

### P1 — statutory correctness and core workflow integrity

- **Nitaqat / Saudization not implemented (S2, multiple cases).** No entity-based log formula, no contract-conversion engine (3 renewals or 4 years, Saudi only), no documented-contract filtering; the only Nitaqat code uses flat 40/20% thresholds *with* a Yellow tier the 2026 rules removed. `qiwa.ts` is sync-only. Build a real Nitaqat band engine and conversion tracker. *(QIW-001/002/003/005/006, offboarding.ts:464-498.)*
- **Leave entitlement keyed to nationality, not tenure (S2).** Art 109 is 21 days/yr ≤5y and 30 days/yr >5y for everyone; the code gives Saudis 30 and expats 21 regardless of tenure, and cannot produce the 165-day 7-year figure. *(LEV-001/002; regulatory-config.ts:190, leave.ts:144.)*
- **Leave approval disconnected from balance (S1 workflow).** Approving or rejecting a leave request never touches `leaveBalances`; balances drift and over-balance requests aren't blocked. Wire `updateStatus` to decrement on approval, and call the engine's `validate()` (balance, overlap, public-holiday exclusion) on create. *(WF-001, LEV-003/009/010; leave.ts:150-159.)*
- **Attendance decoupled from payroll (S1 financial).** Absences and computed overtime never flow into payroll runs, so deductions and OT pay are wrong. Build the attendance→payroll bridge. *(ATT-002/003; payroll.ts:57-70.)*
- **No mid-month proration (S2).** Joiners and leavers are paid a full month; GOSI too. Add day-count proration with a documented basis. *(PAY-004/005/009.)*
- **No payroll period lock / audited reopen (S2).** Re-running a period inserts a new run and double-posts. Add period uniqueness + lock and an audited reopen workflow. *(PAY-010/011.)*
- **Settlement not reconciled to the EOSB engine (S2 financial).** `settlement.create` stores client-supplied amounts instead of sourcing them from `calculateFinalSettlement`; Article 80 documentation is advisory, not enforced. Wire settlement to the engine and enforce the doc gate. *(DOC-003, EOSB-010; settlement.ts:84-89.)*
- **Contract rules incomplete (S2/S3).** Art 77 remaining-period compensation pays one month, not the remaining term; no probation-≤180 validator; no Art 79 resignation lifecycle (auto-accept / 60-day delay / 7-day withdrawal); unpaid leave not excluded from EOSB service. *(CON-003/004/005, LEV-005.)*
- **Department Manager has no scoping (S2).** Treated as company-wide; can view all employees and approve any department's leave. Add "own department" scoping in the query layer and approval path. *(RBAC-002.)*
- **Confidential payroll data over-exposed (S2).** Department Manager and Recruiter can list all payslips, payroll runs, and Qiwa contracts via `companyProcedure`. Tighten to the access matrix. *(payroll.ts:141,179.)*
- **Notifications barely wired (S2).** Domain events (leave approved, settlement deadline) don't notify; no expired-iqama payroll block; iqama tier uses 14 not 15 days. *(NOT-001/002/003.)*
- **CSV export formula injection (S2).** Exported cells starting with `= + - @` are not neutralised. Prefix-guard them. *(RPT-002.)*
- **Security headers (S2).** Add HSTS; move CSP off `unsafe-inline`/`unsafe-eval` to nonce-based; add rate limiting + explicit CSRF handling to `/api/upload`, `/api/company/*`, `/api/seed`, `/api/migrate`; validate uploads by magic bytes and store outside the web root (the local fallback writes into `public/uploads/`). *(SEC-006/009, SEC-004/008.)*

### P2 — maturity and non-functional

- HR document generation (contract, salary certificate, final-settlement letter) with Arabic shaping / font embedding and "Arabic prevails" clause. *(DOC-001..004.)*
- Self-service EOSB simulator for employees. *(ESS-006.)*
- List UX: sortable columns, real pagination (rows beyond 50 are silently dropped today), bilingual/normalised Arabic search. *(LIST-001/003/004.)*
- Gov integration hardening: real Mudad WPS spec validation, official GOSI export format, queue+retry+persist for failed Qiwa syncs, a reconciliation view (Qiwa vs Mudad vs GOSI), outbound idempotency keys. *(INT-002/003/005/006/007.)*
- Validation depth: `.strict()` on schemas, length/number caps, cross-field date-order and future-date guards, double-submit idempotency, optimistic-lock on concurrent edit. *(VAL-004/006/008/009/010.)*
- Localization: render root RTL when Arabic is chosen (not only after a client toggle); persist the language choice; add a custom 404; pin UI timestamps to Asia/Riyadh. *(LOC-001/005, RES-001/005.)*
- PDPL: data-subject self-export, rectification audit, consent/lawful-basis field, backup/restore procedure. *(PDPL-001/002/005/006.)*
- Accessibility: associate form labels with inputs, keyboard-focusable table rows, WCAG AA contrast pass. *(UX-001/005, UX-002.)*

---

## 6. Full per-case RAG tables

> Condensed from the four audits. `file:line` are anchors to verify. RAG: 🟢 Green · 🟠 Amber · 🔴 Red.

### Part 1 — Authentication & session
| Case | RAG | Evidence | Reason |
|---|---|---|---|
| AUTH-002 real reset | 🔴 | login-form.tsx:106-111 | "Forgot password" is a mailto; `verification_tokens` unused |
| AUTH-003 wrong-pass counted/lockout | 🔴 | auth/index.ts:79-80 | Rejected but no attempt counter/lockout |
| AUTH-004 brute-force limit | 🟠 | middleware.ts:9,27,31 | 10 req/sec in-memory, per-instance, IP-spoofable |
| AUTH-005 password policy/history | 🟠 | validators/auth.ts:5-9 | min8+upper+digit; no history/reuse check |
| AUTH-006 login injection-safe | 🟢 | auth/index.ts:77 | Drizzle parameterised |
| AUTH-007 session timeout | 🔴 | auth/index.ts:48 | JWT, no maxAge → 30-day default |
| AUTH-008 concurrent-session limit | 🔴 | auth/index.ts:48 | Stateless, no session store |
| AUTH-009 MFA privileged | 🔴 | (absent) | No MFA/TOTP anywhere |
| AUTH-010 logout invalidates | 🔴 | auth/index.ts:48 | No revocation; old token valid 30 days |
| AUTH-011 step-up re-auth | 🔴 | payroll.ts:53,218 | Role-only; no step-up on salary/EOSB |

### Part 2A — EOSB
| Case | RAG | Evidence | Reason |
|---|---|---|---|
| EOSB-001 | 🟢 | esb.ts:245-248 | <2y → 0 |
| EOSB-002 | 🟢 | esb.ts:252 | ≈7,001 (365.25 rounding) |
| EOSB-003 | 🟢 | esb.ts:250-252 | ≈51,008 |
| EOSB-004 | 🟢 | esb.ts:251-252 | ≈199,500 |
| EOSB-005 | 🟠 | esb.ts:96-116 | 37,500 only if reason=end_of_contract; "termination"→0 |
| EOSB-006 | 🟠 | esb.ts:123-143 | Correct only if `fullAwardOverride` set; no auto-detect / not wired in settlement |
| EOSB-007 | 🟠 | esb.ts:123-143 | Same override caveat |
| EOSB-008 | 🟠 | esb.ts:189-210 | 8,000 only if end_of_contract |
| EOSB-009 | 🟠 | esb.ts:252 | ≈39,542 value good; reason-mapping caveat |
| EOSB-010 | 🔴 | settlement.ts:84-89 | Amount 0 ok but documentation upload not enforced |
| EOSB-011 | 🟠 | esb.ts:68,252 | 45,500 correct; reason caveat |
| EOSB-012 | 🔴 | esb.ts | No service-combine option |
| EOSB-013 | 🟢 | esb.ts:123-127 | force_majeure → full award |
| EOSB-014 | 🟠 | offboarding.ts:174-205 | Full award ok; "no notice" (Art 81) not implemented |

### Part 2B — Payroll & deductions
| Case | RAG | Evidence | Reason |
|---|---|---|---|
| PAY-001 50% cap | 🔴 | orchestrator.ts:46-47 | No cap; full deduction applied |
| PAY-002 10% loan cap | 🔴 | orchestrator.ts:43-47 | No sub-cap |
| PAY-003 OT floor 1,050 | 🟢 | overtime.ts:100-122 | 1.5× all; hourly=basic/208 |
| PAY-004 join proration | 🔴 | orchestrator.ts:39-47 | No mid-month proration |
| PAY-005 leaver proration | 🔴 | orchestrator.ts:39-47 | Same |
| PAY-006 7/14-day deadlines | 🔴 | settlement.ts | No deadline/reminder |
| PAY-007 payslip reconcile+label | 🟢 | orchestrator.ts:71-99 | Reconciles; GOSI label emitted (amounts wrong) |
| PAY-009 mid-month GOSI proration | 🔴 | gosi.ts:148 | Full-base only |
| PAY-010 period lock | 🔴 | payroll.ts:53-119 | No uniqueness/lock; re-run double-posts |
| PAY-011 audited reopen | 🔴 | payroll.ts:121-130 | Any status set, no audit |

### Part 2C — GOSI
| Case | RAG | Evidence | Reason |
|---|---|---|---|
| GOSI-001 | 🔴 | gosi.ts:57,66 | Existing ER 2,550 (vs 2,350); New 2,250/2,650 (vs 2,150/2,550) |
| GOSI-002 | 🟢 | gosi.ts:103,151 | Expat: 200 employer, 0 employee |
| GOSI-003 | 🔴 | gosi.ts:148,57,66 | Cap ok; rates wrong |
| GOSI-005 | 🟠 | gosi.ts:101-123 | Two-system distinction works; new value 2,250 not 2,150 |
| GOSI-006 | 🟢 | gosi.ts:112-114 | 2024-07-03 → New, deterministic |
| GOSI-007 | 🟢 | gosi.ts:148 | Transport excluded from GOSI base |
| GOSI-008 | 🟠 | gosi.ts:65-73 | Auto-escalates but hardcoded const, not config; base value wrong |

### Part 2D — Mudad
| Case | RAG | Evidence | Reason |
|---|---|---|---|
| MUD-001 valid WPS | 🟠 | mudad.ts:1-28 | Demo/mock; iqama/IBAN null; not submittable |
| MUD-002 cash approval | 🔴 | mudad.ts | No cash-approval path |
| MUD-003 reconciliation | 🔴 | mudad.ts:99-100 | Sums only, no reconciliation |

### Part 2E — Qiwa/Nitaqat
| Case | RAG | Evidence | Reason |
|---|---|---|---|
| QIW-001 log formula, no Yellow | 🔴 | offboarding.ts:464-498 | Flat 40/20% + Yellow tier |
| QIW-002 2 renewals→Limited | 🔴 | qiwa.ts | No renewal/conversion logic |
| QIW-003 4yr→Unlimited+alert | 🔴 | qiwa.ts | Not implemented |
| QIW-005 undocumented excluded | 🔴 | offboarding.ts:464-468 | Raw count; no documented filter |
| QIW-006 expat unlimited blocked / 12mo default | 🔴 | qiwa/src/index.ts:48-71 | No expat guard/default |

### Part 2F — Leave
| Case | RAG | Evidence | Reason |
|---|---|---|---|
| LEV-001 1y=21 | 🔴 | regulatory-config.ts:190 | Saudi gets 30; nationality-based not tenure |
| LEV-002 7y=165 | 🔴 | accrual.ts:73-81 | Flat add, not cumulative |
| LEV-003 Eid excluded | 🔴 | leave.ts:554-575 | Calendar days; no holiday exclusion |
| LEV-004 encashment 22,500 | 🟠 | leave.ts:260-266 | Returns days, labelled SAR |
| LEV-005 unpaid→5.75y | 🔴 | esb.ts:265-276 | Unpaid leave not subtracted |
| LEV-007 maternity 12wk | 🟠 | regulatory-config.ts:192 | 12wk ok; 6-postnatal not enforced |
| LEV-008 paternity/bereavement 3d | 🟢 | regulatory-config.ts:194-195 | Both 3 days |
| LEV-009 exceed balance blocked | 🔴 | leave.ts:128-148 | No balance check on create |
| LEV-010 overlap rejected | 🔴 | leave.ts:128-148 | No overlap detection |

### Part 2G — Contracts
| Case | RAG | Evidence | Reason |
|---|---|---|---|
| CON-002 30/60 asymmetric | 🟢 | offboarding.ts:180-184 | Correct |
| CON-003 remaining-period 60,000 | 🔴 | offboarding.ts:192-195 | Pays one month, not remaining term |
| CON-004 probation 180/181 | 🔴 | regulatory-config.ts:236 | Config value only; no validator |
| CON-005 Art 79 lifecycle | 🔴 | (absent) | No auto-accept/delay/withdrawal |
| CON-006 end<start rejected | 🟠 | validators/leave.ts:19-22 | Leave guarded; contract path not |

### Part 4 — RBAC & multi-tenancy
| Case | RAG | Evidence | Reason |
|---|---|---|---|
| RBAC-001 employee blocked from admin | 🟢 | server.ts:60-73; rbac.ts:179-210 | Server-side allowlist |
| RBAC-002 dept-mgr scoping | 🔴 | employee.ts:8,27; leave.ts:150 | No department scoping anywhere |
| RBAC-003 HR-Spec salary→approval | 🔴 | employee.ts:68-77 | Bare protectedProcedure; direct salary write |
| RBAC-004 payroll-admin job edits | 🔴 | employee.ts:58-77 | Can edit any field |
| RBAC-005 timeout/step-up/single-session | 🔴 | auth/index.ts:48 | None enforced |
| RBAC-006 audit logging | 🔴 | audit_logs.ts:3 | Table never written |
| RBAC-007 API replay blocked | 🟢 | server.ts:60-98 | Server-side FORBIDDEN |
| RBAC-008 cross-tenant isolation | 🟢 | tenant-manager.ts:45-81 | Schema-per-tenant, session-derived |
| RBAC-009 dual-role union | 🔴 | auth/index.ts:19-38 | Single role only |
| ESS-001/003/004/007 | 🟢 | employee.ts:45-52; payroll.ts:169-179 | Self-scoped; blocked server-side |
| PDPL-004 audit immutability | 🔴 | audit_logs.ts:3-13 | Mutable + empty |

### Part 5 — Security
| Case | RAG | Evidence | Reason |
|---|---|---|---|
| SEC-001 IDOR/BOLA | 🔴 | employee.ts:68-77 | Within-tenant object authz missing |
| SEC-002 stored XSS | 🟢 | (no dangerouslySetInnerHTML) | React escaping |
| SEC-003 reflected XSS | 🟢 | employee.ts:15,92 | Parameterised + escaped |
| SEC-004 CSRF | 🟠 | api/upload, api/company | NextAuth CSRF for sign-in; custom routes rely on SameSite only |
| SEC-005 SQL injection | 🟢 | routers via Drizzle | Parameterised |
| SEC-006 headers | 🟠 | next.config.ts:3-22 | No HSTS; CSP allows unsafe-inline+unsafe-eval |
| SEC-007 token handling | 🟢 | auth/index.ts:48 | HttpOnly+SameSite+Secure |
| SEC-008 rate limit sensitive | 🟠 | middleware.ts:63-84 | Only auth/trpc; upload/seed/migrate unprotected |
| SEC-009 file upload | 🟠 | api/upload/route.ts:89-105 | Trusts client MIME; local fallback in web root |
| SEC-010 error leakage | 🔴 | api/auth/login/route.ts:37-38 | Returns String(e)+stack |
| SEC-011 mass assignment | 🟢 | validators/employee.ts:4-20 | Zod strips unknown keys |
| SEC-012 sensitive data exposure | 🟠 | employee.ts:27-38 | getById over-broad; no HSTS |
| SEC-013 direct export denied | 🟢 | payroll.ts:37,218 | Role-gated |

*(Parts 3, 6, 7, 8, 9 per-case verdicts are captured in section 5 by theme; the functional audit's full table is preserved in the workstream mapping in section 7.)*

---

## 7. Remediation plan — phased

**Phase 0 — Close the No-Go list (P0-1 … P0-9).** Nothing ships until every P0 is fixed *and re-tested against the protocol's verified values.* Re-baseline the GOSI tests first so the suite protects the correct numbers.

**Phase 1 — Statutory correctness and workflow integrity (P1).** Nitaqat engine, tenure-based leave, approval→balance wiring, attendance→payroll bridge, proration, period lock, settlement-to-engine reconciliation, department scoping, notifications, CSV/headers hardening.

**Phase 2 — Maturity and non-functional (P2).** Document generation, list UX, gov-integration hardening, validation depth, localization/RTL, PDPL lifecycle, accessibility.

**Cross-cutting discipline for every phase (per the protocol's own rules):**
- Every fix ships with a test that asserts the *protocol's* expected value, not the current output.
- Re-run the minimum regression set after each fix: AUTH-001/006; all Part 2 S1 cases; RBAC-001/003/007/008; SEC-001/002/011; PAY-010; PDPL-004.
- Any change to money or law gets a second review before merge.
- Do not "fix" a test to match wrong output - fix the code.

---

## 8. To-do list (production-grade)

Grouped by workstream, ordered so blockers come first. Check off as completed.

### Workstream A — Payroll & compliance money (P0/P1) — ✅ COMPLETE (branch `fix/workstream-a-payroll-compliance`)
- [x] A1. Fix GOSI existing-employer pension `0.10`→`0.09` and new-system base pension `0.095`→`0.09` (`gosi.ts:57,66`). _(252c62c)_
- [x] A2. Re-baseline `gosi.test.ts` to protocol values (GOSI-001/003/005); marked the conflicting `regulatory-config.ts` rate block non-authoritative. _(252c62c)_
- [x] A3. Add deduction caps: total ≤50% of wage, loan ≤10%/month (`orchestrator.ts`); surfaced on payslip breakdown. _(38e9f74)_ Note: live `payroll.create` does not yet feed deductions, so caps bind wherever deductions flow.
- [x] A4. Separate employer no-fault termination (full award) from Article 80 (`termination_for_cause`, zero); fixed accrual call. _(f937513)_
- [x] A5. Mid-month proration for joiners/leavers in pay and GOSI (Art 88 day-count basis). _(6f242e5)_
- [x] A6. Payroll period lock (application-level) + audited `reopen` workflow. _(18b07b2)_ Follow-up: add DB partial-unique index on `period_month`; persist reopen audit once B3 lands.
- [x] A7. Wire `settlement.create` to `calculateFinalSettlement`; enforce Article 80 documentation gate via `investigationDocumentId`. _(6f6fe9b)_
- [x] A8. Art 87 auto-derivation (marriage/childbirth windows) into settlement flow; Art 81/80 "no notice". _(807eb98)_
- [x] A9. Art 77 remaining-period compensation; probation-≤6-month validator; Art 79 lifecycle date helper. _(82b7df5)_ Follow-up: stateful Art 79 resignation workflow (persisted records).

**Workstream A verification:** 48 payroll+validator tests pass; payroll package and web app typecheck clean. Remaining follow-ups are folded into later workstreams (B3 audit persistence, DB index hardening, stateful Art 79).

### Workstream B — Access control, audit, sessions (P0) — ✅ MOSTLY COMPLETE (branch `fix/workstream-a-payroll-compliance`)
- [x] B1. Field-scoped `employee.update`: salary fields limited to super_admin/hr_manager/payroll_admin; hr_specialist salary change rejected (must be HR-Manager approved); profile fields limited to HR roles; create restricted to HR. _(B1/B3/B6 commit)_
- [ ] B2. **Deferred to Workstream C** (step-up re-auth needs the session mechanism built in C).
- [x] B3. Central audit helper (`apps/web/trpc/audit.ts`) — actor, acting role, old/new, IP — on employee create/update/salary_change/delete, payroll.run, payroll.reopen, settlement.create; read-only audit router (HR Manager/super admin). _(B1/B3/B6 commit)_
- [x] B4. `audit_logs` append-only migration (`0007_audit_logs_append_only.sql` + `apply-migration-0007.js`) — **not yet run against prod** (needs approval). _(B4 commit)_
- [x] B5. Department-Manager scoping: `getManagedDepartmentIds` scopes `employee.list` and blocks cross-department leave approval. _(B5 commit)_
- [x] B6. Payslip/payroll-run/wage-file/qiwa-contract list+getById restricted to `PAYROLL_VIEW_ROLES` (removed dept-mgr/recruiter salary over-exposure). _(B1/B3/B6 commit)_

**Workstream B verification:** web app typechecks clean. Follow-ups: run the B4 migration; build the persisted salary-change approval queue (currently hr_specialist salary edits are blocked, not queued); failed-login logging lands with C (auth package); B2 step-up with C.

### Workstream C — Authentication hardening (P0)
- [ ] C1. Real password reset: single-use, time-limited, hashed token using `verification_tokens`.
- [ ] C2. Durable (Redis) login rate limit + account lockout with backoff.
- [ ] C3. Session `maxAge`+`updateAge` (idle timeout) + revocation/jti denylist so logout invalidates.
- [ ] C4. TOTP MFA for HR Manager and Payroll Admin.
- [ ] C5. Password policy: add lowercase/special + last-5 reuse block.

### Workstream D — Data integrity & lifecycle (P0/P1)
- [ ] D1. National-ID field + iqama unique constraints + format regex + duplicate check on create.
- [ ] D2. Soft-delete (`deletedAt`); block hard-delete with payroll history; document retention rule.
- [ ] D3. Remove stack-trace leak on login error; delete `api/auth/test/route.ts`; remove hardcoded migrate/seed token default.
- [ ] D4. Leave: wire approval→balance decrement; call engine `validate()` (balance, overlap, holiday exclusion) on create; exclude unpaid leave from EOSB service.
- [ ] D5. Tenure-based leave entitlement (21 ≤5y / 30 >5y for all) replacing nationality logic.
- [ ] D6. Attendance→payroll bridge: absences deduct, computed overtime flows to pay.

### Workstream E — Saudization / Nitaqat & contracts (P1)
- [ ] E1. Entity-based Nitaqat log-formula band engine; remove Yellow tier.
- [ ] E2. Documented-Saudi-contract filtering for the ratio.
- [ ] E3. Contract-conversion engine (3 renewals or 4 years, Saudi only) with pre-conversion alert.
- [ ] E4. Expat guard: block Unlimited; default no-duration to 12 months.

### Workstream F — Security hardening (P1)
- [ ] F1. Add HSTS; move CSP to nonce-based (drop unsafe-inline/unsafe-eval).
- [ ] F2. Rate limiting + explicit CSRF on `/api/upload`, `/api/company/*`, `/api/seed`, `/api/migrate`.
- [ ] F3. File upload: magic-byte validation; store outside web root (or force remote storage).
- [ ] F4. CSV export formula-injection prefix guard (`= + - @`).

### Workstream G — Notifications, integrations, reporting (P1/P2)
- [ ] G1. Domain-event notifications (leave approved/rejected, settlement deadline); iqama tier 90/60/30/15/7; expired-iqama payroll block.
- [ ] G2. Settlement deadline computation (7/14 days) + scheduled reminders.
- [ ] G3. Queue+retry+persist failed Qiwa syncs; reconciliation view (Qiwa/Mudad/GOSI); outbound idempotency keys.
- [ ] G4. Real Mudad WPS spec validation; official GOSI export format.

### Workstream H — Documents, UX, PDPL, non-functional (P2)
- [ ] H1. HR document generation (contract, salary certificate, settlement letter) with Arabic shaping/font embedding + "Arabic prevails" clause.
- [ ] H2. Self-service EOSB simulator (employee, own data).
- [ ] H3. List UX: sortable columns, real pagination, bilingual/normalised Arabic search.
- [ ] H4. Validation depth: `.strict()`, length/number caps, date-order/future-date refines, double-submit idempotency, optimistic-lock on edit.
- [ ] H5. Localization: root RTL when Arabic chosen; persist language; custom 404; pin UI timestamps to Asia/Riyadh.
- [ ] H6. PDPL: data-subject self-export, rectification audit, consent/lawful-basis field, backup/restore procedure.
- [ ] H7. Accessibility: label-for associations, keyboard-focusable rows, WCAG AA contrast.

---

## 9. What was verified by hand (not just agent-reported)

- **GOSI rate bug (P0-1):** read `gosi.ts` in full; confirmed existing-employer = 10%+0.75%+2% = 12.75% vs required 11.75%, and new-system Jul-2026 = 10.5% pension vs required 10%. Root cause is the two named constants.
- **Deduction caps (P0-2) and EOSB accrual zero (P0-3):** read `orchestrator.ts:28-100`; confirmed no cap logic and `separationReason: "termination"` on the accrual call.
- **`employee.update` BOLA (P0-4):** corroborated independently by the security and RBAC audits; confirmed the "RLS/ownership scopes" comment has no backing code.
- **Payroll test suite:** ran `vitest run packages/payroll` - 22/22 pass, confirming the tests assert the wrong GOSI values.
