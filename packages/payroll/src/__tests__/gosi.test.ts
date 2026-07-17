import { describe, it, expect } from "vitest";
import { calculateGosi } from "../gosi";
import type { EmployeeContext } from "../types";

const saudiEmployee = (overrides: Partial<EmployeeContext> = {}): EmployeeContext => ({
  id: "emp-1",
  fullName: "Saudi Employee",
  nationality: "saudi",
  gosiSystem: null,
  salaryBasic: 10000,
  salaryHousing: 2000,
  salaryTransport: 1000,
  hireDate: "2020-01-01",
  employmentStatus: "active",
  bankIbanEnc: "SA123456",
  gosiRegistrationDate: "2020-01-15",
  ...overrides,
});

describe("calculateGosi", () => {
  it("returns zero pension for expat employees (only occ.haz employer applies)", () => {
    const result = calculateGosi(saudiEmployee({ nationality: "expat" }));
    expect(result.pension.employee).toBe(0);
    expect(result.pension.employer).toBe(0);
    expect(result.occupationalHazards.employer).toBe(240); // 2% of (10000+2000)
  });

  it("calculates Saudi old-system rates (9% employee / 10% employer)", () => {
    // gosiSystem: "old" forces old rates regardless of registration date.
    const result = calculateGosi(
      saudiEmployee({ gosiSystem: "old", salaryBasic: 10000, salaryHousing: 2000, salaryTransport: 1000 }),
    );
    // base = 10000 + 2000 = 12000
    expect(result.pension.employee).toBe(1080);   // 9% × 12000
    expect(result.pension.employer).toBe(1200);   // 10% × 12000
    expect(result.saned.employer).toBe(240);       // 2% × 12000
  });

  it("caps the contributory base at SAR 45,000 / month", () => {
    const result = calculateGosi(
      saudiEmployee({ gosiSystem: "old", salaryBasic: 50000, salaryHousing: 0, salaryTransport: 0 }),
    );
    // base = min(50000, 45000) = 45000
    expect(result.pension.employee).toBe(4050);   // 9% × 45000
    expect(result.pension.employer).toBe(4500);   // 10% × 45000
  });

  it("uses new-system escalating rates when registered on/after 2024-07-01", () => {
    // New-system with registration date 2024-08-01 and effective date
    // 2024-08-15 → escalationYears = floor((2024-08-15 - 2024-07-01) / 365.25) = 0
    // → 11% employee / 11% employer.
    const result = calculateGosi({
      nationality: "saudi",
      gosiRegistrationDate: "2024-08-01",
      salaryBasic: 10000,
      salaryHousing: 0,
      effectiveDate: "2024-08-15",
    });
    // base = 10000
    expect(result.pension.employee).toBe(1100);   // 11% × 10000
    expect(result.pension.employer).toBe(1100);   // 11% × 10000
  });
});
