export type DemoRole =
  | "super_admin"
  | "hr_manager"
  | "department_manager"
  | "hr_specialist"
  | "employee";

export interface DemoEmployee {
  id: string;
  employeeNumber: string;
  fullName: string;
  fullNameAr: string;
  email: string;
  phone: string;
  photoUrl: string;
  role: DemoRole;
  jobTitle: string;
  jobTitleAr: string;
  department: string;
  branchId: string;
  managerId: string | null;
  nationality: "saudi" | "expat";
  hireDate: string;
  status: "active" | "on_leave" | "notice_period";
  workPattern: string;
  salary: { basic: number; housing: number; transport: number };
  maskedIdentity: string;
  skills: string[];
}

const employees: DemoEmployee[] = [
  {
    id: "emp-reem",
    employeeNumber: "RES-1001",
    fullName: "Reem Al-Harbi",
    fullNameAr: "ريم الحربي",
    email: "reem.alharbi@rukn-energy.example",
    phone: "+966 5X XXX 1101",
    photoUrl: "/demo/people/reem-alharbi.svg",
    role: "hr_manager",
    jobTitle: "People & Culture Director",
    jobTitleAr: "مديرة الموارد البشرية والثقافة",
    department: "People & Culture",
    branchId: "riyadh-hq",
    managerId: null,
    nationality: "saudi",
    hireDate: "2021-03-14",
    status: "active",
    workPattern: "Riyadh corporate · Sun–Thu",
    salary: { basic: 32000, housing: 8000, transport: 2500 },
    maskedIdentity: "National ID •••• 4821",
    skills: ["Saudi labor law", "Workforce planning", "Executive coaching"],
  },
  {
    id: "emp-fahad",
    employeeNumber: "RES-1002",
    fullName: "Fahad Al-Qahtani",
    fullNameAr: "فهد القحطاني",
    email: "fahad.alqahtani@rukn-energy.example",
    phone: "+966 5X XXX 1102",
    photoUrl: "/demo/people/fahad-alqahtani.svg",
    role: "department_manager",
    jobTitle: "Eastern Operations Manager",
    jobTitleAr: "مدير العمليات بالمنطقة الشرقية",
    department: "Field Operations",
    branchId: "dhahran-ops",
    managerId: "emp-reem",
    nationality: "saudi",
    hireDate: "2020-09-01",
    status: "active",
    workPattern: "Dhahran operations · rotating coverage",
    salary: { basic: 28500, housing: 7125, transport: 2200 },
    maskedIdentity: "National ID •••• 7350",
    skills: ["Well services", "Operational leadership", "HSE governance"],
  },
  {
    id: "emp-aisha",
    employeeNumber: "RES-1003",
    fullName: "Aisha Al-Otaibi",
    fullNameAr: "عائشة العتيبي",
    email: "aisha.alotaibi@rukn-energy.example",
    phone: "+966 5X XXX 1103",
    photoUrl: "/demo/people/aisha-alotaibi.svg",
    role: "hr_specialist",
    jobTitle: "Payroll & GOSI Specialist",
    jobTitleAr: "أخصائية الرواتب والتأمينات",
    department: "People & Culture",
    branchId: "riyadh-hq",
    managerId: "emp-reem",
    nationality: "saudi",
    hireDate: "2022-01-09",
    status: "active",
    workPattern: "Riyadh corporate · hybrid",
    salary: { basic: 17800, housing: 4450, transport: 1500 },
    maskedIdentity: "National ID •••• 2604",
    skills: ["Payroll controls", "GOSI", "Mudad wage protection"],
  },
  {
    id: "emp-omar",
    employeeNumber: "RES-1004",
    fullName: "Omar Nasser Al-Dossary",
    fullNameAr: "عمر ناصر الدوسري",
    email: "omar.aldossary@rukn-energy.example",
    phone: "+966 5X XXX 1104",
    photoUrl: "/demo/people/omar-aldossary.svg",
    role: "employee",
    jobTitle: "Field Engineer",
    jobTitleAr: "مهندس ميداني",
    department: "Field Operations",
    branchId: "dhahran-ops",
    managerId: "emp-fahad",
    nationality: "saudi",
    hireDate: "2026-05-03",
    status: "active",
    workPattern: "Dhahran field · 14/7 rotation",
    salary: { basic: 14500, housing: 3625, transport: 1350 },
    maskedIdentity: "National ID •••• 9182",
    skills: ["Production logging", "Permit to work", "Arabic/English reporting"],
  },
  {
    id: "emp-priya",
    employeeNumber: "RES-1005",
    fullName: "Priya Menon",
    fullNameAr: "بريا مينون",
    email: "priya.menon@rukn-energy.example",
    phone: "+966 5X XXX 1105",
    photoUrl: "/demo/people/priya-menon.svg",
    role: "employee",
    jobTitle: "HSE Data Analyst",
    jobTitleAr: "محللة بيانات الصحة والسلامة",
    department: "HSE & Quality",
    branchId: "dhahran-ops",
    managerId: "emp-fahad",
    nationality: "expat",
    hireDate: "2023-08-20",
    status: "notice_period",
    workPattern: "Dhahran operations · Sun–Thu",
    salary: { basic: 12800, housing: 3200, transport: 1200 },
    maskedIdentity: "Iqama •••• 6137",
    skills: ["Power BI", "Incident analytics", "ISO 45001"],
  },
];

