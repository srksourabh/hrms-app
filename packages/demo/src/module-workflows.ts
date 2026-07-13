export type DemoWorkflowRole = "hr_manager" | "department_manager" | "hr_specialist" | "employee";

export interface DemoWorkflow {
  title: string;
  summary: string;
  mode: "demo" | "mock";
  allowedRoles: readonly DemoWorkflowRole[];
  metrics: readonly { label: string; value: string; detail: string }[];
  records: readonly { title: string; detail: string; status: string }[];
  actions: readonly { id: string; label: string; result: string }[];
}

const adminRoles: DemoWorkflowRole[] = ["hr_manager", "department_manager", "hr_specialist"];
const allRoles: DemoWorkflowRole[] = [...adminRoles, "employee"];
const metric = (label: string, value: string, detail: string) => ({ label, value, detail });
const record = (title: string, detail: string, status: string) => ({ title, detail, status });
const action = (id: string, label: string, result: string) => ({ id, label, result });

export const demoWorkflows: Record<string, DemoWorkflow> = {
  "people-organization": {
    title: "People & organization operations",
    summary: "Maintain the five-person workforce, reporting lines, departments, branches, and bilingual employee records.",
    mode: "demo", allowedRoles: adminRoles,
    metrics: [metric("Employees", "5", "4 active · 1 notice period"), metric("Branches", "2", "Riyadh · Dhahran"), metric("Saudization", "80%", "High Green")],
    records: [record("Omar Al-Dossary", "Field Engineer · Dhahran", "Active"), record("Priya Menon", "HSE Data Analyst · controlled exit", "Notice period")],
    actions: [action("add-employee", "Create employee draft", "Employee draft RES-1006 created for review."), action("export-directory", "Export directory", "Bilingual employee directory prepared as CSV.")],
  },
  "company-onboarding": {
    title: "Company onboarding",
    summary: "Configure legal identity, branches, work patterns, payroll controls, roles, and product branding.",
    mode: "demo", allowedRoles: ["hr_manager"],
    metrics: [metric("Setup", "92%", "11 of 12 checks complete"), metric("Branches", "2", "Both geocoded"), metric("Roles", "4", "Admin, HR, manager, employee")],
    records: [record("Rukn Energy Services", "CR DEMO-CR-2050 · Saudi regulatory context", "Verified demo"), record("Payroll controls", "GOSI and WPS validation rules", "Ready")],
    actions: [action("validate-setup", "Run setup validation", "Company setup validated; one optional bank approval remains."), action("save-brand", "Save brand profile", "Tenant brand profile saved to the demo workspace.")],
  },
  "payroll-settlement": {
    title: "Payroll & final settlement",
    summary: "Review June payroll, resolve the joining allowance anomaly, generate payslips, and prepare settlement outputs.",
    mode: "demo", allowedRoles: ["hr_manager", "hr_specialist"],
    metrics: [metric("Employees", "5", "All included"), metric("Readiness", "96%", "1 low-risk anomaly"), metric("Net payroll", "SAR 123,124", "June 2026")],
    records: [record("June 2026 payroll", "Five bilingual payslips", "Ready for approval"), record("Omar joining allowance", "First full payroll cycle", "Review")],
    actions: [action("resolve-anomaly", "Confirm joining allowance", "Allowance confirmed; payroll readiness advanced to 100%."), action("generate-payslips", "Generate payslips", "Five demo payslips generated with Taāzur branding.")],
  },
  "time-leave-attendance": {
    title: "Time, leave & attendance",
    summary: "Monitor daily presence, field rotations, exceptions, balances, and manager approvals.",
    mode: "demo", allowedRoles: allRoles,
    metrics: [metric("Present", "4", "13 July 2026"), metric("Exceptions", "1", "Approved leave"), metric("Pending", "1", "Manager approval")],
    records: [record("Aisha Al-Otaibi", "Checked in 08:31 · Riyadh", "Late"), record("Priya Menon", "Annual leave · 13–14 July", "Approved")],
    actions: [action("approve-leave", "Approve pending leave", "Omar's personal leave approved and balance updated."), action("correct-time", "Record time correction", "Attendance correction draft created for manager review.")],
  },
  "documents-certificates": {
    title: "Documents & certificates",
    summary: "Manage contracts, identity records, certificates, expiry alerts, and controlled employee access.",
    mode: "demo", allowedRoles: allRoles,
    metrics: [metric("Documents", "6", "Across five employees"), metric("Expiring", "2", "Within 60 days"), metric("Missing", "0", "Required set complete")],
    records: [record("Operational safety leadership", "Fahad · expires 22 Aug", "Expiring soon"), record("Resident identity", "Priya · expires 10 Sep", "Expiring soon")],
    actions: [action("upload-document", "Upload document", "Encrypted demo document added with expiry tracking."), action("send-reminder", "Send expiry reminder", "Two bilingual reminder emails queued.")],
  },
  "notifications-reports": {
    title: "Notifications & reports",
    summary: "Build bilingual scheduled reports and deliver role-aware alerts through email, in-app, and export channels.",
    mode: "demo", allowedRoles: adminRoles,
    metrics: [metric("Reports", "8", "Operational templates"), metric("Scheduled", "3", "Weekly and monthly"), metric("Delivery", "100%", "Last demo run")],
    records: [record("Workforce snapshot", "Every Sunday · HR leadership", "Scheduled"), record("Payroll variance", "Monthly · Payroll team", "Ready")],
    actions: [action("run-report", "Generate workforce report", "Taāzur-branded workforce report generated with five employee rows."), action("schedule-report", "Schedule report", "Report scheduled for Sunday 08:00 AST.")],
  },
  recruitment: {
    title: "Recruitment pipeline",
    summary: "Move a fictional candidate from requisition through interview, offer, and onboarding handoff.",
    mode: "demo", allowedRoles: adminRoles,
    metrics: [metric("Open roles", "1", "Senior Drilling Engineer"), metric("Candidates", "1", "Technical interview"), metric("Score", "88", "Panel assessment")],
    records: [record("Sara Al-Mutairi", "Technical interview · 15 July", "In progress"), record("Draft offer", "SAR 21,000 basic · 16 Aug", "Draft")],
    actions: [action("advance-candidate", "Advance to offer", "Sara advanced to offer review; audit event recorded."), action("send-offer", "Send demo offer", "Bilingual demo offer prepared and notification queued.")],
  },
  onboarding: {
    title: "Employee onboarding",
    summary: "Coordinate contract, GOSI, induction, equipment, buddy, and manager milestones for new hires.",
    mode: "demo", allowedRoles: adminRoles,
    metrics: [metric("Progress", "78%", "Omar onboarding"), metric("Complete", "2", "Core tasks"), metric("Due", "1", "30-day check-in")],
    records: [record("Field safety induction", "Owned by HSE", "Complete"), record("30-day manager check-in", "Owned by Fahad", "Due")],
    actions: [action("complete-checkin", "Complete manager check-in", "Check-in completed; onboarding advanced to 100%."), action("assign-task", "Assign onboarding task", "Equipment handover task assigned to Operations IT.")],
  },
  offboarding: {
    title: "Offboarding & alumni",
    summary: "Run Priya's controlled exit, knowledge transfer, asset return, final settlement, interview, and archive.",
    mode: "demo", allowedRoles: adminRoles,
    metrics: [metric("Progress", "34%", "Last day 13 Aug"), metric("Open tasks", "3", "Cross-functional"), metric("Settlement", "Draft", "Payroll review pending")],
    records: [record("Knowledge-transfer dashboard", "Owned by Priya and Fahad", "In progress"), record("Exit interview", "10 Aug · Reem", "Scheduled")],
    actions: [action("complete-transfer", "Complete knowledge transfer", "Knowledge-transfer evidence attached and task completed."), action("calculate-settlement", "Calculate final settlement", "Demo settlement calculated with service and leave components.")],
  },
  "learning-skills": {
    title: "Learning & skills",
    summary: "Track role skills, certification gaps, development plans, and course progress.",
    mode: "demo", allowedRoles: allRoles,
    metrics: [metric("Skills", "14", "Across five profiles"), metric("Gap", "1", "Field certification"), metric("Learning", "40%", "Omar course progress")],
    records: [record("Advanced well-control fundamentals", "Omar · role-required", "In progress"), record("ISO 45001", "Priya · verified skill", "Current")],
    actions: [action("enroll-course", "Enroll in course", "Course enrollment created and manager notified."), action("verify-skill", "Verify skill", "Skill evidence marked verified in the demo profile.")],
  },
  "benefits-rewards": {
    title: "Benefits, rewards & recognition",
    summary: "Manage allowances, benefit enrollment, total rewards, and peer recognition.",
    mode: "demo", allowedRoles: allRoles,
    metrics: [metric("Benefit plans", "3", "Medical, life, wellbeing"), metric("Enrollment", "100%", "Five employees"), metric("Recognition", "1", "This month")],
    records: [record("Precision recognition", "Aisha · zero-error payroll checks", "Published"), record("Family medical plan", "Saudi employee tier", "Active")],
    actions: [action("send-recognition", "Send recognition", "Recognition published to the fictional employee feed."), action("compare-benefits", "Compare benefit options", "Personalized demo benefit comparison generated.")],
  },
  "government-integrations": {
    title: "Saudi government integration center",
    summary: "Exercise deterministic mock adapters for Qiwa, Mudad, GOSI, Muqeem, bank payroll, and ZATCA without claiming live authority access.",
    mode: "mock", allowedRoles: ["hr_manager", "hr_specialist"],
    metrics: [metric("Adapters", "6", "All mock mode"), metric("Healthy", "5", "One scope review"), metric("Audit", "100%", "Requests traceable")],
    records: [record("Qiwa contract check", "QIW-MOCK-260713-01", "Sandbox ready"), record("Mudad wage file", "MUD-MOCK-260713-01", "Validated")],
    actions: [action("mock-qiwa", "Run Qiwa contract check", "MOCK Qiwa response accepted; no authority system was contacted."), action("mock-mudad", "Validate Mudad file", "MOCK Mudad validation passed; no wage file was submitted."), action("mock-gosi", "Reconcile GOSI", "MOCK GOSI reconciliation completed with five employee rows.")],
  },
  "nitaqat-compliance": {
    title: "Nitaqat & compliance",
    summary: "Model Saudization, document risk, policy controls, and evidence-backed corrective actions.",
    mode: "demo", allowedRoles: adminRoles,
    metrics: [metric("Saudization", "80%", "High Green"), metric("Risks", "2", "Document expiries"), metric("Controls", "94", "Compliance score")],
    records: [record("Saudi headcount", "4 of 5 employees", "High Green"), record("Iqama expiry", "Priya · 10 Sep", "Monitor")],
    actions: [action("simulate-hire", "Simulate Saudi hire", "Scenario increases modeled Saudization to 83%."), action("create-control", "Create corrective action", "Expiry-renewal control assigned to HR Operations.")],
  },
  "ai-intelligence": {
    title: "AI workforce intelligence",
    summary: "Generate explainable demo insights from the fixture without sending employee records to an external provider.",
    mode: "demo", allowedRoles: adminRoles,
    metrics: [metric("Insights", "4", "Explainable recommendations"), metric("Confidence", "87%", "Demo scoring"), metric("Data sent", "0", "Local fixture mode")],
    records: [record("Payroll anomaly", "Review Omar joining allowance", "Actionable"), record("Retention signal", "Priya exit knowledge transfer", "High priority")],
    actions: [action("generate-brief", "Generate HR brief", "Executive brief generated from the fictional fixture only."), action("explain-insight", "Explain recommendation", "Evidence chain displayed with source records and confidence limits.")],
  },
  "performance-goals": {
    title: "Performance & goals",
    summary: "Manage objectives, check-ins, review cycles, calibration, and development outcomes.",
    mode: "demo", allowedRoles: allRoles,
    metrics: [metric("Cycle", "80%", "H1 2026 review"), metric("Goals", "2", "Active fixture goals"), metric("Overdue", "0", "All on track")],
    records: [record("Field certification", "Omar · 65%", "On track"), record("Zero-error Mudad", "Aisha · 92%", "On track")],
    actions: [action("add-checkin", "Record check-in", "Check-in note saved to the employee goal timeline."), action("complete-review", "Submit review", "Demo review submitted to calibration.")],
  },
  "engagement-retention": {
    title: "Engagement & retention",
    summary: "Run pulse surveys, inspect themes, track eNPS, and create evidence-based retention actions.",
    mode: "demo", allowedRoles: adminRoles,
    metrics: [metric("eNPS", "+42", "Fictional pulse"), metric("Response", "80%", "4 of 5"), metric("Top score", "4.7", "Safety culture")],
    records: [record("Manager support", "4.4 / 5", "Strong"), record("Workload", "3.7 / 5", "Watch")],
    actions: [action("launch-pulse", "Launch pulse survey", "Five fictional invitations queued; no real email sent."), action("create-action", "Create retention action", "Workload review action assigned to Eastern Operations.")],
  },
  "travel-expenses": {
    title: "Travel & expenses",
    summary: "Submit receipts, apply policy checks, approve claims, and prepare reimbursement records.",
    mode: "demo", allowedRoles: allRoles,
    metrics: [metric("Claims", "2", "Current cycle"), metric("Pending", "SAR 620", "Field per diem"), metric("Approved", "SAR 1,840", "Travel")],
    records: [record("Dhahran–Riyadh travel", "Fahad · SAR 1,840", "Approved"), record("Field per diem", "Omar · SAR 620", "Pending")],
    actions: [action("submit-expense", "Submit expense", "Expense draft created with policy validation."), action("approve-expense", "Approve pending claim", "Field per diem approved for the next reimbursement cycle.")],
  },
  "employee-relations": {
    title: "Employee relations",
    summary: "Manage confidential cases, grievances, mediation, evidence, outcomes, and policy follow-up.",
    mode: "demo", allowedRoles: ["hr_manager", "hr_specialist"],
    metrics: [metric("Open cases", "1", "Restricted access"), metric("SLA", "2 days", "Within target"), metric("Overdue", "0", "No escalations")],
    records: [record("Work schedule clarification", "Restricted · owned by Reem", "Mediation")],
    actions: [action("add-case-note", "Add confidential note", "Encrypted demo case note added to the audit timeline."), action("resolve-case", "Record resolution", "Resolution draft created pending employee acknowledgement.")],
  },
  "mobile-self-service": {
    title: "Mobile self-service",
    summary: "Exercise employee tasks in a compact mobile-oriented preview: attendance, leave, payslip, documents, and approvals.",
    mode: "demo", allowedRoles: allRoles,
    metrics: [metric("Mobile tasks", "6", "Self-service actions"), metric("Alerts", "2", "Personal attention"), metric("Offline", "Ready", "Cached demo profile")],
    records: [record("Latest payslip", "June 2026", "Ready"), record("Personal leave", "20 July", "Pending")],
    actions: [action("mobile-checkin", "Demo mobile check-in", "Location-aware demo check-in recorded at Dhahran Base."), action("download-payslip", "Download payslip", "Personal demo payslip prepared for secure download.")],
  },
  "workflow-automation": {
    title: "Workflow automation",
    summary: "Design event-driven approvals, reminders, assignments, and audit trails without code.",
    mode: "demo", allowedRoles: ["hr_manager", "hr_specialist"],
    metrics: [metric("Automations", "4", "Three active"), metric("Runs", "27", "This month"), metric("Success", "96%", "One retry")],
    records: [record("Document expiry reminder", "60/30/7-day sequence", "Active"), record("New-hire onboarding", "Contract → induction → check-in", "Active")],
    actions: [action("run-automation", "Run expiry workflow", "Expiry workflow completed with two notifications and an audit record."), action("create-rule", "Create approval rule", "Rule draft created: expenses over SAR 2,000 require department manager.")],
  },
  "people-analytics": {
    title: "People analytics",
    summary: "Explore workforce, payroll, attendance, diversity, talent, and lifecycle metrics with drill-down evidence.",
    mode: "demo", allowedRoles: adminRoles,
    metrics: [metric("Headcount", "5", "Two branches"), metric("Saudi", "80%", "4 of 5"), metric("Payroll", "SAR 123K", "Net June payroll")],
    records: [record("Riyadh", "2 employees · People & Culture", "Stable"), record("Dhahran", "3 employees · Operations/HSE", "One planned exit")],
    actions: [action("export-analytics", "Export analytics pack", "Anonymized demo analytics workbook prepared."), action("save-view", "Save dashboard view", "Role-filtered dashboard view saved for HR leadership.")],
  },
  "integration-marketplace": {
    title: "Integration marketplace",
    summary: "Configure provider-neutral connections, test webhooks, inspect scopes, and review integration health.",
    mode: "demo", allowedRoles: ["hr_manager"],
    metrics: [metric("Connectors", "9", "Six mock authority adapters"), metric("Enabled", "6", "Demo tenant"), metric("Webhooks", "Healthy", "Last test passed")],
    records: [record("Microsoft Teams", "Interview and notification events", "Demo connected"), record("Supabase", "Postgres and storage boundary", "Configuration ready")],
    actions: [action("test-webhook", "Test webhook", "Demo webhook delivered and signature verified."), action("configure-connector", "Configure connector", "Provider-neutral connector draft saved; credentials remain environment-only.")],
  },
};
