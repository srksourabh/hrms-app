# Saudi HRMS Documentation Center

**Product:** Saudi HRMS Portal / بوابة الموارد البشرية السعودية
**Documentation baseline:** 25 July 2026
**Audience:** company owners, HR managers, payroll teams, employees, auditors, support, and engineers.

This documentation describes a Saudi Arabian company HRMS portal with employee administration, departments, designations, field attendance, leave, expenses, reports, payroll, and Saudi compliance workflows. It is not legal, tax, immigration, insurance, or accounting advice. Production statutory rules must be confirmed with official Saudi authorities and qualified Saudi counsel.

## Documentation Map

| Document | Purpose |
|---|---|
| [`02-prd.md`](02-prd.md) | Product requirements and target architecture |
| [`product-handbook.md`](product-handbook.md) | Screen, workflow, field, and user guidance |
| [`roles-permissions.md`](roles-permissions.md) | HR manager, manager, employee, and admin access model |
| [`module-reference.md`](module-reference.md) | Functional module inventory |
| [`api-data-reference.md`](api-data-reference.md) | Data model and implemented server interfaces |
| [`saudi-statutory-requirements.md`](saudi-statutory-requirements.md) | Saudi HR, payroll, and compliance requirements |
| [`statutory-gap-analysis.md`](statutory-gap-analysis.md) | Product-to-compliance gap tracking |
| [`operations-testing-guide.md`](operations-testing-guide.md) | Setup, verification, deployment, and support notes |
| [`SECURITY.md`](SECURITY.md) | Security controls and disclosure policy |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | High-level system architecture |
| [`design.md`](design.md) | Saudi HRMS interface and brand direction |
| [`progress.md`](progress.md) | Delivery ledger and evidence |

## Product Vocabulary

| Term | Meaning |
|---|---|
| **Saudi HRMS Portal** | The default product identity for this Saudi Arabian HRMS build |
| **Tenant/company** | The customer company using the portal |
| **Employee** | A worker record with department, designation, manager, location, payroll, attendance, leave, expense, and compliance context |
| **Department** | HR organization unit used for structure, reporting, and approvals |
| **Designation** | Employee job title or position level |
| **Punch in/out** | Location-aware attendance event for field and office staff |
| **GOSI** | General Organization for Social Insurance workflows and contribution tracking |
| **SANED** | Saudi unemployment insurance branch where applicable |
| **Mudad WPS** | Wage Protection System reporting and file-readiness workflow |
| **Qiwa** | Saudi labor-platform compliance and contract workflow context |
| **Iqama** | Resident identity tracking for non-Saudi workers |
| **Nitaqat** | Saudization classification and attention tracking |
| **EOSB** | End-of-service benefit calculation and accrual context |

## Governance

- Product claims must match implemented routes, schema, and tests.
- Statutory rates, thresholds, and formulas must be effective-dated in production.
- UI copy must not imply legal approval, authority submission, insurance enrollment, or wage payment completion without evidence.
- External integrations remain non-production unless credentials, network calls, authority acceptance, and audit logs are verified.
- Keep customer-facing wording focused on the Saudi company HRMS portal, not any old source-project name.
