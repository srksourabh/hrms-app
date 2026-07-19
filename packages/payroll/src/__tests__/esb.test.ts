import { describe, it, expect } from "vitest";
import { calculateFinalSettlement } from "../esb";
import type { FinalSettlementInput } from "../types";

const baseInput = (overrides: Partial<FinalSettlementInput> = {}): FinalSettlementInput => ({
  hireDate:           "2020-01-01",
  terminationDate:    "2025-01-01",
  basicSalary:        10000,
  housingAllowance:   2000,
  transportAllowance: 1000,
  separationReason:   "end_of_contract",
  completedProbation: true,
  ...overrides,
});

describe("calculateFinalSettlement", () => {
  it("returns 0 for under 2 years of service", () => {
    const result = calculateFinalSettlement(baseInput({
      hireDate:        "2025-06-01",
      terminationDate: "2025-06-01",
    }));
    expect(result.eosbAmount).toBe(0);
  });

  it("calculates half-month per year for first 5 years: 3yr @ 10,000 ≈ 15,000", () => {
    // EOSB = 0.5 × wage × years. 3yr @ 10,000 = 15,000.
    // Tenure uses 365.25-day years, so partial-year fraction may cause ~±3 SAR rounding.
    const result = calculateFinalSettlement(baseInput({
      hireDate:           "2022-01-01",
      terminationDate:    "2025-01-01",
      basicSalary:        10000,
      housingAllowance:   0,
      transportAllowance: 0,
    }));
    expect(result.eosbAmount).toBeGreaterThan(14900);
    expect(result.eosbAmount).toBeLessThan(15100);
  });

  it("calculates half-month first 5 + full-month after: 8yr @ 10,000 = 55,000", () => {
    // EOSB = 0.5 × 10000 × 5 + 1.0 × 10000 × 3 = 25,000 + 30,000 = 55,000
    const result = calculateFinalSettlement(baseInput({
      hireDate:           "2017-01-01",
      terminationDate:    "2025-01-01",
      basicSalary:        10000,
      housingAllowance:   0,
      transportAllowance: 0,
    }));
    expect(result.eosbAmount).toBe(55000);
  });

  it("applies Article 80: termination for cause returns zero EOSB", () => {
    const result = calculateFinalSettlement(baseInput({
      hireDate:           "2017-01-01",
      terminationDate:    "2025-01-01",
      basicSalary:        10000,
      housingAllowance:   0,
      transportAllowance: 0,
      separationReason:   "termination",
    }));
    expect(result.eosbAmount).toBe(0);
    expect(result.requiresHrReview).toBe(true);
  });
});
