# Taāzur End-to-End Product Handbook

**Purpose:** explain every user-facing product area, repeated phrase, route family, core field, action, state, and usability rule in the current repository.

## 1. Product promise and limits

Taāzur is designed as one Saudi-native HR and payroll application for company owners, HR teams, managers, employees, and candidates. The same login creates a role-aware session. The product connects the employee lifecycle—from company setup and recruitment through payroll, development, and offboarding—with Saudi compliance workflows.

Current customer-demo behavior combines implemented screens, deterministic operational demos, and explicit mock integrations. It must not be presented as a fully connected government, bank, insurance, tax, immigration, or production payroll system.

## 2. Global application anatomy

### Header

- **Search people, modules and actions:** intended global command/search entry. Verify each indexed object before claiming universal search.
- **العربية / EN:** language control. Current bilingual coverage is partial; the PRD target is Arabic-first, native RTL.
- **Notifications:** entry for role-scoped alerts. Empty/unread/error states must be accessible.
- **User menu/avatar:** identifies the signed-in fixture or production user.

### Sidebar

- **Command center / My day:** role-specific home.
- **All workspaces:** catalog of 22 modules and their truthful status.
- **Workforce:** people, organization, leave, payroll, documents.
- **Talent:** recruitment, performance/growth, engagement.
- **Saudi & AI:** compliance, Qiwa workspace, AI intelligence.
- **Settings:** company/user settings; should require `settings:manage` for company changes.
- **Sign out:** ends the Auth.js session and returns to login.

The sidebar filters non-employee navigation through the central RBAC capability map, and the command center filters metrics, featured modules, priorities, compliance cards, Settings, and the payroll-start action. This improves usability but is not a security boundary; routes, procedures, queries, exports, team scope, and fields still require server enforcement.

### Main content

Common hierarchy:

1. Disclosure/status strip.
2. Page heading and concise purpose.
3. Metrics or readiness indicators.
4. Records/work queue.
5. Primary actions.
6. Result/status message.
7. Audit or supporting detail.

## 3. Repeated UI phrases

| Exact phrase | User meaning | Usability rule |
|---|---|---|
| **Welcome back** | Authentication entry | Follow with clear account/product context |
| **Where heritage meets modern workforce.** | Brand proposition | Marketing only; never a compliance claim |
| **Powered by UDS-Noon JV** | Product maker attribution | Keep distinct from tenant identity |
| **Operational demo** | Interactive fixture workflow | Keep visible before and after actions |
| **Fictional Rukn Energy data** | Demo-data disclosure | Must remain visible on customer-facing demo screens |
| **Live · Saudi operations** | Active demo dashboard posture | Must not imply live authority connectivity |
| **Command center** | Company/team landing view | Content must match role capability and scope |
| **My day** | Employee self-service landing view | Contain only owned/personal records |
| **Priority queue** | Tasks requiring attention | Each item needs owner, severity/status, date, and destination |
| **Compliance posture / score** | Product-generated readiness heuristic | Not legal certification; expose calculation/evidence |
| **Connected fixture** | Deterministic in-repository data | Never call it production synchronization |
| **Run demo operation…** | Local asynchronous demonstration | Disable duplicate submission; announce completion |
| **Actions by [name]** | Demo audit attribution | Production audit requires immutable persistence and context |
| **This workspace is not available for your role** | Authorization denial | Explain scope without leaking protected information |
| **Ownership scoped** | Employee sees own records only | Verify on server/API as well as UI |
| **Ready / Validated** | Internal state | Qualify as local/demo unless external acknowledgement exists |
| **Mock integration · no authority call** | Simulated external workflow | Mandatory for government/bank simulations |
| **No Saudi authority or bank is contacted** | External-call disclaimer | Must appear adjacent to mock operations |

## 4. Public and authentication screens

### `/login` — Login

**Users:** public.
**Purpose:** email/password authentication and four demo role shortcuts.

Sections:

- Brand header with Arabic/English toggle.
- Brand/market proposition panel.
- `Welcome back` form card.
- **Email:** work-account identifier; HTML email input.
- **Password:** secret credential; masked input.
- **Sign In:** submits credentials without exposing failure details.
- Separator **or**: indicates optional demo-persona path.
- **HR Manager demo:** Reem fixture.
- **HR Specialist demo:** Aisha fixture.
- **Department Manager demo:** Fahad fixture.
- **Employee demo:** Omar fixture.
- Fictional-data disclosure.
- **Sign up:** public company-account registration route.

States:

- Idle.
- `Signing in...` / `Opening...` loading state with disabled controls.
- Invalid-credentials alert.
- Demo-unavailable alert.
- Authenticated redirect to `/`.

Security/usability:

- Never reveal whether a specific email exists.
- Demo buttons must be disabled when demo mode is off or removed from production customer environments as policy requires.
- Password managers and keyboard submission must work.
- Rate limiting must not block normal sequential testing.

