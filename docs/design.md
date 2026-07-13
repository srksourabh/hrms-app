# Taāzur design system

## Product context

Taāzur is a Saudi HR & Payroll SaaS for MSMEs (5-250 employees). The design must signal trust, local authenticity (Saudi-first), and modern capability. Every visual choice is filtered through: "Would this feel right to an HR manager in Riyadh?"

---

## 1. Color system

### Palette philosophy

Green carries national weight in Saudi Arabia (flag, Islam, growth). We use it as a deliberate signal of local roots and stability, but contained to accent and primary roles -- not overwhelming the UI. Sand/clay tones root the palette in the landscape. Neutral grays handle the heavy lifting of dashboards and data tables.

| Token | HSL | Tailwind name | Role |
|---|---|---|---|
| --primary | 149 100% 21% | green-800 | Saudi flag green. Buttons, active nav, key highlights |
| --primary-foreground | 0 0% 100% | white | Text on primary surfaces |
| --brand-sand | 35 38% 85% | -- | Warm desert background for cards, banners |
| --brand-clay | 15 30% 50% | -- | Secondary elements, muted accents |
| --brand-gold | 42 100% 50% | amber-500 | Premium accent for compliance badges, achievements |
| --accent | 42 100% 50% | amber-500 | CTA hover states, premium indicators |
| --background | 0 0% 100% | white | Page backgrounds |
| --foreground | 220 14% 15% | slate-900 | Body text (dark, not pure black) |
| --muted | 210 20% 96% | slate-100 | Sidebar bg, secondary surfaces |
| --muted-foreground | 215 14% 45% | slate-500 | Secondary text, labels |
| --border | 214 20% 90% | slate-200 | Dividers, input borders |
| --ring | 149 60% 35% | green-600 | Focus rings |

Light mode uses warm neutrals (not cool grays) to feel approachable. Dark mode uses deep navy (221 39% 11%) instead of pure black -- the SKILL.md guidance against pure black for readability.

### Usage rules

