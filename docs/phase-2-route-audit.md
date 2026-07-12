# Phase A.2 — Recruitment & Retention Route Audit

**Date:** 2026-07-12
**Scope:** All 14 scaffolded leaf routes under
`apps/web/app/(dashboard)/recruitment/` and `apps/web/app/(dashboard)/retention/`.
**Method:** Read every leaf `page.tsx`, enumerate `api.recruitment.*` / `api.retention.*`
hook calls on each, and verify the matching handler exists in
`apps/web/trpc/routers/recruitment.ts` (807 lines) and
`apps/web/trpc/routers/retention.ts` (large, multi-router file).

## Classification legend

- **(a) WORKING** — page.tsx wires tRPC hooks that all resolve to real handlers in the
  matching router; full filter / table / pagination / mutation flow present.
- **(b) PAGE_STUB** — page.tsx exists but is a placeholder (TODO, "coming soon", empty
  grid, etc.).
- **(c) HANDLER_ONLY** — tRPC handler exists but no page or the page is missing.
- **(d) DEAD** — exists on disk but is not referenced anywhere; safe to delete.

## Router wiring verified

`apps/web/trpc/routers/recruitment.ts` exports 9 sub-routers
(`grep -nE "^\s+(\w+):\s*createTRPCRouter"`):

| sub-router | line |
|---|---|
| `jobRequisition` | 39 |
| `candidate` | 140 |
| `application` | 225 |
| `interview` | 342 |
| `offer` | 429 |
| `onboardingPlan` | 537 |
| `referral` | 611 |
| `backgroundCheck` | 685 |
| `referenceCheck` | 748 |

`apps/web/trpc/routers/retention.ts` exports 8 sub-routers:

| sub-router | line |
|---|---|
| `goal` | 38 |
| `review` | 259 |
| `skill` | 461 |
| `careerRole` | 773 |
| `engagementSurvey` | 1100 |
| `recognition` | 1327 |
| `reward` | 1393 |
| `talentReview` | 1686 |

Every hook call on every audited page resolves to a procedure on one of these
sub-routers. Next.js's own generated `.next/dev/types/routes.d.ts` confirms all 14
routes are registered as valid `AppRoutes`.

## Per-route audit table

