import { taazurEnergyDemo } from "./taazur-energy";

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
const workforceCount = taazurEnergyDemo.employees.length;
const activeCount = taazurEnergyDemo.employees.filter((employee) => employee.status === "active").length;
const saudiCount = taazurEnergyDemo.employees.filter((employee) => employee.nationality === "saudi").length;
const projectCount = taazurEnergyDemo.projects.length;
const formatSar = (amount: number) => `SAR ${Math.round(amount).toLocaleString("en-SA")}`;

const workflowDefinitions: Record<string, DemoWorkflow> = {
  "people-organization": {
    title: "People & organization operations",
    summary: "Maintain the connected workforce, reporting lines, departments, branches, projects, and bilingual employee records.",
    mode: "demo", allowedRoles: adminRoles,
    metrics: [metric("Employees", String(workforceCount), `${activeCount} active · 1 notice period`), metric("Branches", String(taazurEnergyDemo.branches.length), "Riyadh · Dhahran · Jubail"), metric("Departments", String(taazurEnergyDemo.departments.length), `${projectCount} active/planned projects`)],
    records: [record("12 connected employee profiles", "5 departments · 3 branches · bilingual records", "Loaded"), record("Omar Al-Dossary", "Field Engineer · Dhahran · Jafurah project", "Active"), record("Priya Menon", "HSE Data Analyst · controlled exit", "Notice period")],
    actions: [action("add-employee", "Create employee draft", "Employee draft RES-1013 created for review."), action("export-directory", "Export directory", "Bilingual employee directory prepared as CSV.")],
  },
  "company-onboarding": {
    title: "Company onboarding",
    summary: "Configure legal identity, branches, work patterns, payroll controls, roles, and product branding.",
    mode: "demo", allowedRoles: ["hr_manager"],
    metrics: [metric("Setup", "100%", "7 guided steps complete"), metric("Branches", "3", "Riyadh, Dhahran, Jubail"), metric("Seed scope", "12 people", "5 departments · 4 projects")],
    records: [record("5 departments & 4 managers", "12 employees with reporting lines and cost centers", "Ready"), record("4 sample projects", "19 connected project assignments", "Ready"), record("3 payroll history months", "Salary, benefits, attendance, leave, assets, documents", "Ready")],
    actions: [action("validate-setup", "Run setup validation", "Company setup validated; one optional bank approval remains."), action("save-brand", "Save brand profile", "Tenant brand profile saved to the demo workspace.")],
  },
  "payroll-settlement": {
    title: "Payroll & final settlement",
    summary: "Review June payroll, resolve the joining allowance anomaly, generate payslips, and prepare settlement outputs.",
    mode: "demo", allowedRoles: ["hr_manager", "hr_specialist"],
    metrics: [metric("Employees", String(workforceCount), "All included"), metric("History", "3 months", "April–June 2026"), metric("Net payroll", formatSar(taazurEnergyDemo.payroll.net), "June 2026 fixture")],
    records: [record("June 2026 payroll", `12 employees · ${formatSar(taazurEnergyDemo.payroll.gross)} gross`, "Ready for approval"), record("Salary register", "Basic, housing, transport, project, overtime, bonus", "Loaded"), record("2 payroll checks", "Omar allowance · Ahmed loan acknowledgment", "Review")],
    actions: [action("resolve-anomaly", "Confirm project allowance", "Allowance confirmed; payroll readiness advanced to 100%."), action("generate-payslips", "Generate payslips", "Twelve demo payslips generated with Taāzur branding.")],
  },
  "time-leave-attendance": {
    title: "Time, leave & attendance",
    summary: "Monitor daily presence, field rotations, exceptions, balances, and manager approvals.",
    mode: "demo", allowedRoles: allRoles,
    metrics: [metric("Present", String(taazurEnergyDemo.attendance.present), "13 July 2026"), metric("Exceptions", String(taazurEnergyDemo.attendance.exceptions), "Late · approved leave"), metric("Pending", "2", "Manager approvals")],
    records: [record("12 attendance entries", "Corporate, field, maintenance, and project shifts", "Loaded"), record("Aisha Al-Otaibi", "Checked in 08:31 · Riyadh", "Late"), record("Priya Menon", "Annual leave · 13–14 July", "Approved")],
    actions: [action("approve-leave", "Approve pending leave", "Omar's personal leave approved and balance updated."), action("correct-time", "Record time correction", "Attendance correction draft created for manager review.")],
  },
  "documents-certificates": {
    title: "Documents & certificates",
    summary: "Manage contracts, identity records, certificates, expiry alerts, and controlled employee access.",
    mode: "demo", allowedRoles: allRoles,
    metrics: [metric("Documents", String(taazurEnergyDemo.documents.length), `Across ${workforceCount} employees`), metric("Expiring", "2", "Within 60 days"), metric("Contracts", String(workforceCount), "Bilingual sample set")],
    records: [record("12 employment contracts", "One bilingual fixture contract per employee", "Valid"), record("Operational safety leadership", "Fahad · expires 22 Aug", "Expiring soon"), record("Resident identity", "Priya · expires 10 Sep", "Expiring soon")],
    actions: [action("upload-document", "Upload document", "Encrypted demo document added with expiry tracking."), action("send-reminder", "Send expiry reminder", "Two bilingual reminder emails queued.")],
  },
  "notifications-reports": {
    title: "Notifications & reports",
    summary: "Build bilingual scheduled reports and deliver role-aware alerts through email, in-app, and export channels.",
    mode: "demo", allowedRoles: adminRoles,
    metrics: [metric("Reports", "8", "Operational templates"), metric("Scheduled", "3", "Weekly and monthly"), metric("Delivery", "100%", "Last demo run")],
    records: [record("Workforce snapshot", "Every Sunday · HR leadership", "Scheduled"), record("Payroll variance", "Monthly · Payroll and Finance", "Ready"), record("Project utilization", "Weekly · PMO and Operations", "Scheduled")],
    actions: [action("run-report", "Generate workforce report", "Taāzur-branded workforce report generated with twelve employee rows."), action("schedule-report", "Schedule report", "Report scheduled for Sunday 08:00 AST.")],
  },
  recruitment: {
    title: "Recruitment pipeline",
    summary: "Move a fictional candidate from requisition through interview, offer, and onboarding handoff.",
    mode: "demo", allowedRoles: adminRoles,
    metrics: [metric("Open roles", "3", "Field, PMO, payroll"), metric("Candidates", "4", "Across four stages"), metric("Offers", "2", "Draft and approval")],
    records: [record("Sara Al-Mutairi", "Technical interview · 15 July", "In progress"), record("Abdullah Al-Salem", "Project Planner · offer review", "Offer"), record("Fatima Al-Dosari", "Payroll Officer · assessment", "Screening")],
    actions: [action("advance-candidate", "Advance to offer", "Sara advanced to offer review; audit event recorded."), action("send-offer", "Send demo offer", "Bilingual demo offer prepared and notification queued.")],
  },
  onboarding: {
    title: "Employee onboarding",
    summary: "Coordinate contract, GOSI, induction, equipment, buddy, and manager milestones for new hires.",
    mode: "demo", allowedRoles: adminRoles,
    metrics: [metric("Progress", "78%", "Omar onboarding"), metric("Complete", "2", "Core tasks"), metric("Due", "1", "30-day check-in")],
    records: [record("Omar Al-Dossary", "Field Engineer · 78% complete", "In progress"), record("Sara Al-Mutairi", "Drilling Engineer · preboarding", "Upcoming"), record("Lina Al-Haddad", "Project Coordinator · 100%", "Complete")],
    actions: [action("complete-checkin", "Complete manager check-in", "Check-in completed; onboarding advanced to 100%."), action("assign-task", "Assign onboarding task", "Equipment handover task assigned to Operations IT.")],
  },
  offboarding: {
    title: "Offboarding & alumni",
    summary: "Run Priya's controlled exit, knowledge transfer, asset return, final settlement, interview, and archive.",
    mode: "demo", allowedRoles: adminRoles,
    metrics: [metric("Progress", "34%", "Last day 13 Aug"), metric("Open tasks", "3", "Cross-functional"), metric("Settlement", "Draft", "Payroll review pending")],
    records: [record("Knowledge-transfer dashboard", "Owned by Priya and Salman", "In progress"), record("Final settlement review", "Owned by Aisha", "Not started"), record("Exit interview", "10 Aug · Reem", "Scheduled")],
    actions: [action("complete-transfer", "Complete knowledge transfer", "Knowledge-transfer evidence attached and task completed."), action("calculate-settlement", "Calculate final settlement", "Demo settlement calculated with service and leave components.")],
  },
  "learning-skills": {
    title: "Learning & skills",
    summary: "Track role skills, certification gaps, development plans, and course progress.",
    mode: "demo", allowedRoles: allRoles,
    metrics: [metric("Skills", String(taazurEnergyDemo.employees.reduce((sum, employee) => sum + employee.skills.length, 0)), `Across ${workforceCount} profiles`), metric("Programs", String(taazurEnergyDemo.performance.learning.length), "Assigned and active"), metric("Learning", "40%", "Omar course progress")],
    records: [record("Advanced well-control fundamentals", "Omar · role-required", "In progress"), record("Primavera P6 foundations", "Lina · project controls", "62%"), record("ISO 45001", "Priya · verified skill", "Current")],
    actions: [action("enroll-course", "Enroll in course", "Course enrollment created and manager notified."), action("verify-skill", "Verify skill", "Skill evidence marked verified in the demo profile.")],
  },
  "benefits-rewards": {
    title: "Benefits, rewards & recognition",
    summary: "Manage allowances, benefit enrollment, total rewards, and peer recognition.",
    mode: "demo", allowedRoles: allRoles,
    metrics: [metric("Benefit plans", String(taazurEnergyDemo.benefits.plans.length), "Medical and life"), metric("Enrollment", "100%", `${workforceCount} employees`), metric("Recognition", String(taazurEnergyDemo.performance.recognitions.length), "This month")],
    records: [record("Precision recognition", "Aisha · zero-error payroll checks", "Published"), record("Safety recognition", "Yousef · permit intervention", "Published"), record("Family medical plan", "Five active family enrollments", "Active")],
    actions: [action("send-recognition", "Send recognition", "Recognition published to the fictional employee feed."), action("compare-benefits", "Compare benefit options", "Personalized demo benefit comparison generated.")],
  },
  "government-integrations": {
    title: "Saudi government integration center",
    summary: "Exercise deterministic mock adapters for Qiwa, Mudad, GOSI, Muqeem, bank payroll, and ZATCA without claiming live authority access.",
    mode: "mock", allowedRoles: ["hr_manager", "hr_specialist"],
    metrics: [metric("Adapters", "6", "All mock mode"), metric("Healthy", "5", "One scope review"), metric("Rows", String(workforceCount), "Fixture reconciliation")],
    records: [record("Qiwa contract check", "QIW-MOCK-260713-01", "Sandbox ready"), record("Mudad wage file", "MUD-MOCK-260713-01 · 12 rows", "Validated"), record("GOSI reconciliation", "GOS-MOCK-260713-01 · cohort-aware fixture", "Ready")],
    actions: [action("mock-qiwa", "Run Qiwa contract check", "MOCK Qiwa response accepted; no authority system was contacted."), action("mock-mudad", "Validate Mudad file", "MOCK Mudad validation passed; no wage file was submitted."), action("mock-gosi", "Reconcile GOSI", "MOCK GOSI reconciliation completed with twelve employee rows.")],
  },
  "nitaqat-compliance": {
    title: "Nitaqat & compliance",
    summary: "Model Saudization, document risk, policy controls, and evidence-backed corrective actions.",
    mode: "demo", allowedRoles: adminRoles,
    metrics: [metric("Saudization", `${taazurEnergyDemo.company.saudizationRate}%`, "Illustrative scenario"), metric("Risks", "2", "Document expiries"), metric("Controls", "94", "Demo readiness score")],
    records: [record("Saudi headcount", `${saudiCount} of ${workforceCount} employees`, "Demo scenario"), record("Iqama expiry", "Priya · 10 Sep", "Monitor"), record("Occupation controls", "Two non-Saudi profiles · role checks", "Fixture")],
    actions: [action("simulate-hire", "Simulate Saudi hire", "Scenario increases modeled Saudization to 83%."), action("create-control", "Create corrective action", "Expiry-renewal control assigned to HR Operations.")],
  },
  "ai-intelligence": {
    title: "AI workforce intelligence",
    summary: "Generate explainable demo insights from the fixture without sending employee records to an external provider.",
    mode: "demo", allowedRoles: adminRoles,
    metrics: [metric("Insights", "6", "Explainable recommendations"), metric("Confidence", "87%", "Demo scoring"), metric("Data sent", "0", "Local fixture mode")],
    records: [record("Payroll anomaly", "Review Omar project allowance", "Actionable"), record("Project capacity", "Yousef allocation across two projects", "Watch"), record("Retention signal", "Priya exit knowledge transfer", "High priority")],
    actions: [action("generate-brief", "Generate HR brief", "Executive brief generated from the fictional fixture only."), action("explain-insight", "Explain recommendation", "Evidence chain displayed with source records and confidence limits.")],
  },
  "performance-goals": {
    title: "Performance & goals",
    summary: "Manage objectives, check-ins, review cycles, calibration, and development outcomes.",
    mode: "demo", allowedRoles: allRoles,
    metrics: [metric("Cycle", "83%", "H1 2026 review"), metric("Goals", String(taazurEnergyDemo.performance.goals.length), "Active fixture goals"), metric("Participants", String(workforceCount), "Company cycle")],
    records: [record("Field certification", "Omar · 65%", "On track"), record("Zero-error Mudad", "Aisha · 92%", "On track"), record("Jafurah mobilization", "Khalid · 68%", "On track")],
    actions: [action("add-checkin", "Record check-in", "Check-in note saved to the employee goal timeline."), action("complete-review", "Submit review", "Demo review submitted to calibration.")],
  },
  "engagement-retention": {
    title: "Engagement & retention",
    summary: "Run pulse surveys, inspect themes, track eNPS, and create evidence-based retention actions.",
    mode: "demo", allowedRoles: adminRoles,
    metrics: [metric("eNPS", "+42", "Fictional pulse"), metric("Response", "83%", "10 of 12"), metric("Top score", "4.7", "Safety culture")],
    records: [record("Safety culture", "4.7 / 5", "Leading"), record("Manager support", "4.4 / 5", "Strong"), record("Workload", "3.7 / 5", "Watch")],
    actions: [action("launch-pulse", "Launch pulse survey", "Twelve fictional invitations queued; no real email sent."), action("create-action", "Create retention action", "Workload review action assigned to Eastern Operations.")],
  },
  "travel-expenses": {
    title: "Travel & expenses",
    summary: "Submit receipts, apply policy checks, approve claims, and prepare reimbursement records.",
    mode: "demo", allowedRoles: allRoles,
    metrics: [metric("Claims", String(taazurEnergyDemo.expenses.length), "Current cycle"), metric("Pending", "SAR 1,530", "Two project claims"), metric("Approved", "SAR 4,670", "Travel and supplies")],
    records: [record("Dhahran–Riyadh travel", "Fahad · SAR 1,840 · Jafurah", "Approved"), record("Field per diem", "Omar · SAR 620 · Jafurah", "Pending"), record("Client workshop", "Khalid · SAR 2,450 · Jubail", "Approved")],
    actions: [action("submit-expense", "Submit expense", "Expense draft created with policy validation."), action("approve-expense", "Approve pending claim", "Field per diem approved for the next reimbursement cycle.")],
  },
  "employee-relations": {
    title: "Employee relations",
    summary: "Manage confidential cases, grievances, mediation, evidence, outcomes, and policy follow-up.",
    mode: "demo", allowedRoles: ["hr_manager", "hr_specialist"],
    metrics: [metric("Open cases", "2", "Restricted access"), metric("SLA", "2 days", "Within target"), metric("Overdue", "0", "No escalations")],
    records: [record("Work schedule clarification", "Ahmed · restricted · owned by Reem", "Mediation"), record("Flexible work request", "Noura · restricted · owned by Aisha", "Review"), record("Policy acknowledgment", "12 employees · current version", "Complete")],
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
    metrics: [metric("Automations", String(taazurEnergyDemo.workflows.length), "Three active"), metric("Runs", "27", "This month"), metric("Success", "96%", "One retry")],
    records: [record("Document expiry reminder", "60/30/7-day sequence", "Active"), record("New-hire onboarding", "Contract → induction → check-in", "Active"), record("Expense approval", "Department/project routing", "Active")],
    actions: [action("run-automation", "Run expiry workflow", "Expiry workflow completed with two notifications and an audit record."), action("create-rule", "Create approval rule", "Rule draft created: expenses over SAR 2,000 require department manager.")],
  },
  "people-analytics": {
    title: "People analytics",
    summary: "Explore workforce, payroll, attendance, diversity, talent, and lifecycle metrics with drill-down evidence.",
    mode: "demo", allowedRoles: adminRoles,
    metrics: [metric("Headcount", String(workforceCount), "Three branches"), metric("Saudi", `${taazurEnergyDemo.company.saudizationRate}%`, `${saudiCount} of ${workforceCount}`), metric("Payroll", formatSar(taazurEnergyDemo.payroll.net), "Net June fixture")],
    records: [record("Projects", `${projectCount} projects · ${taazurEnergyDemo.projectAssignments.length} assignments`, "Active portfolio"), record("Riyadh", "4 employees · People and Finance", "Stable"), record("Dhahran & Jubail", "8 employees · Operations, HSE, PMO", "One planned exit")],
    actions: [action("export-analytics", "Export analytics pack", "Anonymized demo analytics workbook prepared."), action("save-view", "Save dashboard view", "Role-filtered dashboard view saved for HR leadership.")],
  },
  "integration-marketplace": {
    title: "Integration marketplace",
    summary: "Configure provider-neutral connections, test webhooks, inspect scopes, and review integration health.",
    mode: "demo", allowedRoles: ["hr_manager"],
    metrics: [metric("Connectors", "9", "Six mock authority adapters"), metric("Enabled", "6", "Demo tenant"), metric("Webhooks", "Healthy", "Last test passed")],
    records: [record("Microsoft Teams", "Interview and notification events", "Demo connected"), record("Supabase", "Postgres and storage boundary", "Configuration ready"), record("Project webhook", "Assignment and utilization events", "Demo connected")],
    actions: [action("test-webhook", "Test webhook", "Demo webhook delivered and signature verified."), action("configure-connector", "Configure connector", "Provider-neutral connector draft saved; credentials remain environment-only.")],
  },
};

const connectedContextRecords = [
  record("Connected organization", `${workforceCount} employees · ${taazurEnergyDemo.departments.length} departments · ${taazurEnergyDemo.branches.length} branches`, "Fixture"),
  record("Project portfolio", `${projectCount} projects · ${taazurEnergyDemo.projectAssignments.length} assignments`, "Fixture"),
];

export const demoWorkflows = Object.fromEntries(
  Object.entries(workflowDefinitions).map(([slug, workflow]) => {
    const missingRecordCount = Math.max(0, 3 - workflow.records.length);
    return [
      slug,
      {
        ...workflow,
        records: [...workflow.records, ...connectedContextRecords.slice(0, missingRecordCount)],
      },
    ];
  }),
) as Record<string, DemoWorkflow>;
