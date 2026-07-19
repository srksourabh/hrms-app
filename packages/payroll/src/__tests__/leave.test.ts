import { describe, it, expect } from "vitest";
import { SaudiLeaveEngine } from "../leave";

function annualDays(nationality: "saudi" | "expat", hireDate: string, asOf: string): number {
  const engine = new SaudiLeaveEngine(
    { id: "e1", nationality, hireDate, salaryBasic: 10000, salaryHousing: 0, salaryTransport: 0 },
    asOf,
  );
  const annual = engine.entitlements().find((e) => e.type === "annual");
  return annual?.daysPerYear ?? 0;
}

describe("annual leave entitlement (Article 111 — tenure-based)", () => {
  it("LEV-001: 1 year of service = 21 days (Saudi)", () => {
    expect(annualDays("saudi", "2025-07-01", "2026-07-01")).toBe(21);
  });

  it("1 year of service = 21 days (expat) — same as Saudi", () => {
    expect(annualDays("expat", "2025-07-01", "2026-07-01")).toBe(21);
  });

  it("6 years of service = 30 days (Saudi)", () => {
    expect(annualDays("saudi", "2020-01-01", "2026-07-01")).toBe(30);
  });

  it("6 years of service = 30 days (expat) — tenure, not nationality", () => {
    expect(annualDays("expat", "2020-01-01", "2026-07-01")).toBe(30);
  });

  it("exactly at the 5-year boundary still gets 21 (>5 required for 30)", () => {
    // hired 2021-07-01, asOf 2026-07-01 → ~5.0 years → not yet >5
    expect(annualDays("saudi", "2021-07-01", "2026-07-01")).toBe(21);
  });
});
