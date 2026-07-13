# Saudi HR, Payroll, Insurance, Immigration, and Statutory Requirements

**Research position:** 13 July 2026
**Jurisdiction:** Kingdom of Saudi Arabia, ordinary private-sector employment
**Primary law baseline:** Saudi Labor Law as amended effective 19 February 2025; Social Insurance Law transition effective from 3 July 2024; current authority/service rules through the research date

> This is a product requirements synthesis, not legal, tax, immigration, insurance, or payroll advice. Domestic workers and other excluded/specially regulated categories require separate workflows. Confirm current applicability with MHRSD, GOSI, Qiwa, Mudad, CHI, ZATCA, SDAIA, Jawazat/MOI, and qualified Saudi advisers before production use.

## 1. Applicability and worker classification

An HRMS must classify the worker before selecting a rule. Never infer nationality, religion, disability, or right-to-work status from name, language, residence, or place of birth.

| Cohort | Employment/right-to-work | Social insurance | Immigration | Saudization |
|---|---|---|---|---|
| Saudi citizen | No work visa, work permit, or Iqama; ordinary contract may be fixed or indefinite | Saudi pension/annuities, SANED where applicable, occupational hazards; legacy/new entrant split | Not applicable | Counts only when current GOSI wage, employment type, contract, profession, accreditation, and anti-fraud rules are satisfied |
| Saudi new social-insurance entrant | Same employment status | New 2024-law annuity rate phase plus SANED and occupational hazards | Not applicable | Same conditional counting rules |
| Ordinary non-Saudi worker | Legal entry, work visa, MHRSD work permit, Iqama, authorized occupation and employer relationship | Generally employer-paid occupational hazards only | Full visa/work-permit/Iqama/profession/mobility/exit lifecycle | Usually denominator; cannot work in Saudi-reserved professions |
| GCC national | Right-to-work and identity handling differ from ordinary expatriates | GCC insurance-protection extension may apply home-state rules/rates/limits | Do not treat automatically as ordinary non-Saudi | Current Qiwa/Nitaqat rules determine counting |
| Domestic/specially regulated worker | Separate Labor Law applicability/workflow | Cohort-specific | Usually Musaned/Absher rather than ordinary Qiwa workflow | Separate rules |

Labor Law Article 7 exclusions/special cases include domestic workers, some agricultural/private-herder work, specified employer-family-only establishments, sports players/coaches, and certain non-Saudis performing a specific task for no more than two months.

## 2. Employment contracts and Qiwa

### Core contract requirements

- Arabic contract text is mandatory and prevails over a translation.
- Contract should be written in two copies and documented through prescribed procedures using the Ministry model.
- Core data include employer, worker identity/nationality/address, wage and allowances, work/type/location, start date, term, and basic rights/obligations.
- Non-Saudi contracts must be written and fixed-term. Under the amended rule, if no term is stated, one year from actual start applies and renews for a similar term if work continues.
- Saudi contracts may be fixed or indefinite subject to the law.
- Contract amendments, acceptance/rejection, effective dates, and versions require evidence.

### Qiwa documentation

MHRSD announcements set establishment contract-documentation compliance targets at:

- 85% from 30 April 2026;
- 90% by 30 June 2026.

From 15 April 2026, Saudi employees count in Nitaqat calculations based on electronically documented Qiwa contracts. Treat 90% as a compliance indicator—not permission to leave other contracts undocumented.

### HRMS controls

- Arabic master plus bilingual rendering.
- Required-field and nationality/term validation.
- Qiwa contract ID, version, worker decision, timestamps, amendment history, effective date, rejection reason.
- Difference report: contract wage/occupation/location versus payroll, GOSI, work permit, Iqama, and actual assignment.
- Contract expiry, renewal, notice, resignation, and transfer clocks.

## 3. Probation