const payslips = employees.map((employee) => {
  const gross = employee.salary.basic + employee.salary.housing + employee.salary.transport;
  const gosi = employee.nationality === "saudi" ? Math.round(employee.salary.basic * 0.0975) : 0;
  return {
    id: `slip-jun-2026-${employee.id}`,
    employeeId: employee.id,
    period: "June 2026",
    gross,
    deductions: gosi,
    net: gross - gosi,
    status: "ready" as const,
    documentUrl: `/demo/documents/${employee.employeeNumber.toLowerCase()}-jun-2026-payslip.pdf`,
  };
});

export const taazurEnergyDemo = {
  disclosure: "Fictional customer-demo data. No record represents a real person or company.",
  company: {
    id: "rukn-energy-demo",
    name: "Rukn Energy Services (Demo)",
    nameAr: "ركن الطاقة لخدمات الطاقة (تجريبي)",
    industry: "Oilfield services and energy operations",
    crNumber: "DEMO-CR-2050",
    nitaqatBand: "High Green",
    saudizationRate: 80,
    headcount: 5,
  },
  branches: [
    {
      id: "riyadh-hq",
      name: "Riyadh Corporate Office",
      nameAr: "المكتب الرئيسي بالرياض",
      city: "Riyadh",
      type: "Head office",
      employeeCount: 2,
    },
    {
      id: "dhahran-ops",
      name: "Dhahran Operations Base",
      nameAr: "قاعدة عمليات الظهران",
      city: "Dhahran",
      type: "Operations branch",
      employeeCount: 3,
    },
  ],
  employees,
  attendance: {
    date: "2026-07-13",
    present: 4,
    exceptions: 1,
    entries: [
      { employeeId: "emp-reem", checkIn: "08:07", status: "present", location: "Riyadh HQ" },
      { employeeId: "emp-fahad", checkIn: "06:42", status: "present", location: "Dhahran Base" },
      { employeeId: "emp-aisha", checkIn: "08:31", status: "late", location: "Riyadh HQ" },
      { employeeId: "emp-omar", checkIn: "06:28", status: "present", location: "Field Rotation A" },
      { employeeId: "emp-priya", checkIn: null, status: "approved_leave", location: "Dhahran Base" },
    ],
  },
  leave: {
    requests: [
      { id: "leave-001", employeeId: "emp-priya", type: "Annual leave", from: "2026-07-13", to: "2026-07-14", status: "approved", approverId: "emp-fahad" },
      { id: "leave-002", employeeId: "emp-omar", type: "Personal leave", from: "2026-07-20", to: "2026-07-20", status: "pending", approverId: "emp-fahad" },
    ],
  },
  payroll: {
    period: "June 2026",
    status: "ready_for_submission",
    gross: payslips.reduce((sum, payslip) => sum + payslip.gross, 0),
    net: payslips.reduce((sum, payslip) => sum + payslip.net, 0),
    anomalies: [{ id: "pay-anomaly-01", employeeId: "emp-omar", severity: "low", message: "First full payroll cycle — confirm joining allowance." }],
    payslips,
  },
  documents: [
    { id: "doc-01", employeeId: "emp-reem", type: "Employment contract", name: "Bilingual executive contract", status: "valid", expiryDate: null },
    { id: "doc-02", employeeId: "emp-fahad", type: "HSE certificate", name: "Operational safety leadership", status: "expiring_soon", expiryDate: "2026-08-22" },
    { id: "doc-03", employeeId: "emp-aisha", type: "GOSI registration", name: "GOSI enrollment confirmation", status: "valid", expiryDate: null },
    { id: "doc-04", employeeId: "emp-omar", type: "Employment contract", name: "Field engineer contract", status: "valid", expiryDate: null },
    { id: "doc-05", employeeId: "emp-priya", type: "Iqama", name: "Resident identity", status: "expiring_soon", expiryDate: "2026-09-10" },
    { id: "doc-06", employeeId: "emp-priya", type: "Exit checklist", name: "Controlled offboarding pack", status: "in_progress", expiryDate: null },
  ],
  recruitment: {
    requisitions: [{ id: "req-01", title: "Senior Drilling Engineer", branchId: "dhahran-ops", openings: 1, status: "interviewing" }],
    candidates: [{ id: "candidate-sara", name: "Sara Al-Mutairi", email: "sara.almutairi@candidate.example", stage: "technical_interview", score: 88 }],
    applications: [{ id: "app-01", candidateId: "candidate-sara", requisitionId: "req-01", stage: "technical_interview", nextAction: "Panel interview · 15 Jul" }],
    interviews: [{ id: "int-01", applicationId: "app-01", panel: ["emp-fahad", "emp-reem"], scheduledAt: "2026-07-15T10:00:00+03:00", location: "Teams" }],
    offer: { id: "offer-01", candidateId: "candidate-sara", status: "draft", basicSalary: 21000, startDate: "2026-08-16" },
  },
  onboarding: {
    employeeId: "emp-omar",
    progress: 78,
    buddyId: "emp-fahad",
    tasks: [
      { id: "onb-01", label: "Contract and GOSI registration", owner: "People & Culture", status: "done" },
      { id: "onb-02", label: "Field safety induction", owner: "HSE", status: "done" },
      { id: "onb-03", label: "30-day manager check-in", owner: "emp-fahad", status: "due" },
    ],
  },
  performance: {
    goals: [
      { id: "goal-01", employeeId: "emp-omar", title: "Complete field certification", progress: 65, dueDate: "2026-08-31" },
      { id: "goal-02", employeeId: "emp-aisha", title: "Zero-error Mudad submissions", progress: 92, dueDate: "2026-12-31" },
    ],
    reviewCycle: { id: "review-h1-2026", name: "H1 2026 Growth Review", completion: 80, status: "manager_review" },
    learning: [{ id: "learn-01", employeeId: "emp-omar", title: "Advanced well-control fundamentals", status: "in_progress", progress: 40 }],
    recognitions: [{ id: "rec-01", employeeId: "emp-aisha", fromEmployeeId: "emp-reem", value: "Precision", message: "Closed payroll pre-checks with zero critical findings." }],
  },
  engagement: {
    eNps: 42,
    responseRate: 80,
    pulse: [{ topic: "Manager support", score: 4.4 }, { topic: "Workload", score: 3.7 }, { topic: "Safety culture", score: 4.7 }],
  },
  expenses: [
    { id: "exp-01", employeeId: "emp-fahad", category: "Dhahran–Riyadh travel", amount: 1840, currency: "SAR", status: "approved" },
    { id: "exp-02", employeeId: "emp-omar", category: "Field per diem", amount: 620, currency: "SAR", status: "pending" },
  ],
  employeeRelations: {
    openCases: 1,
    cases: [{ id: "case-01", category: "Work schedule clarification", confidentiality: "restricted", status: "mediation", ownerId: "emp-reem" }],
  },
  offboarding: {
    employeeId: "emp-priya",
    lastWorkingDay: "2026-08-13",
    checklist: [
      { task: "Knowledge-transfer dashboard", status: "in_progress" },
      { task: "Return access badge and laptop", status: "not_started" },
      { task: "Final settlement review", status: "not_started" },
    ],
    exitInterview: { scheduledAt: "2026-08-10T14:00:00+03:00", interviewerId: "emp-reem", themes: ["Career growth", "Relocation"], status: "scheduled" },
    rehireEligibility: "eligible",
  },
  governmentIntegrations: [
    { id: "qiwa", name: "Qiwa", mode: "mock", status: "sandbox_ready", lastReference: "QIW-MOCK-260713-01" },
    { id: "mudad", name: "Mudad / WPS", mode: "mock", status: "file_validated", lastReference: "MUD-MOCK-260713-01" },
    { id: "gosi", name: "GOSI", mode: "mock", status: "reconciliation_ready", lastReference: "GOS-MOCK-260713-01" },
    { id: "muqeem", name: "Muqeem", mode: "mock", status: "expiry_checked", lastReference: "MUQ-MOCK-260713-01" },
    { id: "bank", name: "Bank payroll", mode: "mock", status: "payment_file_ready", lastReference: "BNK-MOCK-260713-01" },
    { id: "zatca", name: "ZATCA", mode: "mock", status: "scope_confirmation_required", lastReference: "ZAT-MOCK-260713-01" },
  ],
} as const;

export type TaazurEnergyDemo = typeof taazurEnergyDemo;

export function getDemoEmployee(employeeId: string | null | undefined) {
  if (!employeeId) return undefined;
  return taazurEnergyDemo.employees.find((employee) => employee.id === employeeId);
}