### `/signup` — Company account registration

**Fields:** Company Name, CR Number, Your Name, Work Email, Password.
**Validation:** shared `signupSchema`; Saudi regulatory context is selected by the page.
**Current behavior:** POST `/api/auth/signup`; registry/schema creation and Super Admin account when database configuration is available.
**After success:** redirect to `/login?registered=true`.

Critical documentation correction: the UI currently says data is hosted in AWS `me-south-1`, while the inspected Vercel deployment did not establish that hosting topology. Do not publish a region/data-residency claim until infrastructure evidence matches the copy.

## 5. Role-aware home

### `/` — Command center or My day

- Unauthenticated users redirect to `/login`.
- Employee demo sessions render `EmployeeCommandCenter` with owned records.
- Other sessions render company command center.

Company dashboard phrases and use:

- **Lead your workforce with clarity, [first name].** Personalized heading.
- **Explore all modules:** opens `/modules`.
- **Start payroll:** opens `/payroll/new`; must eventually be capability-filtered.
- **Active people:** active fixture count.
- **Payroll readiness:** internal pre-check status.
- **Open positions:** recruitment demand.
- **Saudization:** illustrative fixture rate/band.
- **Run the employee lifecycle:** featured module shortcuts.
- **Priority queue:** expiring documents, payroll pre-check, leave approval, Nitaqat scenario.

Employee dashboard use:

- Personal greeting and ownership disclosure.
- Attendance, pay, goals, documents, and learning snapshot.
- Quick actions for profile, leave, payslip/documents, learning, and expenses.
- No company payroll navigation or other employees’ records.

## 6. Module discovery

### `/modules` — All workspaces

**Purpose:** discover every product capability without hiding roadmap state.

- Search filters by name/description/capability.
- Status labels: Live workspace, Operational demo, Mock integration.
- Phase groups map to PRD phases 1–5.
- Cards show bilingual name, description, feature IDs, capabilities, and destination.

### `/modules/[slug]` — Module workspace

- Resolves product catalog entry and demo workflow.
- Checks workflow allowed roles.
- Company Onboarding uses a dedicated five-step component.
- Other module demos use the shared operational workspace.
- Unauthorized users see an explanatory denial surface.
- Unknown slugs return not found.

## 7. Core workforce routes

| Route | Screen/purpose | Primary actions and states |
|---|---|---|
| `/employees` | Employee directory | list/filter, open profile, add employee |
| `/employees/new` | Create employee | Full Name, Nationality, Hire Date, Department, Basic/Housing/Transport, GOSI System; submit validation |
| `/employees/[id]` | Employee detail | identity/employment/salary/documents/history; not-found/loading/error |
| `/employees/[id]/edit` | Edit employee | same core fields; save/cancel; server authorization required |
| `/departments` | Department hierarchy | expand/collapse tree, add/open department |
| `/departments/new` | Create department | name, hierarchy/parent, submit |
| `/departments/[id]` | Department detail | department identity and related records |
| `/leave` | Leave requests | status list, approve/process where permitted, create request |
| `/leave/new` | Leave request | Employee, Leave Type, Start Date, End Date; balance/rule validation |
| `/documents` | Document registry | type filter, owned/company scope, open/upload |
| `/documents/upload` | Document upload | file/type/employee/expiry metadata; security controls required |
| `/payroll` | Payroll-run list | view period/status/totals, start run |
| `/payroll/new` | Start payroll | Period Month (`YYYY-MM`), create pre-check run |
| `/payroll/[id]` | Payroll review | period, status, payslips/checks, finalize/export subject to blockers |
| `/profile` | Personal profile | masked identity, personal snapshot, leave/documents; ownership scoped |
| `/settings` | Settings | Name, Email, Role shown; company changes require capability enforcement |

## 8. Saudi compliance and intelligence routes

| Route | Purpose | Key limitation |
|---|---|---|
| `/compliance` | Compliance checks/readiness | Scores and fixture bands are not legal certification |
| `/compliance/new` | Create a compliance check | Rule/evidence and effective-date design must be explicit |
| `/qiwa` | Qiwa contract/integration workspace | Credentials are absent; customer demo must remain mock/dormant |
| `/ai` | AI intelligence workbench | External LLM requires configured provider/key; legal outputs need citations and human review |

## 9. Recruitment route family

| Route | Purpose |
|---|---|
| `/recruitment` | Recruitment overview |
| `/recruitment/jobs` | Job requisitions |
| `/recruitment/jobs/new` | Create job requisition |
| `/recruitment/jobs/[id]` | Requisition detail |
| `/recruitment/candidates` | Candidate database |
| `/recruitment/candidates/new` | Add candidate |
| `/recruitment/applications` | Application pipeline |
| `/recruitment/interviews` | Interview schedule/list |
| `/recruitment/interviews/new` | Schedule interview |
| `/recruitment/offers` | Offer records |
| `/recruitment/offers/new` | Draft offer |
| `/recruitment/checks` | Background/reference checks |
| `/recruitment/checks/background/new` | Start background check |
| `/recruitment/checks/reference/new` | Start reference check |
| `/recruitment/onboarding` | 30/60/90 plans |
| `/recruitment/onboarding/new` | Start plan |
| `/recruitment/referrals` | Employee referrals |
| `/recruitment/referrals/new` | Submit referral |