- Must be expressly stated and duration specified.
- Total probation cannot exceed 180 days.
- Both parties may terminate during valid probation.
- Generally no compensation or EOSB for the probation period.
- A second probation with the same employer requires different work/profession or at least six months since the previous relationship, plus written agreement.
- Current Executive Regulations determine which leave does not count toward probation; do not invent exclusions.

Controls: hard 180-day limit, prior-employment lookup, contract clause evidence, excluded-day ledger, milestone reviews, extension/termination approval.

## 4. Working time, rest, Ramadan, and overtime

| Requirement | Rule | HRMS control |
|---|---|---|
| Ordinary maximum | 8 actual hours/day or 48/week | Daily/weekly thresholds and approved exceptions |
| Muslim workers in Ramadan | 6 hours/day or 36/week | Religion-sensitive confidential rule, Ramadan calendar, effective shift schedule |
| Consecutive work | No more than 5 hours without at least 30-minute prayer/meal/rest break | Break compliance alert |
| Workplace span | Generally no more than 12 hours | First-entry/last-exit spread control |
| Weekly rest | Friday by default; substitute requires notification and religious accommodation; at least 24 consecutive paid hours; not cash-replaceable | Weekly-rest ledger, substitution evidence |
| Exceptional hours | Generally no more than 10/day or 60/week | Exception reason/approval; current annual ceiling requires subordinate-instrument verification |
| Holidays | Work during official holidays/vacations is overtime | Versioned Saudi holiday calendar |

### Overtime formula

The Labor Law formulation should be represented as:

\[
\text{overtime-hour pay}
=
\text{ordinary hourly actual wage}
+
50\% \times \text{basic hourly wage}
\]

Do not reduce it to “1.5 × basic hourly wage” where actual wage includes other regular elements. The amended law permits paid compensatory leave instead of cash overtime with employee agreement and regulatory conditions. Store consent, earned hours, conversion, expiry, use, and balance.

## 5. Statutory leave

| Leave | Minimum rule | Automation |
|---|---|---|
| Annual | 21 paid days/year; at least 30 after 5 consecutive years; paid in advance; ordinarily taken in due year; employer notice at least 30 days | Tenure tier, advance pay, scheduling notice, written carryover/postponement consent, exit payout |
| Sick | Rolling year from first sick leave: 30 days full pay, 60 days at 75%, 30 days unpaid; continuous/intermittent | Rolling bucket and tiered payroll; termination protection until entitlement exhausted |
| Marriage | 5 paid days | Event date and proof |
| Bereavement | 5 paid days for spouse/ascendant/descendant; 3 for sibling | Relationship validation and event-based counter |
| Childbirth for worker | 3 paid days within 7 days of birth | Birth date and window |
| Hajj | 10–15 paid days including Eid al-Adha; once in service; after 2 consecutive years; worker has not previously performed Hajj | One-time flag, service eligibility, annual allocation |
| Examination | Paid actual exam days where enrollment approved and year not repeated; repeated year unpaid; otherwise annual then unpaid; request 15 days in advance | Enrollment approval, repeat year, evidence, deadline |
| Unpaid | By agreement; contract suspended if over 20 days unless parties agree otherwise | Consent and suspension trigger |
| Maternity | 12 weeks fully paid; 6 weeks post-delivery mandatory; remaining 6 distributable starting up to 4 weeks before expected birth; additional unpaid month available | Expected/actual birth dates, mandatory block, extension |
| Child requiring continuous accompaniment | One paid month plus one unpaid month after maternity leave for sick/disabled child meeting rule | Medical evidence and linked extension |
| Nursing | Paid breaks totaling no more than 1 hour/day, additional to ordinary breaks and counted as work | Attendance entitlement |
| Muslim widow | At least 4 months 10 days fully paid; pregnancy may extend unpaid until delivery | Religion-sensitive rule, death/pregnancy dates |
| Non-Muslim widow | 15 paid days | Religion-sensitive rule |
| Official holidays | Paid as specified in regulations; work is overtime | Effective-dated calendar; exact current durations must come from regulations |

