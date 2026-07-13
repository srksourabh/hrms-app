# Taāzur Documentation Center

**Product:** Taāzur / تآزر — Saudi HR and payroll platform
**Documentation baseline:** 13 July 2026
**Audience:** customer evaluators, HR teams, payroll teams, managers, employees, administrators, engineers, auditors, support, and AI/RAG consumers

> This documentation describes the repository and public customer-demo build as inspected. It is not legal, tax, immigration, insurance, or accounting advice. Saudi requirements change frequently and may vary by establishment activity, size, location, profession, worker cohort, nationality, contract, and government-platform rules. Confirm production rules with MHRSD, GOSI, Qiwa, Mudad, CCHI/CHI, ZATCA, SDAIA, the Ministry of Interior, and qualified Saudi counsel.

## 1. Documentation truth model

Every documented behavior uses one of four statuses:

| Status | Meaning | Safe customer interpretation |
|---|---|---|
| **Implemented** | Backed by application code and an actual route, API, schema, or tested calculation | May be exercised in the application, subject to environment dependencies |
| **Operational demo** | Interactive deterministic fixture behavior with visible outcomes and audit feedback | Demonstrates intended UX; does not persist authoritative production records |
| **Mock integration** | Simulates an external system without contacting it | Never describe as connected, submitted, approved, reconciled, or verified by an authority |
| **PRD-only** | Required or designed in `docs/02-prd.md`, but not established as working code | Roadmap/requirement, not shipped behavior |

A green build proves compilation, not legal correctness, external authority connectivity, production data persistence, or customer acceptance.

## 2. Documentation map

| Document | Purpose | Primary audience |
|---|---|---|
| [`02-prd.md`](02-prd.md) | Product requirements and target architecture | Product, engineering, compliance |
| [`product-handbook.md`](product-handbook.md) | End-to-end screen, phrase, field, action, state, and usability guide | All users and support |
| [`roles-permissions.md`](roles-permissions.md) | Roles, demo personas, capabilities, route behavior, and permission caveats | Admins, security, QA |
| [`module-reference.md`](module-reference.md) | All 22 product modules, routes, capabilities, actions, and status | Product, sales, users, QA |
| [`api-data-reference.md`](api-data-reference.md) | Implemented APIs, procedures, schemas, tenancy, and data classifications | Engineering, integration, audit |
| [`saudi-statutory-requirements.md`](saudi-statutory-requirements.md) | Saudi labor, payroll, insurance, immigration, and statutory requirements | HR, payroll, compliance, product |
| [`statutory-gap-analysis.md`](statutory-gap-analysis.md) | Requirement-to-product audit and missing controls | Leadership, compliance, engineering |
| [`operations-testing-guide.md`](operations-testing-guide.md) | Setup, demo operation, tests, deployment, observability, and incident limits | Engineering, QA, support |
| [`SECURITY.md`](SECURITY.md) | Security controls and disclosure policy | Security, engineering |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Current high-level system architecture | Engineering |
| [`design.md`](design.md) | Brand and interface direction | Product design, frontend |
| [`progress.md`](progress.md) | Delivery ledger and evidence links | Delivery team |
| [`rag/README.md`](rag/README.md) | RAG ingestion, chunking, metadata, and citation rules | AI platform engineers |

## 3. Product vocabulary

