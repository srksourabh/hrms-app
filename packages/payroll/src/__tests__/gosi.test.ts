import { describe, it, expect } from "vitest";
import { calculateGosi } from "../gosi";

const gosiInput = (overrides: Record<string, unknown> = {}) => ({
  nationality: "saudi" as const,
  gosiRegistrationDate: "2020-01-15",
  salaryBasic: 10000,
  salaryHousing: 2000,
  ...overrides,
});

describe("calculateGosi", () => {
  it("returns zero pension for expat employees (only occ.haz employer applies)", () => {
    const result = calculateGosi(gosiInput({ nationality: "expat" }));
    expect(result.pension.employee).toBe(0);
    expect(result.pension.employer).toBe(0);
    // occ.haz applies to ALL employees including expats
    expect(result.occupationalHazards.employer).toBe(240); // 2% of (10000+2000)
    expect(result.saned.employee).toBe(0); // SANED is Saudi-only
  });

  it("calculates Saudi old-system rates with corrected SANED and occ.haz", () => {
    const result = calculateGosi(gosiInput({ nationality: "saudi", salaryBasic: 10000, salaryHousing: 2000 }));
    // base = 10000 + 2000 = 12000
    // Pension: 9% employee / 10% employer
    expect(result.pension.employee).toBe(1080);       // 9% × 12000
    expect(result.pension.employer).toBe(1200);        // 10% × 12000
    // SANED: 0.75% each side (corrected from 2% employer-only)
    expect(result.saned.employee).toBe(90);            // 0.75% × 12000
    expect(result.saned.employer).toBe(90);            // 0.75% × 12000
    // Occ.haz: 2% employer — applies to ALL employees
    expect(result.occupationalHazards.employer).toBe(240); // 2% × 12000
    // Total employee = pension + SANED_employee
    expect(result.totalEmployeeCost).toBe(1170);       // 1080 + 90
    // Total employer = pension + SANED + occ.haz
    expect(result.totalEmployerCost).toBe(1530);       // 1200 + 90 + 240
  });

  it("caps the contributory base at SAR 45,000 / month", () => {
    const result = calculateGosi(gosiInput({ salaryBasic: 50000, salaryHousing: 0 }));
    // base = min(50000, 45000) = 45000
    expect(result.pension.employee).toBe(4050);        // 9% × 45000
    expect(result.pension.employer).toBe(4500);        // 10% × 45000
    expect(result.saned.employee).toBe(337.5);         // 0.75% × 45000 × 0.75
    expect(result.occupationalHazards.employer).toBe(900); // 2% × 45000
  });

  it("uses new-system escalating rates when registered on/after 2024-07-01", () => {
    // New-system with registration date 2024-08-01 and effective date 2024-08-15
    // → escalationYears = 0 → pension 9.5% each side
    const result = calculateGosi(gosiInput({
      gosiRegistrationDate: "2024-08-01",
      salaryBasic: 10000,
      salaryHousing: 0,
      effectiveDate: "2024-08-15",
    }));
    // base = 10000
    // New system (year 0): pension = 9.5% each side
    expect(result.pension.employee).toBe(950);         // 9.5% × 10000
    expect(result.pension.employer).toBe(950);         // 9.5% × 10000
    expect(result.saned.employee).toBe(75);            // 0.75% × 10000
    expect(result.occupationalHazards.employer).toBe(200); // 2% × 10000
  });

  it("applies Jul 2026 escalation rate for new system", () => {
    // Jul 2026 = year 2 of escalation → pension = 9.5% + 2×0.5% = 10.5%
    const result = calculateGosi(gosiInput({
      gosiRegistrationDate: "2024-08-01",
      salaryBasic: 10000,
      salaryHousing: 0,
      effectiveDate: "2026-07-01",
    }));
    expect(result.pension.employee).toBe(1050);        // 10.5% × 10000
    expect(result.pension.employer).toBe(1050);        // 10.5% × 10000
    expect(result.saned.employee).toBe(75);
    expect(result.occupationalHazards.employer).toBe(200);
  });
});