- Primary green must never exceed 15% of any screen surface. It is a signal, not a wash.
- Sand (#E8D5C4) is the default card/surface background for dashboards, not pure white.
- Gold is reserved for one thing per page: the primary CTA, a compliance badge, or a data highlight. Never both.
- Data visualization uses a colorblind-safe palette: green, blue, orange, purple. Never red/green alone.

### Dark mode

Dark mode is designed first (80% of mobile KSA users keep it on). Primary green inverts to a lighter, desaturated variant (149 60% 40%). Sand becomes a warm dark tone (30 15% 15%). Gold retains its warmth.

---

## 2. Typography

### Font stack

| Script | Font | Weight | Use case |
|---|---|---|---|
| Latin (UI) | Inter | 400 / 500 / 600 / 700 | Dashboards, labels, data tables, body text |
| Arabic | IBM Plex Sans Arabic | 400 / 500 / 600 / 700 | All Arabic UI text (same family = consistent x-height) |
| Latin (display) | Inter | 700 | Headings, hero sections |

IBM Plex Sans Arabic is chosen over Cairo or Noto Sans Arabic because it pairs naturally with Inter (similar geometric construction) and has excellent weight matching at small sizes -- critical for dense dashboard UI.

### Type scale

| Step | Size | Weight | Line height | Use |
|---|---|---|---|---|
| xs | 12px | 400 | 1.4 | Captions, table footnotes |
| sm | 14px | 400 | 1.4 | Body, form labels, sidebar links |
| base | 16px | 400 | 1.5 | Paragraphs, card descriptions |
| lg | 18px | 500 | 1.4 | Section headers |
| xl | 20px | 600 | 1.3 | Card titles |
| 2xl | 24px | 600 | 1.3 | Page titles |
| 3xl | 30px | 700 | 1.2 | Dashboard welcome headers |

Mobile body minimum: 16px (prevents iOS auto-zoom on input focus, per SKILL.md rule).

### RTL handling

- `dir="rtl"` set at `<html>` level when Arabic is active
- Logical CSS properties used everywhere: `margin-inline-start` not `margin-left`, `padding-inline-end` not `padding-right`
- Single form component that swaps direction + validation messages by language
- Western Arabic numerals (1, 2, 3) throughout UI -- standard for Saudi digital interfaces

---

## 3. Design style

### Pattern: Neo-minimalism with cultural warmth

Clean layouts, generous whitespace, bento-grid card arrangements. Saudi identity shows through color and texture rather than overt decoration.

- **Cards**: Rounded (0.75rem), white or sand-background, subtle shadow (`shadow-sm`). No heavy glassmorphism -- it competes with data density.
- **Bento grid**: Dashboard home uses asymmetric card sizing. Primary metric cards get 2x width. Supporting data gets 1x. CSS Grid with subgrid for alignment.
- **Icons**: Lucide (consistent stroke, already in stack). No emoji as icons per SKILL.md rule. All icons at 20px in UI, 24px in navigation.
- **Elevation**: Three-tier shadow scale. Cards = `shadow-sm`. Modals = `shadow-lg`. Sidebar = `shadow-md` on the right edge in LTR (left edge in RTL).

### Anti-patterns to avoid

- Do not use Saudi flag green as a background wash (reads as too nationalistic for a B2B tool)
- Do not use overtly Islamic geometric patterns as decorative elements (distracting in a productivity context)
- Do not mix gold with yellow-toned greens (clashes and looks cheap)
- Do not use placeholder-only form labels (violates WCAG and SKILL.md form rules)
- Do not use red/green as the only indicators for status (colorblind users)

---

## 4. Layout

### Breakpoints

| Name | Width | Layout |
|---|---|---|
| mobile | < 768px | Single column, bottom nav |
| tablet | 768px - 1024px | Two column, collapsed sidebar |
| desktop | > 1024px | Full sidebar + main + optional details panel |

### Spacing

8px base unit (Tailwind spacing scale). Section gaps at 32px (spacing-8). Card padding at 24px (spacing-6). Inset gutters at 16px on mobile, 32px on desktop.

### Navigation

- Bottom nav on mobile (max 5 items: Dashboard, Employees, Payroll, Leave, More)
- Sidebar on desktop with collapsible sections
- Active nav item uses primary green left border + slightly heavier weight
- Breadcrumbs for any page deeper than 2 levels

---

## 5. Component guidelines

### Buttons

- Primary: green-800 bg, white text, 8px horizontal padding, rounded-md
- Secondary: slate-100 bg, slate-900 text
- Destructive: red-600 bg (not green, not gold)
- Ghost: transparent, for sidebar actions
- Loading state: spinner replaces icon, button disabled

### Forms

All inputs include:
- Visible `<label>` linked via `htmlFor`
- Helper text below the field (not placeholder)
- Inline validation on blur (not keystroke)
- Error message below the specific field, with red border + icon
- Password fields with show/hide toggle

### Data tables

- Striped rows (odd/even) for scanability
- Sortable headers with aria-sort
- Minimum tap target 44px for mobile action rows
- Pagination at bottom, not infinite scroll, for HR workflows

### Status indicators

- Active: green dot + "Active" text
- Pending: amber/gold dot + "Pending"
- Expired/Rejected: red dot + label
- Draft: slate dot + "Draft"

Never convey status by color alone -- always include accompanying text.

---

## 6. AI interface patterns

Taāzur includes AI agents. These get distinct visual treatment:

- AI-generated content is shown in a subtle tinted card with a sparkle icon
- Every AI action includes an explicit "undo" or "edit" affordance within reach
- Streaming responses use a gentle shimmer animation (300ms, respects reduced-motion)
- AI is always positioned as assistant, never autonomous -- user confirms before actions execute

---

## 7. Dark mode specifics

| Surface | Light | Dark |
|---|---|---|
| Page bg | white | hsl(221 39% 11%) |
| Card bg | hsl(35 38% 92%) | hsl(221 30% 16%) |
| Primary text | hsl(220 14% 15%) | hsl(210 20% 95%) |
| Muted text | hsl(215 14% 45%) | hsl(215 14% 65%) |
| Primary accent | hsl(149 100% 21%) | hsl(149 60% 40%) |
| Borders | hsl(214 20% 90%) | hsl(217 20% 25%) |

Dark mode reduces saturation on all colors by approximately 30% to prevent eye strain during long HR sessions.

---

## 8. Accessibility baseline

- All text: minimum 4.5:1 contrast ratio (WCAG AA)
- Touch targets: minimum 44x44px
- Focus rings: 2px solid primary-600 with 2px offset
- Reduced motion: all animations check `prefers-reduced-motion`; transitions become instant
- Screen readers: form errors use `aria-live="polite"`, icons use `aria-hidden="true"` with descriptive labels on parent elements

---

## 9. References

- SKILL.md priority table (UI/UX Pro Max): accessibility (critical) -> touch & interaction -> performance -> style -> layout -> typography & color
- Saudi flag green: #006C35
- Brand color psychology in KSA: Way Studio, May 2026
- HR dashboard patterns: Behance/Dribbble HR SaaS audit, Jul 2025
- Arabic RTL typography: Voxire 2026 guide