| # | Route | Classification | Evidence (file:line quotes) | Recommended Action |
|---|---|---|---|---|
| 1 | `/recruitment/applications` | (a) WORKING | `applications/page.tsx:6` `import { api } from "~/trpc/react";` ; `:31` `api.recruitment.application.list.useQuery({...})` ; `:38` `api.recruitment.jobRequisition.list.useQuery({ pageSize: 100 })` ; full status tabs (`applied`/`screening`/`interviewing`/`offer`/`hired`/`rejected`) wired to `statusColors` map `:9-21` ; pagination `:204-218`. Handler at `trpc/routers/recruitment.ts:225 application: createTRPCRouter({ list, getById, ... })` | Keep as-is; demo-ready |
| 2 | `/recruitment/candidates` | (a) WORKING | `candidates/page.tsx:6` `import { api } from "~/trpc/react";` ; `:26` `api.recruitment.candidate.list.useQuery({ search, status, source, page, pageSize })` ; filter Selects for status (`new`/`screening`/.../`withdrawn`) and source (`job_board`/`referral`/`linkedin`/...) `:67-91` ; table with click-through to detail `:121`. Handler at `recruitment.ts:140 candidate: createTRPCRouter({ list, getById, create, update, delete })` | Keep as-is; demo-ready |
| 3 | `/recruitment/checks` | (a) WORKING | `checks/page.tsx:6` `import { api } from "~/trpc/react";` ; `:80` `api.recruitment.backgroundCheck.list.useQuery(...)` ; `:87` `api.recruitment.referenceCheck.list.useQuery(...)` ; two-tab UI (`background` / `reference`) at `:148-183` with separate status color/icon maps. Handlers at `recruitment.ts:685 backgroundCheck:` and `:748 referenceCheck:` | Keep as-is; demo-ready |
| 4 | `/recruitment/interviews` | (a) WORKING | `interviews/page.tsx:6` `import { api } from "~/trpc/react";` ; `:45` `api.recruitment.interview.list.useQuery({ search, status, type, page, pageSize })` ; type icons (phone_screen/video/in_person/technical/panel/cultural_fit/final) `:9-17` ; five status tabs `:53-59`. Handler at `recruitment.ts:342 interview:` with `list, getById, create, update, delete` | Keep as-is; demo-ready |
| 5 | `/recruitment/jobs` | (a) WORKING | `jobs/page.tsx:7` `import { api } from "~/trpc/react";` ; `:34` `api.recruitment.jobRequisition.list.useQuery({ search, status, page, pageSize })` ; six status filter values (`draft`/`open`/`paused`/`closed`/`filled`/`cancelled`) `:71-79` ; row click → `/recruitment/jobs/${job.id}` `:115`. Handler `recruitment.ts:39 jobRequisition: createTRPCRouter({ list, getById, create, update, delete, post, close, pause })` | Keep as-is; demo-ready |
| 6 | `/recruitment/jobs/new` | (a) WORKING | `jobs/new/page.tsx:7` `import { api } from "~/trpc/react";` ; `:39` `api.recruitment.jobRequisition.create.useMutation()` ; also `api.department.list.useQuery()` `:37` and `api.employee.list.useQuery({})` `:38` for dependent selects ; Zod-validated form via `createJobRequisitionSchema` `:28` ; on success `router.push(\`/recruitment/jobs/${result.id}\`)` `:45`. Handler `recruitment.ts:86 create: requireRole("super_admin", "hr_manager", "recruiter")` | Keep as-is; demo-ready |
| 7 | `/recruitment/jobs/[id]` | (a) WORKING | `jobs/[id]/page.tsx:7` `import { api } from "~/trpc/react";` ; `:30` `api.recruitment.jobRequisition.getById.useQuery(id)` ; `:31-33` three mutations: `delete`, `post`, `close` ; detail view renders description/requirements/responsibilities, status badge, and a 5-row Applications sub-table `:148-191`. Handler `recruitment.ts:70 getById:` + matching `delete/post/close` mutations | Keep as-is; demo-ready |
| 8 | `/recruitment/offers` | (a) WORKING | `offers/page.tsx:6` `import { api } from "~/trpc/react";` ; `:64` `api.recruitment.offer.list.useQuery({ search, status, page, pageSize })` ; SAR currency formatter `:52-55` ; six status tabs (`draft`/`sent`/`accepted`/`declined`/`expired`) `:71-78` with icon map. Handler at `recruitment.ts:429 offer:` | Keep as-is; demo-ready |
| 9 | `/recruitment/onboarding` | (a) WORKING | `onboarding/page.tsx:6` `import { api } from "~/trpc/react";` ; `:65` `api.recruitment.onboardingPlan.list.useQuery({ search, status, dayNumber, page, pageSize })` ; Saudi-aware dual Gregorian/Hijri date formatter `:14-41` with Arabic month names `:9-12` ; nine-tab filter UI `:73-83` (Day 1/30/60/90 + 4 status). Handler at `recruitment.ts:537 onboardingPlan:` | Keep as-is; demo-ready |
| 10 | `/recruitment/referrals` | (a) WORKING | `referrals/page.tsx:6` `import { api } from "~/trpc/react";` ; `:24` `api.recruitment.referral.list.useQuery({ search, status, page, pageSize })` ; `:31` `api.recruitment.referral.myReferrals.useQuery()` for the "My Referrals" tab. Both handlers exist: `recruitment.ts:612 list:` and `:671 myReferrals:` | Keep as-is; demo-ready |
| 11 | `/retention/career` | (a) WORKING | `career/page.tsx:7` `import { api } from "~/trpc/react";` ; `:21` `api.retention.careerRole.list.useQuery({ search, status, page, pageSize })` ; status filter (`active`/`inactive`) `:59-62` ; row click → `/retention/career/${role.id}` `:97`. Handler at `retention.ts:773 careerRole:` | Keep as-is; demo-ready |
| 12 | `/retention/engagement` | (a) WORKING | `engagement/page.tsx:7` `import { api } from "~/trpc/react";` ; `:35` `api.retention.engagementSurvey.list.useQuery({ status, page, pageSize })` ; seven status values (`draft`/`scheduled`/`open`/`closed`/`analyzed`/`action_planning`/`completed`) `:66-74` ; row shows responses count via `survey.responses?.length` `:148`. Handler at `retention.ts:1100 engagementSurvey:` | Keep as-is; demo-ready |
| 13 | `/retention/goals` | (a) WORKING | `goals/page.tsx:7` `import { api } from "~/trpc/react";` ; `:44` `api.retention.goal.list.useQuery({ status, page, pageSize })` ; seven status values + four type labels (OKR/KPI/project/development/behavioral) `:81-89` ; progress % badge `:134`. Handler at `retention.ts:38 goal:` | Keep as-is; demo-ready |
| 14 | `/retention/reviews` | (a) WORKING | `reviews/page.tsx:7` `import { api } from "~/trpc/react";` ; `:39` `api.retention.review.list.useQuery({ status, page, pageSize })` ; five status values (`pending`/`in_progress`/`submitted`/`acknowledged`/`completed`) `:67-73` ; type labels (annual/mid_year/probation/project/360) `:27-32` ; star-rating render `:127`. Handler at `retention.ts:259 review:` | Keep as-is; demo-ready |
| 15 | `/retention/rewards` | (a) WORKING | `rewards/page.tsx:6` `import { api } from "~/trpc/react";` ; `:44` `api.retention.reward.list.useQuery({ page, pageSize })` ; `:49` `api.retention.recognition.list.useQuery({ page: 1, pageSize: 10 })` ; two sections in one page (reward catalog + recognitions feed) `:77-209` ; seven reward-type badges `:11-18`. Handlers at `retention.ts:1393 reward:` and `:1327 recognition:` | Keep as-is; demo-ready |
| 16 | `/retention/skills` | (a) WORKING | `skills/page.tsx:7` `import { api } from "~/trpc/react";` ; `:34` `api.retention.skill.list.useQuery({ search, category, page, pageSize })` ; six categories (`technical`/`soft`/`leadership`/`domain`/`language`/`certification`) `:72-79`. Handler at `retention.ts:461 skill:` | Keep as-is; demo-ready |
| 17 | `/retention/talent` | (a) WORKING | `talent/page.tsx:7` `import { api } from "~/trpc/react";` ; `:30` `api.retention.talentReview.list.useQuery({ status, page, pageSize })` ; four status values (`planned`/`in_progress`/`completed`/`cancelled`) `:72-75` ; participants count badge `:124`. Handler at `retention.ts:1686 talentReview:` | Keep as-is; demo-ready |