Unused accrued annual leave is paid on exit. Statutory minimum and company-enhanced policy must remain separate and effective-dated.

## 6. Wages, payment timing, and deductions

### Payment frequency

- Monthly-paid worker: at least monthly.
- Daily-paid worker: at least weekly.
- Piecework over two weeks: weekly proportional advances, balance in following week.
- Other workers: at least weekly.
- Use approved Saudi banking channels and comply with contract/WPS requirements.

### Deduction controls

Deductions without separate written consent are limited to statutory categories. Controls include:

- qualifying employer loan recovery generally no more than 10% of wage;
- worker-caused damage deduction generally no more than five days’ wage in a month unless authorized otherwise;
- ordinary judicial debt generally no more than one-quarter, except maintenance/family support;
- total deductions/attachments generally no more than 50% unless labor court decides otherwise;
- employee GOSI/SANED portion only—never employer pension, SANED, occupational-hazard contribution, recruitment, work permit, Iqama, mandatory base insurance, or employer-delay penalties.

Unlawful deduction or delayed wage can lead to payment orders and a fine up to twice the deducted/delayed amount.

## 7. GOSI and SANED

### 7.1 Contributory wage

For ordinary private-sector payroll, parameterize:

\[
B = \min(45{,}000,\;
\text{basic wage}
+ \text{cash housing}
+ \text{covered commission/profit/sales percentage}
+ \text{in-kind housing valuation})
\]

Employer-provided housing is generally valued annually at two months’ basic wage (monthly equivalent basic/6), subject to GOSI exceptions. Transport and reimbursements are not automatically contributory. Store contributory wage separately from contractual gross, WPS earnings, and EOSB last wage.

The SAR 45,000 monthly ceiling is supported by current official materials. Minimum bases should be configuration, not permanent constants.

### 7.2 Legacy Saudi contributors

Applies to Saudis with a civil-pension/GOSI contribution period before 3 July 2024, subject to transition rules.

| Branch | Employee | Employer |
|---|---:|---:|
| Annuities | 9.00% | 9.00% |
| SANED | 0.75% | 0.75% |
| Occupational hazards | — | 2.00% |
| **Total** | **9.75%** | **11.75%** |

### 7.3 New Saudi entrants

Applies to people with no prior covered contribution period before 3 July 2024. Annuity contributions phase from 9% each to 11% each in 0.5-point annual stages.

| Stage | Employee annuity | Employer annuity |
|---|---:|---:|
| Initial | 9.0% | 9.0% |
| Second | 9.5% | 9.5% |
| July 2026 implementation-cycle expectation | 10.0% | 10.0% |
| Next | 10.5% | 10.5% |
| Final | 11.0% | 11.0% |

Add SANED 0.75% each and employer occupational hazards 2%. For the July 2026 expected stage this produces 10.75% employee and 12.75% employer total.

> **Transition uncertainty:** the decree uses elapsed 12-month stages and “the month following.” Around July/August transitions, use the effective rate returned on the GOSI invoice/API for the contribution month rather than deriving only from hire date.

### 7.4 Ordinary non-Saudi workers

| Branch | Employee | Employer |
|---|---:|---:|
| Pension/annuities | — | — |
| SANED | — | — |
| Occupational hazards | — | 2.00% |

Occupational-hazard coverage applies regardless of nationality. GCC nationals require a separate home-state coordination regime.

### 7.5 Reporting/payment

- Employer remits both portions and deducts only employee portions.
- Contributions are normally payable during first 15 days of following month.
- Late-payment fine: 2% of overdue contributions for each month or part-month delayed under the cited rule.
- Store invoice/API rate, base, branch split, employee/employer amounts, payment/reference, correction, and inspection evidence.

## 8. WPS and Mudad

