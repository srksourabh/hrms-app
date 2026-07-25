# Saudi HRMS Brand Guidelines

## Brand Identity

**English name:** Saudi HRMS Portal
**Arabic name:** بوابة الموارد البشرية السعودية
**Positioning:** a simple HR, payroll, attendance, and compliance portal for Saudi Arabian companies.

The interface should feel local to Saudi Arabia and the wider Middle East: bilingual where useful, clean, operational, and focused on HR work rather than marketing decoration.

## Logo Concept

The default mark uses interlocking pathways to represent employees, managers, payroll, compliance, and field operations meeting in one governed HR system. The emerald and copper palette references Saudi business context without copying government symbols.

Avoid:

- government emblems, palm-and-sword language, or ministry-style marks;
- old source-project names in product UI;
- decorative gradients or stock-like imagery that weakens operational clarity;
- branding inside regulated payroll, banking, or authority file schemas.

## Asset Inventory

| Asset | Location | Use |
|---|---|---|
| Primary mark | `apps/web/public/brand/taazur-mark.svg` | Product shell, login, app icon |
| Bilingual lockup | `apps/web/public/brand/taazur-lockup.svg` | Reports, presentations, customer documents |
| Next app icon | `apps/web/app/icon.svg` | Framework icon metadata |
| Favicon | `apps/web/public/favicon.svg` | Browser tab and bookmarks |
| React lockup | `apps/web/components/brand/brand-lockup.tsx` | Product UI and tenant overrides |
| Shared config | `packages/config/src/brand.ts` | Metadata, web, email, and generated output defaults |

## Color System

| Token | Hex | Purpose |
|---|---:|---|
| Deep emerald | `#0B5D46` | Primary mark and trust signal |
| Mineral teal | `#80C9B2` | Secondary pathway and calm highlights |
| Copper gold | `#D7A24A` | Premium accent and key connection points |
| Ink green | `#092D23` | Headings and wordmark |
| Warm cream | `#F8F4E8` | Light surfaces and mark contrast |

## White-Label Configuration

Defaults are defined in `packages/config/src/brand.ts`. A dedicated deployment can override them with:

```dotenv
NEXT_PUBLIC_BRAND_NAME="Customer HR Portal"
NEXT_PUBLIC_BRAND_NAME_AR="بوابة موارد الشركة"
NEXT_PUBLIC_BRAND_LOGO_URL="/brand/customer-logo.svg"
NEXT_PUBLIC_BRAND_ACCENT="#0B5D46"
NEXT_PUBLIC_BRAND_ATTRIBUTION="Saudi Arabian company HRMS"
```

Leave values blank to use the default Saudi HRMS Portal identity.

## Generated Output Rules

- Page titles: `[Page] | Saudi HRMS Portal` or the tenant override.
- Reports and payslips: tenant/company identity first.
- Authority, bank, payroll, CSV, and XML files: use only official legal entity fields required by the relevant system.
- Customer-facing text should be concise, bilingual where useful, and operational.

## Accessibility

- The React lockup must expose readable text, not only flattened image text.
- Do not rely on color alone for statuses.
- Maintain WCAG AA contrast for body copy and controls.
- Arabic and English names must remain readable at 200% zoom.