| Term or phrase | Exact meaning in Taāzur |
|---|---|
| **Taāzur / تآزر** | Configurable product identity. The Arabic word communicates collaboration and mutual support. |
| **Powered by UDS-Noon JV** | Product attribution. It is not the tenant/customer name. |
| **Rukn Energy Services (Demo)** | Fictional tenant used only for deterministic customer demonstration. |
| **Fictional demo data** | No displayed person or company represents a real record. |
| **Operational demo** | UI action changes local demo state and creates visible feedback/audit history; no guaranteed database write. |
| **Mock integration** | Deterministic simulation of an external service. No authority, bank, insurer, or third party is contacted. |
| **Live workspace** | A route backed by implemented application screens and/or APIs. It does not imply all downstream integrations are live. |
| **Command center** | Role-aware landing dashboard. HR/manager roles see company operations; employees see personal self-service. |
| **Workspace** | A functional module or workflow surface. |
| **Tenant** | One customer company isolated from other customer companies. The intended data model uses a separate PostgreSQL schema per tenant. |
| **Company procedure** | Authenticated tRPC operation bound to a tenant database context. |
| **Owned record** | Data belonging to the signed-in employee, such as their profile, leave, payslip, documents, goals, or expenses. |
| **Company-wide record** | Data covering multiple employees or organizational operations; requires an authorized non-employee capability. |
| **Authority call** | Request to Qiwa, Mudad, GOSI, Muqeem, ZATCA, a bank, insurer, or other external system. Mock workspaces make none. |
| **Saudi / citizen** | Saudi-national worker for rules that differ by nationality. Do not infer from name, language, or residence. |
| **Expat / non-Saudi / immigrant** | Non-Saudi worker. Product-facing language should prefer **non-Saudi worker** or **expatriate worker** over “immigrant.” |
| **CR** | Commercial Registration number. |
| **Unified number** | Establishment/company unified identifier; context must identify which authority issued it. |
| **GOSI** | General Organization for Social Insurance and related contribution/reporting duties. |
| **SANED** | Unemployment insurance branch applicable under its governing rules, generally relevant to eligible Saudi contributors. |
| **WPS / Mudad** | Wage Protection System workflows and the Mudad platform/file requirements. |
| **Qiwa** | MHRSD labor-services platform, including employment-contract workflows. |
| **Muqeem** | Residency and visa-services platform used by eligible establishments. |
| **Nitaqat** | Saudization classification program; band and quota logic is activity/size/occupation/time dependent. |
| **Iqama** | Resident identity document for non-Saudi workers. |
| **EOSB / ESB** | End-of-service award/benefit. Formula depends on service, wage basis, and separation circumstances. |
| **PDPL** | Saudi Personal Data Protection Law and implementing regulations. |

## 4. Audience entry points

### Company owner or HR Manager

1. Start with `product-handbook.md`.
2. Review Company Onboarding and Payroll in `module-reference.md`.
3. Read the statutory requirements and gap analysis before relying on any calculation.
4. Use the **HR Manager demo** button for full demonstration access.

### HR Specialist

1. Use the **HR Specialist demo** button (Aisha fixture).
2. Focus on people, payroll visibility, documents, recruitment, compliance, and operational tasks.
3. Consult the role guide before assuming write permission.

### Department Manager

1. Use the **Department Manager demo** button (Fahad fixture).
2. Focus on team records, leave/expense approvals, performance, learning, and reports.
3. Company payroll execution and company settings are not intended manager capabilities.

### Employee

1. Use the **Employee demo** button (Omar fixture).
2. Access is limited to personal profile, leave, documents, goals, learning, benefits, performance, mobile self-service, and expenses.
3. Direct company-administration URLs are denied or redirected.

### Engineer or auditor

1. Compare `02-prd.md` with `api-data-reference.md` and `statutory-gap-analysis.md`.
2. Never infer implementation from a PRD endpoint or entity.
3. Verify with source code, tests, database migration state, environment configuration, and public deployment evidence.

## 5. Documentation governance

- Every statutory statement must include an authoritative source URL, retrieval date, applicability, and uncertainty note.
- Every product claim must identify its status.
- External integration documentation must say **mock** unless credentials, network calls, authority acceptance, and audit evidence are verified.
- Rates, thresholds, quotas, dates, and formulas must be effective-dated and configuration-driven in production.
- UI text must not imply legal approval, authority submission, insurance enrollment, payment completion, or data residency without evidence.
- Update the gap analysis whenever a statutory rule or implementation changes.
- Documentation changes require link validation, code-reference validation, and the same review discipline as code.
