# Taāzur Brand Guidelines

## 1. Brand identity

**English name:** Taāzur
**Arabic name:** تآزر
**Platform attribution:** powered by UDS-Noon JV
**Meaning:** synergy, mutual support, and people working as one.

Taāzur is the default product brand for the shared Saudi HRMS platform. A customer deployment may replace the display name, Arabic name, logo, and accent through supported brand configuration without changing source code. Platform attribution remains visible by default.

## 2. Logo concept

The mark combines two interlocking pathways. Each pathway can be read as a person, a team connection, or an operational flow. The shared center represents a trusted source of truth. Two copper dots reference the rhythm of Arabic tā’ without drawing a literal letterform. The central copper diamond is the governed hand-off where people, payroll, compliance, and talent workflows meet.

The mark deliberately avoids:

- the Saudi palm and crossed swords;
- ministry/government visual language;
- generic handshakes;
- copied letterforms or competitor marks;
- gradients that fail in print or at small sizes.

## 3. Asset inventory

| Asset | Location | Use |
|---|---|---|
| Primary mark | `apps/web/public/brand/taazur-mark.svg` | Product shell, login, app icon |
| Bilingual lockup | `apps/web/public/brand/taazur-lockup.svg` | Reports, presentations, social/marketing |
| Next app icon | `apps/web/app/icon.svg` | Framework-generated icon metadata |
| Favicon | `apps/web/public/favicon.svg` | Browser tab/bookmark |
| Reusable UI component | `apps/web/components/brand/brand-lockup.tsx` | Product pages and tenant overrides |
| Shared config | `packages/config/src/brand.ts` | Metadata, web, emails, generated outputs |

SVG is the source of truth. Convert to PNG/WebP only for channels that cannot accept SVG.

## 4. Color system

| Token | Hex | Purpose |
|---|---:|---|
| Deep emerald | `#0B5D46` | Primary mark, trust, Saudi market context |
| Mineral teal | `#80C9B2` | Secondary pathway, human warmth |
| Copper gold | `#D7A24A` | Connection points, premium accent |
| Ink green | `#092D23` | Headings and wordmark |
| Warm cream | `#F8F4E8` | Mark stroke and warm surface |

Do not place the primary mark on a low-contrast green background. Use the full-color mark on white/cream or the supplied emerald tile on dark surfaces.

## 5. Typography

- Latin UI: Inter/system sans; concise, dense, legible.
- Arabic UI: Cairo for interface text, Amiri only for selective editorial or ceremonial headings.
- Keep `Taāzur` with the macron over the second `a` in formal brand usage.
- Keep Arabic as `تآزر`, including the madda.

## 6. Lockup rules

1. Keep the mark and bilingual name together in top-level navigation, authentication, generated reports, and customer-facing documents.
2. Show `powered by UDS-Noon JV` directly below the product/customer name in the default lockup.
3. Minimum digital mark size: 24 px; recommended navigation size: 36–48 px.
4. Clear space: at least one copper-dot diameter around the mark.
5. Do not rotate, stretch, recolor individual pathways, add shadows inside the SVG, or overlay text.

## 7. White-label configuration

Defaults are defined in `packages/config/src/brand.ts`. A dedicated deployment can override them with:

```dotenv
NEXT_PUBLIC_BRAND_NAME="Customer People"
NEXT_PUBLIC_BRAND_NAME_AR="موظفو العميل"
NEXT_PUBLIC_BRAND_LOGO_URL="/brand/customer-logo.svg"
NEXT_PUBLIC_BRAND_ACCENT="#0B5D46"
NEXT_PUBLIC_BRAND_ATTRIBUTION="powered by UDS-Noon JV"
```

Leave values blank to use Taāzur. The same `Partial<BrandConfig>` interface is designed to accept tenant-level settings later when a Supabase migration is approved and credentials are available.

## 8. Generated-output rules

- Page titles: `[Page] | Taāzur` or tenant override.
- Reports: tenant/company identity first; Taāzur platform lockup in header/footer.
- Payslips and offer letters: employing company remains the legal issuer; Taāzur appears only as platform attribution.
- Emails: default `appName` is Taāzur, but tenant/company may override it.
- CSV/XML authority files: do not insert marketing branding into regulated schemas; use only official legal entity fields required by the authority.

## 9. Accessibility

- Mark has an accessible name in the React component.
- Lockup text remains real HTML, not flattened into the logo image.
- Do not rely on copper/green color alone for statuses.
- Maintain WCAG AA contrast for body copy and controls.
- Arabic and English names remain readable at 200% zoom.

## 10. Ownership and review

This identity was created specifically for this repository as editable vector geometry; no image-generation provider was available during production. Before trademark filing:

1. run Arabic and Latin word-mark searches;
2. run visual similarity searches across Nice classes relevant to SaaS, HR, and business software;
3. verify domain/social availability;
4. ask Saudi trademark counsel to review registrability and government-emblem restrictions;
5. convert final approved text to vector outlines in a professional design tool.

An internal visual score cannot guarantee legal registrability.