- WPS is administered through Mudad’s Compliance System for covered private establishments.
- From 1 March 2025, the allowed upload window was reduced to 30 days.
- File controls include establishment bank/SARIE ID, establishment identifiers/debit account, SAR currency, payment/value date, unique reference, totals, and employee-level identity/IBAN/name/bank/basic/housing/other earnings/deductions/net.
- Processed output needs bank transaction reference, status, failure reason/date, and digital signature.

Reconciliation:

\[
\text{net} = \text{basic} + \text{housing} + \text{other earnings} - \text{deductions}
\]

\[
\text{header total} = \sum \text{employee net transactions}
\]

Retain source file, bank-sealed/processed result, individual transaction outcomes, Mudad acceptance/rejection, justifications, and corrective resubmission. The official 2017 technical PDF remains useful for structural controls but contains obsolete narrative examples; combine it with current contribution rules and live Mudad validation.

## 9. Bank and IBAN controls

- Saudi IBAN: 24 uppercase characters beginning `SA`, with checksum validation.
- Match National ID/Iqama, account name, and payroll master.
- Authenticated change request, maker-checker, independent verification, before/after audit.
- Effective date/cutoff control.
- Duplicate IBAN/identity alerts.
- Unique file reference and total reconciliation.
- Reconcile payroll → bank acceptance → employee transaction → Mudad acceptance.
- Reprocess failures without duplicating successes.
- Segregate preparation, release, bank approval, and Mudad upload.

## 10. Mandatory cooperative health insurance

Covered private-sector Saudi and non-Saudi employees and eligible dependants require compliant cooperative health coverage under the applicable law, Executive Regulations, and unified policy.

Product records need:

- insurer, policy, network/class, member ID;
- employee/dependant relationship and identity;
- sponsorship/family status where relevant;
- effective/expiry/cancellation dates;
- enrollment and CHI status;
- premium payer and optional-upgrade authorization;
- additions/deletions and reconciliation to Qiwa/GOSI headcount.

Do not deduct mandatory base premium from the employee. Do not cancel coverage merely because final payroll was processed or during a period in which coverage remains legally required. Working dependants are generally handled through their own employer rather than duplicated, subject to current policy terms.

CHI portal retrieval timed out in this research environment; dependent age/category details must be checked against the current unified policy before encoding.

## 11. Nitaqat and occupation-specific Saudization

### Nitaqat Mutawar 2026–2028

- Assessment is activity-, size-, year-, and band-specific.
- Thresholds vary for 2026, 2027, and 2028 and may use logarithmic curves.
- Entity/combined-branch average Saudi workers versus average total workforce is relevant.
- Qiwa/Nitaqat result is operational authority; a universal `Saudi headcount ÷ total` formula is insufficient.
- Green/Platinum access and Red restrictions depend on separate service conditions.
- Occupation-specific localization applies in parallel.

### Counting eligibility

A Saudi record does not automatically equal one full unit. Evaluate GOSI wage, employment form, duplication, occupation-specific wage, accreditation, actual duties, and anti-fictitious-employment rules. Historical general SAR 4,000/3,000 counting thresholds must remain configurable and reconciled to Qiwa.

### Material examples in force by July 2026

Examples include administrative-support 100%; marketing and sales 60% under covered thresholds; procurement 70%; technical/professional engineering rules; dentistry, pharmacy, accounting, specified health professions, and tourism rules with profession/size/wage/accreditation/effective-date conditions. Do not copy these examples into a universal engine. Import current procedural tables/SSCO codes and reconcile to Qiwa.

## 12. Non-Saudi immigration and employment lifecycle

### Normal lifecycle

1. Establishment eligibility, activity licenses, Nitaqat/service status, visa balance.
2. Work visa allocation/issuance and consular processing.
3. Arrival, medical/insurance/biometric requirements.
4. Qiwa employment contract.
5. MHRSD work permit.
6. Iqama through Jawazat channel, typically Muqeem/Absher Business.
7. Ongoing permit, Iqama, insurance, passport, occupation, wage, accreditation, Qiwa/GOSI/WPS alignment.
8. Transfer/mobility, exit-re-entry, final exit, termination settlement and evidence.