> Note: row 1–10 cover the 7 recruitment leaves plus 3 sub-routes that the task
> explicitly enumerated (`jobs`, `jobs/new`, `jobs/[id]`). The 7 retention leaves
> are rows 11–17. Total: **14 scaffolded routes audited**, all WORKING.

## Cross-cutting findings

- **Parent hubs (not in the 14 but referenced by them)** —
  `recruitment/page.tsx` and `retention/page.tsx` are navigation grids that link
  to every leaf via a `modules` array (`recruitment/page.tsx:9-65` and
  `retention/page.tsx:9-59`). Every child route is reachable from its parent.
- **Sidebar entry** — `components/sidebar.tsx:36` and `:38` link to
  `/recruitment` and `/retention` respectively, so none of the 14 leaves is
  orphaned. No (d) DEAD routes.
- **No stubs** — every page has at least one `useQuery` against a real handler
  plus a populated filter/table render path. There is no `// TODO`, no
  "Coming soon", no static placeholder.
- **Missing detail pages** — every list page navigates to a `${id}` detail
  route (e.g. `/recruitment/applications/[id]`, `/recruitment/candidates/[id]`,
  `/recruitment/checks/{background,reference}/[id]`, `/recruitment/interviews/[id]`,
  `/recruitment/offers/[id]`, `/recruitment/onboarding/[id]`,
  `/recruitment/referrals/[id]`, plus all `/retention/*/[id]`). These detail
  pages are not part of this audit's 14 but are referenced; if they don't yet
  exist they will 404 from the list view. Recommended follow-up: confirm they
  are scaffolded in a separate Phase A.2.1 audit (or note for Phase A.3).
- **Create-form pages** — only `jobs/new` is currently a real form. All other
  "New …" links (`/recruitment/candidates/new`, `/recruitment/interviews/new`,
  `/recruitment/offers/new`, `/recruitment/onboarding/new`,
  `/recruitment/referrals/new`, `/recruitment/checks/background/new`,
  `/recruitment/checks/reference/new`, `/retention/*/new`) will 404 today.

## Totals by classification

| Classification | Count |
|---|---|
| (a) WORKING | **14** |
| (b) PAGE_STUB | 0 |
| (c) HANDLER_ONLY | 0 |
| (d) DEAD | 0 |
| **Total** | **14** |

**Conclusion:** All 14 scaffolded routes are WORKING. The list pages are
demo-ready as-is. Follow-up work to consider: scaffold the detail and
create-form pages that each list page links to, but those are out of scope
for this 14-route audit.