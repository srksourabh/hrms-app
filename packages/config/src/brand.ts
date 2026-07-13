export interface BrandConfig {
  name: string;
  nameAr: string;
  attribution: string;
  tagline: string;
  taglineAr: string;
  logoUrl: string;
  accent: string;
}

export const taazurBrand: BrandConfig = {
  name: "Taāzur",
  nameAr: "تآزر",
  attribution: "powered by UDS-Noon JV",
  tagline: "Saudi people operations, working as one",
  taglineAr: "عمليات الموارد البشرية السعودية بتناغم واحد",
  logoUrl: "/brand/taazur-mark.svg",
  accent: "#0B5D46",
};

/**
 * Resolves a deploy-time white-label brand without requiring source changes.
 * A future tenant settings record can pass the same override shape at runtime.
 */
export function resolveBrand(overrides: Partial<BrandConfig> = {}): BrandConfig {
  return {
    ...taazurBrand,
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