A tourist/business-visit visa is not work authorization. Actual duties must match the authorized profession. Work for another employer/own account requires an approved mechanism such as transfer or Ajeer.

### Platform boundaries

- Qiwa/MHRSD: labor market, contracts, visas, permits, transfer, occupations, Nitaqat.
- Muqeem/Jawazat: residency/passport/visa transactions and reports.
- Absher Business/Individuals: related employer/individual MOI services.
- Musaned: domestic-worker workflows.
- Ajeer: authorized temporary/outsourced arrangements.
- GOSI: insurance/contributory wage.
- Mudad/bank: wage protection.

Portal credentials/browser automation are not lawful API authorization. Where approved API access is absent, use human task queues, export/import, evidence, four-eyes approval, and reconciliation—never credential sharing or scraping.

### Costs

Employer ordinarily bears recruitment, Iqama/work-permit issuance/renewal, employer-delay penalties, profession change, exit/re-entry, receiving-employer transfer, and return-ticket costs under Article 40 rules. Store actual Qiwa/Jawazat invoices as effective-dated evidence; amounts change.

## 13. Termination, resignation, notice, and EOSB

### Notice

For indefinite contracts with legitimate written reason:

- monthly-paid worker resignation: at least 30 days;
- employer termination of monthly-paid worker: at least 60 days;
- non-monthly-paid: at least 30 days by either party;
- unserved notice produces wage-equivalent compensation unless validly agreed otherwise.

Employer notice gives paid job-search time of one day/week or eight hours/week.

### Fixed-term resignation

Written, unconditional, uncoerced request. Accepted when employer accepts or after 30 days without response. Employer may postpone up to 60 days with written work-interest reasons provided before the initial 30-day expiry. Worker can withdraw within seven days unless accepted. Contract continues meanwhile.

### EOSB formula

Let `W` be last qualifying monthly wage and `Y` eligible service years including fractions:

\[
\text{full EOSB}
=0.5W\times\min(Y,5)+W\times\max(Y-5,0)
\]

Prorate fractions. Resignation share:

| Service | Share of full EOSB |
|---|---:|
| Under 2 years | 0% |
| 2–5 years | 1/3 |
| More than 5 but under 10 | 2/3 |
| 10+ years | 100% |

Full entitlement exceptions include force majeure and qualifying resignation related to marriage/childbirth. Article 80 forfeiture requires strict legal grounds/evidence and worker opportunity to object. Commission/variable-element exclusions require valid agreement under Article 86.

Separate EOSB from unpaid salary, leave payout, overtime/commission, notice indemnity, and Article 77 compensation.

### Settlement deadlines

- Employer-initiated/other termination: generally within one week.
- Worker-initiated: generally within two weeks.
- Free service certificate on request and return deposited documents.
- Non-Saudi return/repatriation workflow where applicable.

## 14. Discipline, equality, special protections

### Discipline

Permitted sanctions are controlled by law/work rules. Charge and investigation require written evidence; worker has defense/grievance rights. Core clocks include 30 days from discovery to charge, 30 days after investigation to sanction, 30-day internal grievance, 15-day employer response, then 30-day labor-court window. Fine/suspension limits and a dedicated fines register apply.

### Equality/disability

No discrimination based on protected characteristics including race, color, sex, age, disability, marital status, and other forms. Employers with 25+ workers whose work permits it must meet the cited 4% professionally qualified disability-employment rule and reporting requirement. Work-injured reduced-capacity workers require suitable redeployment where able.

### Women

Pregnancy/maternity dismissal protection, nursing breaks, medical care, widow leave, seats, and childcare/nursery thresholds apply. Product must not expose pregnancy/religion/health details beyond need-to-know roles.

