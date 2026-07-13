export type CompanyOnboardingStepId =
  | "company"
  | "compliance"
  | "locations"
  | "payroll"
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
  payroll: {
    bankName: string;
    iban: string;
    payrollDay: number;
    workWeek: string;
    housingAllowancePercent: number;
    transportAllowance: number;
  };
}

export const companyOnboardingSteps = [
  { id: "company", label: "Company identity", labelAr: "هوية الشركة" },
  { id: "compliance", label: "Saudi compliance", labelAr: "الامتثال السعودي" },
  { id: "locations", label: "Branches & work", labelAr: "الفروع والعمل" },
  { id: "payroll", label: "Payroll setup", labelAr: "إعداد الرواتب" },
  { id: "review", label: "Review & activate", labelAr: "المراجعة والتفعيل" },
] as const satisfies ReadonlyArray<{
  id: CompanyOnboardingStepId;
  label: string;
  labelAr: string;
}>;

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
    saudizationTarget: 80,
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
        id: "dhahran-field",
        name: "Dhahran field operations",
        city: "Dhahran",
        isHeadquarters: false,
        workPattern: "14/7 field rotation",
      },
    ],
  },
  payroll: {
    bankName: "Saudi National Bank",
    iban: "SA0380000000608010167519",
    payrollDay: 27,
    workWeek: "Sunday–Thursday",
    housingAllowancePercent: 25,
    transportAllowance: 1_000,
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

  if (step === "payroll") {
    if (!required(state.payroll.bankName)) errors.bankName = "Payroll bank is required.";
    if (!/^SA\d{22}$/.test(state.payroll.iban)) errors.iban = "Saudi IBAN must start with SA and contain 24 characters.";
    if (state.payroll.payrollDay < 1 || state.payroll.payrollDay > 28) errors.payrollDay = "Payroll day must be between 1 and 28.";
    if (!required(state.payroll.workWeek)) errors.workWeek = "Default work pattern is required.";
    if (state.payroll.housingAllowancePercent < 0 || state.payroll.housingAllowancePercent > 100) errors.housingAllowancePercent = "Housing allowance must be between 0 and 100%.";
    if (state.payroll.transportAllowance < 0) errors.transportAllowance = "Transport allowance cannot be negative.";
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
    message: "Company workspace activated for the operational demo.",
  };
}