Usability requirements:

- Pipeline status must be text plus visual indicator.
- Candidate AI scores are decision support, not autonomous rejection.
- Sensitive checks require consent, evidence, restricted access, and retention rules.
- Department Manager should see only authorized openings/candidates.

## 10. Retention and growth route family

| Route | Purpose |
|---|---|
| `/retention` | Retention & Growth hub |
| `/retention/goals` and `/new` | Goals and key results |
| `/retention/reviews` and `/new` | Performance-review cycles/items |
| `/retention/skills` and `/new` | Skills, evidence, gaps |
| `/retention/career` and `/new` | Career paths |
| `/retention/engagement` and `/new` | Engagement surveys/actions |
| `/retention/rewards` and `/new` | Rewards/recognition |
| `/retention/rewards/recognitions` and `/new` | Recognition records |
| `/retention/talent` and `/new` | Talent reviews/succession |

Usability requirements:

- Employees see only their records and authorized shared content.
- Manager input must distinguish draft, submitted, acknowledged, calibrated, and complete.
- AI-generated text must remain editable and attributable.
- Anonymous surveys require defensible anonymity thresholds.
- Compensation/talent data needs stricter access than ordinary profile data.

## 11. Form-language dictionary

| Label | Meaning and validation expectation |
|---|---|
| **Full Name** | Legal/display name; production model needs Arabic/English handling and identity-match rules |
| **Nationality** | Drives statutory cohort logic; must not be free-inferred |
| **Hire Date** | Contract/service start basis; dual-date display but canonical stored date |
| **Department** | Organization assignment and manager/team scope |
| **Basic Salary** | Contract/payroll component; currency SAR unless explicit otherwise |
| **Housing Allowance** | Salary/GOSI/EOSB treatment must be rule-driven and verified |
| **Transport Allowance** | Payroll component; do not assume GOSI/EOSB inclusion without effective rule |
| **GOSI System** | Transitional cohort/rule selection; must derive from registration data and effective law, not user guess alone |
| **Period Month** | Payroll period; prevent duplicates and invalid closed periods |
| **Leave Type** | Effective-dated statutory/company policy definition |
| **Start/End Date** | Inclusive/exclusive rule must be defined; account for holidays/work patterns |
| **CR Number** | Saudi company registration identifier; validate format and duplicates |
| **Saudi IBAN** | 24-character IBAN beginning `SA`; production should verify checksum, ownership, and masked display |
| **Saudization target** | Company planning input, not an official Nitaqat result |

## 12. State and feedback language

Every asynchronous screen must support:

- **Loading:** skeleton/progress, prevent duplicate actions.
- **Empty:** explain why empty and what permitted action creates data.
- **Validation error:** field-specific, text-based, focusable, preserves entered data.
- **Authorization denied:** no protected detail, safe return action.
- **External unavailable:** name affected provider, preserve work, retry/fallback, no false success.
- **Success:** state what changed, whether persisted/submitted, reference, actor, time, next action.
- **Partial success:** identify completed and failed items; never collapse into generic success.
- **Conflict:** show current version and safe refresh/retry.
- **Mock/demo:** disclose non-production scope in the result itself.

## 13. Accessibility and responsive usability

- Use semantic headings in order and one page-level purpose heading.
- Labels must be programmatically associated with inputs.
- Buttons describe the action; icons require accessible names when no text exists.
- Focus must move to alerts/errors after submission where appropriate.
- Status cannot rely on color alone.
- Arabic uses actual RTL layout and Arabic labels, not only isolated Arabic subtitles.
- Touch targets should be at least 44×44 CSS pixels.
- No horizontal overflow at 360, 390, 768, 1366, 1440, and 1920 widths.
- At 768 px, the full 278 px sidebar should collapse to a drawer/rail to preserve content width.
- Dense mobile dashboards should prioritize actions/alerts before secondary analytics.

## 14. Product-wide usage warnings

1. Do not use current demo GOSI/EOSB/leave outputs for real payroll.
2. Do not describe government adapters as connected.
3. Do not describe fixture Nitaqat labels as official.
4. Do not send real employee data through demo identities.
5. Do not publish unverified hosting/data-residency copy.
6. Do not rely on hidden navigation as authorization.
7. Do not treat AI text as legal advice or autonomous employment decisions.
8. Do not process background checks or sensitive cases without legal basis, notice/consent where required, and restricted access.