### Juveniles

Age, hazardous work, night work, working-hour, break, holiday/rest-day, medical/guardian, notification, and special-register controls are required. Under-15 employment is generally prohibited, with limited 13–15 light-work permission under ministerial rules.

## 15. Tax and ZATCA

- No personal income tax/PAYE withholding on ordinary employee salary.
- Salary, overtime, employment bonus/commission, and EOSB are ordinarily outside VAT scope—not zero-rated.
- Payslips are not VAT invoices merely because employer is registered.
- Review expense reimbursements, private benefits/deemed supplies, salary sacrifice, employee recoveries, secondment/group recharges separately.
- Intercompany/non-resident payroll services may create VAT or withholding-tax obligations depending on characterization/treaty.
- Standard VAT is 15% where applicable.
- WHT, where applicable to non-resident payments, is generally due within first 10 days of following month; rate depends on legal characterization.

## 16. PDPL, privacy, residency, and security

PDPL applies to employee/applicant data processed in Saudi Arabia and processing outside Saudi Arabia relating to individuals residing in the Kingdom.

Required capabilities include:

- lawful purpose/basis and clear privacy notices;
- minimization, accuracy, correction;
- access/copy/correction/destruction rights;
- processor/subprocessor contracts and ROPA;
- retention schedules, legal holds, secure destruction;
- breach assessment and 72-hour authority notification where threshold is met;
- DPIA for high-risk processing;
- sensitive-data controls for health, biometric, criminal and similar data;
- cross-border transfer assessment/documentation.

PDPL does not impose a universal Saudi-hosting rule. Cross-border transfer needs the statutory basis/safeguard/necessity/proportionality analysis. Sector, government contract, NCA controls, critical infrastructure, health, finance, telecom, defense, or classification may impose stricter localization/security.

## 17. Records, inspections, and penalties

Maintain regulation-prescribed workplace records plus disciplinary files, fines register, juvenile records, occupational medical/safety evidence, worker/nationality/work-permit lists, hours/rest schedules, payroll/GOSI/WPS/insurance evidence, government submissions, and PDPL records.

No single universal HR-record retention period was established. Use a record-class matrix across labor, GOSI, WPS, tax, commercial, PDPL, limitation, litigation, and legal-hold requirements. Do not turn the research recommendation of long payroll retention into an uncited universal statutory minimum.

Inspectors may enter during working hours without notice, interview, inspect/copy records, and require safety corrections. General violations may reach SAR 100,000, closure, multiplication by affected persons, and doubling for repeats; exact current violation schedules must be imported and effective-dated.

## 18. Authoritative sources

URLs were retrieved/probed on 13 July 2026 unless noted.

### Labor law

