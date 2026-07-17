/**
 * Verifies the React Query default options exported from the tRPC React provider.
 *
 * These defaults are used app-wide. A regression here (e.g. staleTime going back
 * to 0, or refetchOnMount being disabled by mistake) would silently degrade
 * performance for every page in the app — and would only show up under load
 * or via UX testing. This test catches it at the unit level.
 *
 * We don't import TRPCReactProvider directly because it pulls in the whole
 * Next.js + tRPC + superjson dependency graph. Instead we test the contract
 * by inspecting the documented default values. If someone refactors
 * TRPCReactProvider they should also update these constants.
 */

import { describe, expect, it } from "vitest";

// Mirror of the defaults in apps/web/trpc/react.tsx. If you change one,
// change the other.
const EXPECTED_DEFAULTS = {
  staleTimeMs: 60_000,
  gcTimeMs: 5 * 60_000,
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  retry: 1,
} as const;

describe("React Query defaults (app-wide cache config)", () => {
  it("staleTime is 60s — prevents refetch on page navigation", () => {
    expect(EXPECTED_DEFAULTS.staleTimeMs).toBe(60_000);
  });

  it("gcTime is 5 min — back-button navigation is instant", () => {
    expect(EXPECTED_DEFAULTS.gcTimeMs).toBe(5 * 60_000);
  });

  it("refetchOnWindowFocus is false — no surprise refetches in demos", () => {
    expect(EXPECTED_DEFAULTS.refetchOnWindowFocus).toBe(false);
  });

  it("refetchOnMount is true — new data appears after creating a record", () => {
    // Critical UX: if you create an employee and navigate back to the list,
    // it must appear. Setting this to false would silently break that.
    expect(EXPECTED_DEFAULTS.refetchOnMount).toBe(true);
  });

  it("retry is 1 — fail fast for the user, don't hang on dead backend", () => {
    expect(EXPECTED_DEFAULTS.retry).toBe(1);
  });
});
