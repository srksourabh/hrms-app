# Taāzur RAG Documentation Contract

## 1. Goal

Create a retrievable knowledge base that answers product, role, workflow, API, data, and Saudi statutory questions without:

- presenting PRD-only features as implemented;
- presenting mock integrations as live;
- mixing citizen and non-Saudi obligations;
- using superseded rates/rules;
- giving uncited legal conclusions;
- leaking tenant, employee, candidate, payroll, case, or credential data.

## 2. Corpus

Ingest these documents as separate source families:

| Family | Documents | Authority |
|---|---|---|
| `product-current` | `product-handbook.md`, `module-reference.md`, `roles-permissions.md` | Current repository interpretation; verify against code |
| `engineering-current` | `api-data-reference.md`, `ARCHITECTURE.md`, `operations-testing-guide.md` | Current code/operations; code wins if changed |
| `requirements` | `02-prd.md` | Product intent, not implementation evidence |
| `statutory` | `saudi-statutory-requirements.md` | Secondary synthesis pointing to authoritative sources |
| `gap-audit` | `statutory-gap-analysis.md`, `known-issues.md`, `progress.md` | Delivery/compliance risk state |
| `security` | `SECURITY.md` | Security policy/control documentation |
| `design` | `design.md`, `brand/*` | Brand and usability conventions |

Do not ingest `.env`, credentials, session databases, test artifacts with secrets, employee uploads, production logs, or raw personal data.

## 3. Chunking

- Split Markdown on headings.
- Keep heading ancestry in every chunk.
- Target 500–1,000 tokens; hard maximum 1,500.
- Keep complete tables together when possible.
- Never split a statutory statement from its source/applicability/caveat row.
- Never merge different documents into one chunk.
- Preserve code blocks with the explanation immediately before them.
- Add 10–15% overlap only for long narrative sections, not tables.

## 4. Required metadata

Every chunk requires:

```json
{
  "product": "taazur",
  "document_id": "stable-slug",
  "document_path": "docs/example.md",
  "document_version": "2026-07-13",
  "heading_path": ["H1", "H2", "H3"],
  "source_family": "product-current|engineering-current|requirements|statutory|gap-audit|security|design",
  "implementation_status": "implemented|operational-demo|mock|prd-only|mixed|not-applicable",
  "jurisdiction": "SA",
  "worker_scope": "all|saudi-citizen|non-saudi|employer|candidate|role-name",
  "effective_from": "YYYY-MM-DD|null",
  "effective_to": "YYYY-MM-DD|null",
  "retrieved_at": "YYYY-MM-DD|null",
  "authority": "official-source-name|repository|product-requirement",
  "source_urls": [],
  "sensitivity": "public|internal|confidential|restricted",
  "review_status": "verified|needs-legal-review|needs-engineering-review",
  "tags": []
}
```

## 5. Retrieval priority

For “what does the product do?” queries:

1. `product-current`
2. `engineering-current`
3. `gap-audit`
4. `requirements`

For “what should the product eventually do?” queries:

1. `requirements`
2. `gap-audit`
3. `product-current`

For Saudi statutory queries:

1. Official primary source URL/content where licensed and captured
2. `statutory`
3. `gap-audit`
4. PRD only as a product requirement, never legal authority

A newer effective-dated official rule outranks an older official rule. Never rank by embedding similarity alone when effective dates or authority differ.

## 6. Answer policy

### Product answers

- State status: Implemented, Operational demo, Mock integration, or PRD-only.
- Cite document path/heading.
- If code and PRD conflict, say so and prefer current verified code for “what works now.”
- Do not promise external connectivity without verified production evidence.

### Legal/statutory answers

- Identify audience: Saudi citizen, non-Saudi worker, employer, dependant, candidate, or special cohort.
- State applicability and effective date.
- Cite authoritative source URL and article/service/rule where available.
- Distinguish statutory minimum from company policy.
- Identify uncertainty/sector dependence.
- Add: “Confirm current applicability with the competent authority or qualified Saudi adviser.”
- Never calculate a real employee’s payroll/termination amount from incomplete facts.

### Role/access answers

- Cite capability and route/procedure behavior separately.
- Hidden UI is not authorization proof.
- Mention current fine-grained role enforcement gaps where relevant.

## 7. Query decomposition

For complex questions, split into:

1. worker nationality/cohort;
2. establishment activity/size/location;
3. employment/contract/separation type;
4. applicable date/rule version;
5. product module and implementation status;
6. required evidence/action/deadline;
7. unresolved legal or integration dependency.

Example: “How much GOSI for this employee?” must retrieve nationality, registration/cohort date, contributory wage components, payroll period/effective date, cap, branch rates, and employer/employee split. If any are absent, ask rather than guess.

## 8. Safety filters

Reject or redact:

- passwords, secrets, tokens, keys, connection strings;
- unmasked National ID, Iqama, passport, IBAN, health data;
- employee-relations case details outside authorized roles;
- named salary/performance/talent-risk data without authorization;
- candidate background-check data without purpose/scope;
- cross-tenant retrieval.

Log access to restricted knowledge with user, tenant, purpose, chunk IDs, time, and result classification.

## 9. Evaluation set

Maintain question/expected-citation tests for:

- four role permissions;
- employee payroll denial;
- company onboarding status;
- mock government integration disclosure;
- Saudi vs non-Saudi GOSI branches;
- SANED/occupational hazards;
- annual/sick/maternity/paternity/Hajj/bereavement leave;
- Ramadan hours and overtime;
- EOSB by service and separation reason;
- WPS/Mudad obligations;
- health insurance and dependants;
- work permits/Iqama/visa costs;
- Nitaqat sector/size dependency;
- PDPL rights, breach/cross-border obligations;
- “PRD says X; is it implemented?” conflict questions.

Pass criteria:

- correct authority and status;
- no uncited legal formula;
- no citizen/non-citizen blending;
- no superseded-rate answer;
- no mock/live confusion;
- no sensitive-data leakage.

## 10. Update workflow

1. Detect statutory/product/code change.
2. Update canonical document with source/effective date.
3. Mark superseded chunk `effective_to` rather than deleting audit history.
4. Re-chunk only changed documents.
5. Rebuild embeddings/index.
6. Run citation/status/effective-date evaluation set.
7. Obtain legal review for statutory changes and engineering review for implementation claims.
8. Publish with version and rollback marker.