- [MHRSD current Labor Law](https://www.hrsd.gov.sa/en/knowledge-centre/%D9%86%D8%B8%D8%A7%D9%85-%D8%A7%D9%84%D8%B9%D9%85%D9%84)
- [MHRSD Labor relations, Articles 50–88](https://www.hrsd.gov.sa/en/node/5576001)
- [MHRSD hours/rest/leave, Articles 89–118](https://www.hrsd.gov.sa/en/node/5576008)
- [MHRSD non-Saudi employment, Articles 32–41](https://www.hrsd.gov.sa/en/node/5575987)
- [MHRSD women protections](https://www.hrsd.gov.sa/en/node/5576027)
- [MHRSD juveniles](https://www.hrsd.gov.sa/en/node/5576029)
- [MHRSD inspections](https://www.hrsd.gov.sa/en/node/5576043)
- [MHRSD penalties](https://www.hrsd.gov.sa/en/node/5576057)
- [Official 2025 amendment comparison PDF](https://www.hrsd.gov.sa/sites/default/files/2025-03/Amendments%20to%20Labor%20Law%20Articles_0.pdf)
- [Executive Regulations landing page](https://www.hrsd.gov.sa/knowledge-centre/decisions-and-regulations/regulation-and-procedures/%D8%A7%D9%84%D9%84%D8%A7%D8%A6%D8%AD%D8%A9-%D8%A7%D9%84%D8%AA%D9%86%D9%81%D9%8A%D8%B0%D9%8A%D8%A9-%D9%84%D9%86%D8%B8%D8%A7%D9%85-%D8%A7%D9%84%D8%B9%D9%85%D9%84-%D9%88%D9%85%D9%84%D8%AD%D9%82%D8%A7%D8%AA%D9%87%D8%A7)

### GOSI/payroll/WPS

- [GOSI employer journey](https://awareness.gosi.gov.sa/businessJourney.html)
- [GOSI new-law awareness](https://awareness.gosi.gov.sa/)
- [Official English Social Insurance Law PDF via MISA](https://misa.gov.sa/app/uploads/2025/07/Social-Insurance-Law.pdf)
- [GOSI contribution guidance](https://www.gosi.gov.sa/GOSIOnline/Contribution_&locale=en_US)
- [GCC insurance protection](https://www.gosi.gov.sa/GOSIOnline/Law_of_Insurance_Protection&locale=en_US)
- [HRSD Wage Protection service](https://www.hrsd.gov.sa/en/ministry-services/services/%D8%B1%D9%81%D8%B9-%D9%85%D9%84%D9%81-%D8%AD%D9%85%D8%A7%D9%8A%D8%A9-%D8%A7%D9%84%D8%A3%D8%AC%D9%88%D8%B1)
- [Mudad](https://mudad.com.sa/)
- [WPS technical specification PDF](https://www.hrsd.gov.sa/sites/default/files/2017-06/WPS%20Wages%20File%20Technical%20Specification.pdf)

### Nitaqat/immigration

- [2026 Nitaqat Mutawar procedural guide PDF](https://www.hrsd.gov.sa/sites/default/files/2026-03/ntaqat-almtwr.pdf)
- [Qiwa Nitaqat overview](https://www.qiwa.sa/en/business-owners/manage-establishment/what-nitaqat-and-how-it-calculated)
- [Qiwa work permits](https://www.qiwa.sa/en/business-owners/hire-employees/how-issue-or-renew-work-permits)
- [Qiwa employee transfer](https://www.qiwa.sa/en/service-overview/business-owners/hire-employees/employee-transfer)
- [Qiwa occupation management](https://www.qiwa.sa/en/service-overview/business-owners/manage-current-employees/occupation-management)
- [Muqeem](https://muqeem.sa/)
- [Absher](https://www.absher.sa/portal/landing.html)
- [Musaned](https://www.musaned.com.sa/)

### Insurance/tax/privacy

- [Council of Health Insurance](https://www.chi.gov.sa/en/) — portal timed out from research environment; verify current unified policy directly
- [ZATCA VAT rules](https://zatca.gov.sa/en/RulesRegulations/Taxes/Pages/VATLaw.aspx)
- [ZATCA income tax/WHT](https://zatca.gov.sa/en/RulesRegulations/Taxes/Pages/IncomeTax.aspx)
- [SDAIA PDPL knowledge center](https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter)
- [NCA regulatory documents](https://nca.gov.sa/en/regulatory-documents/) — portal timed out from research environment

## 19. Unresolved legal-research items

Obtain specialist confirmation before encoding:

1. Current Executive Regulations/attachments for exact public-holiday entitlements.
2. Probation leave exclusions.
3. Compensatory-time conversion details and annual overtime ceiling.
4. Current violation schedule by offense.
5. Record-class retention periods.
6. Exact July/August 2026 new-GOSI transition invoice behavior.
7. Current CHI unified-policy dependant definitions/age limits and employer allocation.
8. Every tenant’s current Nitaqat activity coefficients and occupation-specific tables.
9. Sector/contract-specific cybersecurity and data-localization obligations.
