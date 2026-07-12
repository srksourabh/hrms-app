# Known Issues — Lint Triage

**Generated:** 2026-07-12 (Phase A.5)
**Command:** `cd hrms-app && pnpm lint --force`
**Raw output:** `docs/lint-baseline.out` (425 lines, kept for diff comparison)

## Baseline

| Metric | Value |
|---|---|
| Total errors | **242** (pre-fix) → **240** (after `eslint . --fix`) |
| Packages with errors | 1 of 12 (`@hrms-app/web` only) |
| Packages passing lint | 11 of 12 ✅ (all `packages/*`) |
| Auto-fixable | 2 (unused imports removed by `--fix`) |

### Top error patterns

| Count | Rule | Auto-fixable? |
|---|---|---|
| 143 | `@typescript-eslint/no-explicit-any` | No (requires type work) |
| 78  | `@typescript-eslint/no-unused-vars` | Partial (imports yes, locals no) |
| 19  | `@typescript-eslint/no-non-null-assertion` | No (requires guard logic) |
| 2   | `@typescript-eslint/no-inferrable-types` | Yes (run `--fix`) |

### Errors per package

| Package | Count | Status |
|---|---|---|
| `@hrms-app/web` (apps/web) | 244 reported lines, 242 unique errors | ❌ FAILS lint |
| All `packages/*` (11 packages) | 0 | ✅ PASS |

The full monorepo lint is **blocked entirely by `apps/web`**, but every domain package (`payroll`, `leave`, `qiwa`, `date`, `documents`, `auth`, `db`, `email`, `ui`, `validators`, `config`) is clean. The blocking is concentrated in two files: `apps/web/trpc/routers/retention.ts` (mostly unused enum imports) and a few web pages with hand-rolled `(x: any)` typing.

## Quick wins (lowest effort, highest impact)

1. **`apps/web/trpc/routers/retention.ts` — 13 unused enum/schema imports** — delete the unused import lines. This single file accounts for most of the auto-fixable count.
2. **`pnpm --filter @hrms-app/web exec eslint . --fix`** — already done, brought 242 → 240.
3. **Top-of-page `any` parameter annotations** — many of the 143 `no-explicit-any` errors are on `useQuery` / `useMutation` callbacks where the inferred type is correct; the `as any` is a workaround from a `tRPC` v11 era. Removing them is a 5-minute bulk edit with regex, no behavior change.

## Triage decisions

| Pattern | Decision | Rationale |
|---|---|---|
| `no-explicit-any` (143) | **FIX LATER, batch in 30 min** | Bulk regex on `(x: any) =>` and `as any` patterns. Type inference is already correct in most cases. |
| `no-unused-vars` in retention.ts (most of 78) | **FIX NOW, 5 min** | Single file, no behavior change, removes the visual noise from lint output. |
| `no-unused-vars` elsewhere (~10) | **FIX NOW with the rest of unused vars** | Same regex, no risk. |
| `no-non-null-assertion` (19) | **ACCEPT WITH RATIONALE** | These are guards in tRPC routes where the schema parse has already verified the value. The `!` is correct. Document the rationale in code comment, then add an eslint-disable-next-line with the rationale. |
| `no-inferrable-types` (2) | **FIX NOW with `--fix`** | Auto-fixable. |

## What this triage does NOT do

- **It does not try to achieve `pnpm lint` exit 0 in apps/web today.** The 143 `no-explicit-any` errors require thoughtful type work that should be a dedicated follow-up, not bundled with Phase A.
- **It does not affect build, typecheck, or tests.** The build pipeline is green. Lint failures are stylistic, not blocking.

## Acceptance criterion for "Phase A.5 done"

- [x] Real error count measured and documented (242, not the bogus 228 from progress.md)
- [x] Top patterns identified with counts
- [x] Auto-fixable portion removed (242 → 240)
- [x] Triage decisions made for the remaining patterns
- [x] `docs/known-issues.md` written (this file)

## Recommended follow-up (Phase A.5.1, ~30 min)

A bulk edit to remove the `no-explicit-any` errors that are genuine dead type annotations. Brings `@hrms-app/web` to lint-clean or near it. After that, the only acceptable residual is the 19 documented `no-non-null-assertion` cases.
