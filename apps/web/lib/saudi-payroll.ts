export const SAUDI_GOSI_RULES = {
  contributoryWageCap: 45_000,
  annuities: {
    label: "GOSI annuities",
    appliesTo: "Saudi nationals",
    employeeRate: 0.09,
    employerRate: 0.09,
  },
  saned: {
    label: "SANED unemployment insurance",
    appliesTo: "Saudi nationals",
    employeeRate: 0.0075,
    employerRate: 0.0075,
  },
  occupationalHazards: {
    label: "Occupational hazards",
    appliesTo: "All employees",
    employeeRate: 0,
    employerRate: 0.02,
  },
} as const;

export interface SaudiGosiBreakdown {
  contributionBase: number;
  annuitiesEmployee: number;
  annuitiesEmployer: number;
  sanedEmployee: number;
  sanedEmployer: number;
  occupationalHazardsEmployer: number;
  employeeTotal: number;
  employerTotal: number;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function isSaudiNational(nationality: string | null | undefined): boolean {
  return Boolean(nationality && /saudi|ksa|السعود/i.test(nationality));
}

export function calculateSaudiGosi({
  basicSalary,
  housingAllowance,
  nationality,
}: {
  basicSalary: number;
  housingAllowance: number;
  nationality: string | null | undefined;
}): SaudiGosiBreakdown {
  const contributionBase = Math.min(
    SAUDI_GOSI_RULES.contributoryWageCap,
    Math.max(0, basicSalary + housingAllowance),
  );
  const saudi = isSaudiNational(nationality);
  const annuitiesEmployee = saudi ? roundMoney(contributionBase * SAUDI_GOSI_RULES.annuities.employeeRate) : 0;
  const annuitiesEmployer = saudi ? roundMoney(contributionBase * SAUDI_GOSI_RULES.annuities.employerRate) : 0;
  const sanedEmployee = saudi ? roundMoney(contributionBase * SAUDI_GOSI_RULES.saned.employeeRate) : 0;
  const sanedEmployer = saudi ? roundMoney(contributionBase * SAUDI_GOSI_RULES.saned.employerRate) : 0;
  const occupationalHazardsEmployer = roundMoney(
    contributionBase * SAUDI_GOSI_RULES.occupationalHazards.employerRate,
  );

  return {
    contributionBase,
    annuitiesEmployee,
    annuitiesEmployer,
    sanedEmployee,
    sanedEmployer,
    occupationalHazardsEmployer,
    employeeTotal: roundMoney(annuitiesEmployee + sanedEmployee),
    employerTotal: roundMoney(annuitiesEmployer + sanedEmployer + occupationalHazardsEmployer),
  };
}

export const saudiPayrollTracks = [
  "Employee master data",
  "Attendance and locations",
  "Leave and expense approvals",
  "Payroll run and payslip readiness",
  "GOSI, SANED, and occupational hazard checks",
  "Mudad WPS export status",
  "Qiwa contract status",
  "Nitaqat and Saudization follow-up",
  "Iqama, work permit, passport, and CCHI expiry tracking",
  "Daily, weekly, and monthly reports",
] as const;
