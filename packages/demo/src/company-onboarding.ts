export type CompanyOnboardingStepId =
  | "company"
  | "compliance"
  | "locations"
  | "organization"
  | "payroll"
  | "sample_data"
  | "review";

export interface CompanyOnboardingState {
  company: {
    legalNameEn: string;
    legalNameAr: string;
    crNumber: string;
    unifiedNumber: string;
    industry: string;
  };
  compliance: {
    nitaqatActivity: string;
    gosiNumber: string;
    vatNumber: string;
    saudizationTarget: number;
  };
  locations: {
    branches: Array<{
      id: string;
      name: string;
      city: string;
      isHeadquarters: boolean;
      workPattern: string;
    }>;
  };
  organization: {
    departments: Array<{
      id: string;
      name: string;
      costCenter: string;
      managerName: string;
      employeeCount: number;
    }>;
    managers: Array<{
      id: string;
      name: string;
      title: string;
      departmentId: string;
    }>;
    employeeCount: number;
  };
  payroll: {
    bankName: string;
    iban: string;
    payrollDay: number;
    workWeek: string;
    housingAllowancePercent: number;
    transportAllowance: number;
  };
  sampleData: {
    projects: Array<{
      id: string;
      name: string;
      managerName: string;
      status: "active" | "planning";
    }>;
    includePayrollHistory: boolean;
    payrollHistoryMonths: number;
    includeAttendance: boolean;
    includeLeave: boolean;
    includeDocuments: boolean;
    includeBenefits: boolean;
    includeAssets: boolean;
  };
}

export const companyOnboardingSteps = [
  { id: "company", label: "Company identity", labelAr: "هوية الشركة" },
  { id: "compliance", label: "Saudi compliance", labelAr: "الامتثال السعودي" },
  { id: "locations", label: "Branches & work", labelAr: "الفروع والعمل" },
  { id: "organization", label: "Organization & managers", labelAr: "الهيكل والمديرون" },
  { id: "payroll", label: "Payroll setup", labelAr: "إعداد الرواتب" },
  { id: "sample_data", label: "Projects & sample data", labelAr: "المشاريع والبيانات التجريبية" },
  { id: "review", label: "Review & activate", labelAr: "المراجعة والتفعيل" },
] as const satisfies readonly {
  id: CompanyOnboardingStepId;
  label: string;
  labelAr: string;
}[];

