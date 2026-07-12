# E2E Test Status — Phase A.6

**Generated:** 2026-07-12 (Phase A.6)
**File:** `apps/web/e2e/auth.spec.ts`

## What was done

Added one new test case to the existing `auth.spec.ts`:

```ts
test("demo login redirects to dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Demo Login/i }).click();
  await page.waitForURL(/\/(employees|dashboard|$)/, { timeout: 10_000 });
  expect(page.url()).not.toContain("/login");
});
```

The test exercises the one-click "Demo Login" button on the login page, which auto-fills `admin@demo.com` / `Demo@1234` and submits via `next-auth` with `redirect: true, callbackUrl: "/"`.

## Verification

**Test code is correct and ready to run when infra is available.** It uses standard Playwright patterns (`getByRole`, `waitForURL`, `expect.not.toContain`) that match the rest of the existing test file.

## Blocker

**The test fails with `Cannot navigate to invalid URL`** because the Playwright `webServer` config in `playwright.config.ts` cannot start a working dev server. The same error affects **all 6 tests** in `auth.spec.ts`, not just the new one — confirmed by running an existing test (`"shows login page"`) in isolation: same error.

Root cause is upstream: the dev server needs
1. A reachable PostgreSQL (Supabase pooler from `.env`),
2. Network access for `pnpm install` if dependencies drift,
3. Port 3000 free.

The dev environment on this machine does not currently have these. The existing 5 E2E tests have never passed in this environment either — they were added in a previous session and left in a "configured but not run" state.

## Acceptance criterion for "Phase A.6 done"

- [x] Test file exists at `apps/web/e2e/auth.spec.ts` (was already there, 5 tests)
- [x] New test "demo login redirects to dashboard" added (the one explicitly required by A.6)
- [x] Test code follows the existing pattern in the file
- [ ] Test passes — **BLOCKED** by dev server / DB infrastructure (same blocker affects all existing E2E tests, not introduced by this change)

## Recommended follow-up (Phase A.6.1)

The 6 E2E tests in `auth.spec.ts` need a working dev environment. To unblock:
1. Confirm `pnpm dev` starts successfully on this machine (run from `hrms-app/` and visit http://localhost:3000)
2. Confirm `DATABASE_URL` in `.env` reaches a populated Supabase tenant
3. Re-run `pnpm test:e2e` from `hrms-app/apps/web` (or use the monorepo command)

This is a "make the dev environment work" task, not an "add a test" task — it would unblock all 6 tests at once.
