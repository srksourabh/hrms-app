# Taāzur Production Latency and Resolution Analysis

> **Measured:** 2026-07-13
> **Production:** https://hrms-app-chi.vercel.app
> **Harness:** `apps/web/e2e/production-performance.mjs`
> **Raw evidence:** `test-results/performance/production-performance.json`

## Method

- Playwright Chromium against the public Vercel deployment.
- Seven representative public, administrator, and employee routes.
- Three fresh browser contexts per route; medians reported to limit browser-cache bias.
- Performance Navigation Timing plus buffered paint/layout observers.
- Six viewport sizes from 360×800 to 1920×1080.
- DOM checks for horizontal overflow, broken images, and primary heading presence.
- Visual review of mobile login, mobile employee dashboard, tablet admin dashboard, and full-HD admin dashboard.

This is a synthetic lab test from one client/network path, not real-user monitoring. Results can vary by geography, device CPU, Vercel region, and cold-start state.

## Aggregate latency

| Metric | Median | p95 | Range | Assessment |
|---|---:|---:|---:|---|
| TTFB | 54.5 ms | 57.5 ms | 49.9–69.2 ms | Excellent |
| HTML response end | 430.5 ms | 575.0 ms | 171.8–697.8 ms | Fast |
| DOM interactive | 584.0 ms | 742.6 ms | 353.1–825.5 ms | Fast |
| Full load | 665.2 ms | 742.8 ms | 353.3–825.7 ms | Fast |
| First Contentful Paint | 600.0 ms | 724.0 ms | 320.0–836.0 ms | Excellent |
| Largest Contentful Paint | 598.0 ms | 686.0 ms | 320.0–724.0 ms | Excellent |
| Cumulative Layout Shift | 0.000 | 0.000 | 0.000–0.000 | Excellent/stable |

## Route medians

| Route | TTFB | Response end | Full load | FCP | LCP | CLS |
|---|---:|---:|---:|---:|---:|---:|
| Public login | 54.5 ms | 172.9 ms | 358.1 ms | 324 ms | 324 ms | 0 |
| Admin dashboard | 50.9 ms | 430.5 ms | 682.7 ms | 672 ms | 672 ms | 0 |
| Module catalog | 54.7 ms | 429.8 ms | 731.6 ms | 684 ms | 596 ms | 0 |
| Government workspace | 54.7 ms | 448.4 ms | 668.3 ms | 600 ms | 600 ms | 0 |
| Employee dashboard | 55.3 ms | 413.0 ms | 618.8 ms | 576 ms | 576 ms | 0 |
| Employee profile | 56.2 ms | 457.4 ms | 706.0 ms | 624 ms | 624 ms | 0 |
| Employee expenses | 50.4 ms | 424.7 ms | 618.0 ms | 556 ms | 556 ms | 0 |

All measured routes returned HTTP 200. One module-catalog sample did not expose an LCP entry before collection; the route's other LCP samples were 596 ms and 684 ms, and no rendering failure was observed.

## Resolution matrix

Tested resolutions:

- 360×800 — compact Android/mobile
- 390×844 — modern mobile
- 768×1024 — tablet portrait
- 1366×768 — common laptop
- 1440×900 — desktop
- 1920×1080 — full HD

Pages checked at every resolution:

1. Public login
2. Employee dashboard
3. Administrator dashboard

Results across 18 page/viewport combinations:

- **Horizontal overflow:** 0 failures
- **Broken images:** 0
- **Missing primary headings:** 0
- **Mobile employee E2E overflow check:** passed

## Visual findings

### Mobile, 360–390 px

- Login form, Taāzur branding, language selector, credential fields, and both demo buttons remain accessible and readable.
- Employee dashboard stacks cards cleanly and retains large touch targets.
- Mobile navigation collapses to a menu button as expected.
- No horizontal clipping or broken imagery.
- The login page is 903 px tall, so 360×800 and 390×844 require a small vertical scroll to reach the trust footer. Authentication controls remain above it.
- The admin dashboard is functional but very long: 3,718 px at 360×800 and 3,686 px at 390×844. This is expected from stacking a dense command center, but it is not the ideal primary admin form factor.

### Tablet, 768×1024

- No clipping or horizontal overflow.
- The persistent 278 px desktop sidebar leaves a narrow main column, creating a 2,805 px page and more card wrapping than necessary.
- Recommended improvement: keep the sidebar collapsed/drawer-based until at least 1024 px, or provide a compact icon rail between 768 and 1023 px.

### Laptop and desktop, 1366–1920 px

- Dashboard width is used effectively, with balanced four-column metrics and a clear workspace/priority split.
- No excessive empty margins at 1920×1080; the hero and operational cards expand coherently.
- Information density and hierarchy are strongest at 1366 px and above.
- The employee dashboard fits within one viewport at 1440×900 and 1920×1080.

## Verdict

### Latency

**Production performance is strong.** No representative route exceeds 0.84 seconds for FCP or full load in the measured samples, TTFB remains below 70 ms, and layout shift is zero. There is no latency blocker for the customer demo.

### Resolution/responsiveness

**Responsive correctness passes across all tested sizes.** There are no overflow, broken-image, or missing-heading failures. The main opportunity is usability optimization rather than defect repair: collapse the admin sidebar at tablet width and optionally reduce mobile admin vertical density.

## Recommended next actions

1. Add Vercel Speed Insights or another RUM source to validate field performance by geography and device.
2. Run the harness from Saudi Arabia/Middle East infrastructure to measure the target-market network path.
3. Change the admin sidebar breakpoint so 768 px uses a drawer or compact rail.
4. Reduce login page's small vertical overflow by accounting for the footer in the viewport-height calculation.
5. Track performance budgets in CI: TTFB < 500 ms, LCP < 2.5 s, CLS < 0.1, and no horizontal overflow at supported viewports.