export const companyOnboardingFixture: CompanyOnboardingState = {
  company: {
    legalNameEn: "Rukn Energy Services Company",
    legalNameAr: "شركة ركن لخدمات الطاقة",
    crNumber: "1010987654",
    unifiedNumber: "7001234567",
    industry: "Oilfield services",
  },
  compliance: {
    nitaqatActivity: "Oil and gas services",
    gosiNumber: "123456789",
    vatNumber: "310123456700003",
    saudizationTarget: 83,
  },
  locations: {
    branches: [
      {
        id: "riyadh-hq",
        name: "Riyadh headquarters",
        city: "Riyadh",
        isHeadquarters: true,
        workPattern: "Sunday–Thursday",
      },
      {
        id: "dhahran-ops",
        name: "Dhahran operations base",
        city: "Dhahran",
        isHeadquarters: false,
        workPattern: "14/7 field rotation",
      },
      {
        id: "jubail-site",
        name: "Jubail project office",
        city: "Jubail",
        isHeadquarters: false,
        workPattern: "Sunday–Thursday",
      },
    ],
  },
  organization: {
    departments: [
      { id: "dept-people", name: "People & Culture", costCenter: "PC-100", managerName: "Reem Al-Harbi", employeeCount: 3 },
      { id: "dept-field", name: "Field Operations", costCenter: "FO-200", managerName: "Fahad Al-Qahtani", employeeCount: 4 },
      { id: "dept-projects", name: "Projects & PMO", costCenter: "PMO-300", managerName: "Khalid Al-Zahrani", employeeCount: 2 },
      { id: "dept-finance", name: "Finance & Procurement", costCenter: "FN-400", managerName: "Mariam Al-Anazi", employeeCount: 1 },
      { id: "dept-hse", name: "HSE & Quality", costCenter: "HQ-500", managerName: "Salman Al-Rashidi", employeeCount: 2 },
    ],
    managers: [
      { id: "emp-reem", name: "Reem Al-Harbi", title: "People & Culture Director", departmentId: "dept-people" },
      { id: "emp-fahad", name: "Fahad Al-Qahtani", title: "Eastern Operations Manager", departmentId: "dept-field" },
      { id: "emp-khalid", name: "Khalid Al-Zahrani", title: "Projects & PMO Director", departmentId: "dept-projects" },
      { id: "emp-salman", name: "Salman Al-Rashidi", title: "HSE & Quality Manager", departmentId: "dept-hse" },
    ],
    employeeCount: 12,
  },
  payroll: {
    bankName: "Saudi National Bank",
    iban: "SA0380000000608010167519",
    payrollDay: 27,
    workWeek: "Sunday–Thursday",
    housingAllowancePercent: 25,
    transportAllowance: 1_000,
  },
  sampleData: {
    projects: [
      { id: "project-jafurah", name: "Jafurah Well Services Ramp-up", managerName: "Khalid Al-Zahrani", status: "active" },
      { id: "project-hse-digital", name: "Dhahran HSE Digitization", managerName: "Salman Al-Rashidi", status: "active" },
      { id: "project-hr-transform", name: "Riyadh HR & Payroll Transformation", managerName: "Reem Al-Harbi", status: "active" },
      { id: "project-jubail-shutdown", name: "Jubail Shutdown Readiness", managerName: "Fahad Al-Qahtani", status: "planning" },
    ],
    includePayrollHistory: true,
    payrollHistoryMonths: 3,
    includeAttendance: true,
    includeLeave: true,
    includeDocuments: true,
    includeBenefits: true,
    includeAssets: true,
  },
};

export type CompanyOnboardingErrors = Record<string, string>;

const required = (value: string) => value.trim().length > 0;

