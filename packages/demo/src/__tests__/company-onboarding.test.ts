import { describe, expect, it } from "vitest";
import {
  activateCompanyOnboarding,
  companyOnboardingFixture,
  companyOnboardingSteps,
  getCompanyOnboardingProgress,
  validateCompanyOnboardingStep,
} from "../company-onboarding";

describe("company onboarding", () => {
  it("provides a fully valid Rukn Energy onboarding fixture", () => {
    for (const step of companyOnboardingSteps) {
      expect(validateCompanyOnboardingStep(companyOnboardingFixture, step.id)).toEqual({});
    }

    expect(getCompanyOnboardingProgress(companyOnboardingFixture)).toBe(100);
  });

  it("blocks activation until critical company setup is complete", () => {
    const incomplete = structuredClone(companyOnboardingFixture);
    incomplete.company.crNumber = "123";
    incomplete.locations.branches = incomplete.locations.branches.map((branch) => ({
      ...branch,
      isHeadquarters: false,
    }));
    incomplete.payroll.iban = "SA123";

    expect(activateCompanyOnboarding(incomplete)).toEqual({
      activated: false,
      progress: 25,
      blockedSteps: ["company", "locations", "payroll"],
      message: "Complete 3 onboarding steps before activation.",
    });
  });

  it("activates a complete company with an auditable reference", () => {
    expect(activateCompanyOnboarding(companyOnboardingFixture)).toEqual({
      activated: true,
      progress: 100,
      blockedSteps: [],
      activationReference: "ONB-DEMO-1010987654",
      message: "Company workspace activated for the operational demo.",
    });
  });
});
