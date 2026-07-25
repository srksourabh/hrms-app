export interface BrandConfig {
  name: string;
  nameAr: string;
  attribution: string;
  tagline: string;
  taglineAr: string;
  logoUrl: string;
  accent: string;
}

export const defaultBrand: BrandConfig = {
  name: "Saudi HRMS Portal",
  nameAr: "بوابة الموارد البشرية السعودية",
  attribution: "Saudi Arabian company HRMS",
  tagline: "Field-ready HR, payroll, and compliance for Saudi Arabia",
  taglineAr: "إدارة الموارد البشرية والرواتب والامتثال في السعودية",
  logoUrl: "/brand/saudi-hrms-mark.svg",
  accent: "#0B5D46",
};

export function resolveBrand(overrides: Partial<BrandConfig> = {}): BrandConfig {
  return {
    ...defaultBrand,
    ...Object.fromEntries(
      Object.entries(overrides).filter(([, value]) => value !== undefined && value !== ""),
    ),
  };
}

export const productBrand = resolveBrand({
  name: process.env.NEXT_PUBLIC_BRAND_NAME,
  nameAr: process.env.NEXT_PUBLIC_BRAND_NAME_AR,
  logoUrl: process.env.NEXT_PUBLIC_BRAND_LOGO_URL,
  accent: process.env.NEXT_PUBLIC_BRAND_ACCENT,
  attribution: process.env.NEXT_PUBLIC_BRAND_ATTRIBUTION,
});