export function validateCompanyOnboardingStep(
  state: CompanyOnboardingState,
  step: CompanyOnboardingStepId,
): CompanyOnboardingErrors {
  const errors: CompanyOnboardingErrors = {};

  if (step === "company") {
    if (!required(state.company.legalNameEn)) errors.legalNameEn = "English legal name is required.";
    if (!required(state.company.legalNameAr)) errors.legalNameAr = "Arabic legal name is required.";
    if (!/^\d{10}$/.test(state.company.crNumber)) errors.crNumber = "CR number must contain 10 digits.";
    if (!/^7\d{9}$/.test(state.company.unifiedNumber)) errors.unifiedNumber = "Unified number must start with 7 and contain 10 digits.";
    if (!required(state.company.industry)) errors.industry = "Company activity is required.";
  }

  if (step === "compliance") {
    if (!required(state.compliance.nitaqatActivity)) errors.nitaqatActivity = "Nitaqat activity is required.";
    if (!/^\d{9}$/.test(state.compliance.gosiNumber)) errors.gosiNumber = "GOSI number must contain 9 digits.";
    if (!/^3\d{13}3$/.test(state.compliance.vatNumber)) errors.vatNumber = "VAT number must contain 15 digits, starting and ending with 3.";
    if (state.compliance.saudizationTarget < 0 || state.compliance.saudizationTarget > 100) errors.saudizationTarget = "Saudization target must be between 0 and 100%.";
  }

  if (step === "locations") {
    if (state.locations.branches.length === 0) errors.branches = "Add at least one branch.";
    if (!state.locations.branches.some((branch) => branch.isHeadquarters)) errors.headquarters = "Select one headquarters branch.";
    if (state.locations.branches.some((branch) => !required(branch.name) || !required(branch.city))) errors.branchDetails = "Every branch requires a name and city.";
  }

  if (step === "organization") {
    if (state.organization.departments.length === 0) errors.departments = "Add at least one department.";
    if (state.organization.managers.length === 0) errors.managers = "Assign at least one people manager.";
    if (state.organization.employeeCount < 3) errors.employeeCount = "Create at least three sample employees.";
    if (state.organization.departments.some((department) => !required(department.name) || !required(department.costCenter) || !required(department.managerName))) {
      errors.departmentDetails = "Every department requires a name, cost center, and manager.";
    }
    const assignedEmployees = state.organization.departments.reduce((sum, department) => sum + department.employeeCount, 0);
    if (assignedEmployees !== state.organization.employeeCount) errors.departmentHeadcount = "Department headcount must equal the sample employee count.";
  }

  if (step === "payroll") {
    if (!required(state.payroll.bankName)) errors.bankName = "Payroll bank is required.";
    if (!/^SA\d{22}$/.test(state.payroll.iban)) errors.iban = "Saudi IBAN must start with SA and contain 24 characters.";
    if (state.payroll.payrollDay < 1 || state.payroll.payrollDay > 28) errors.payrollDay = "Payroll day must be between 1 and 28.";
    if (!required(state.payroll.workWeek)) errors.workWeek = "Default work pattern is required.";
    if (state.payroll.housingAllowancePercent < 0 || state.payroll.housingAllowancePercent > 100) errors.housingAllowancePercent = "Housing allowance must be between 0 and 100%.";
    if (state.payroll.transportAllowance < 0) errors.transportAllowance = "Transport allowance cannot be negative.";
  }

  if (step === "sample_data") {
    if (state.sampleData.projects.length === 0) errors.projects = "Add at least one sample project.";
    if (state.sampleData.projects.some((project) => !required(project.name) || !required(project.managerName))) errors.projectDetails = "Every project requires a name and manager.";
    if (state.sampleData.includePayrollHistory && state.sampleData.payrollHistoryMonths < 1) errors.payrollHistoryMonths = "Select at least one payroll-history month.";
  }

  if (step === "review") {
    for (const setupStep of companyOnboardingSteps.slice(0, -1)) {
      Object.assign(errors, validateCompanyOnboardingStep(state, setupStep.id));
    }
  }

  return errors;
}

export function getCompanyOnboardingProgress(state: CompanyOnboardingState): number {
  const setupSteps = companyOnboardingSteps.slice(0, -1);
  const completeSteps = setupSteps.filter(
    (step) => Object.keys(validateCompanyOnboardingStep(state, step.id)).length === 0,
  ).length;
  return Math.round((completeSteps / setupSteps.length) * 100);
}

export interface CompanyOnboardingActivation {
  activated: boolean;
  progress: number;
  blockedSteps: CompanyOnboardingStepId[];
  activationReference?: string;
  provisioningSummary?: {
    branches: number;
    departments: number;
    managers: number;
    employees: number;
    projects: number;
    payrollHistoryMonths: number;
  };
  message: string;
}

export function activateCompanyOnboarding(
  state: CompanyOnboardingState,
): CompanyOnboardingActivation {
  const setupSteps = companyOnboardingSteps.slice(0, -1);
  const blockedSteps = setupSteps
    .filter((step) => Object.keys(validateCompanyOnboardingStep(state, step.id)).length > 0)
    .map((step) => step.id);
  const progress = getCompanyOnboardingProgress(state);

  if (blockedSteps.length > 0) {
    return {
      activated: false,
      progress,
      blockedSteps,
      message: `Complete ${blockedSteps.length} onboarding steps before activation.`,
    };
  }

  return {
    activated: true,
    progress,
    blockedSteps: [],
    activationReference: `ONB-DEMO-${state.company.crNumber}`,
    provisioningSummary: {
      branches: state.locations.branches.length,
      departments: state.organization.departments.length,
      managers: state.organization.managers.length,
      employees: state.organization.employeeCount,
      projects: state.sampleData.projects.length,
      payrollHistoryMonths: state.sampleData.includePayrollHistory ? state.sampleData.payrollHistoryMonths : 0,
    },
    message: "Company workspace activated for the operational demo.",
  };
}
