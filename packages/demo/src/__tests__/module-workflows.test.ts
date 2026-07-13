import { describe, expect, it } from "vitest";
import { demoWorkflows } from "../module-workflows";

const expectedSlugs = [
  "people-organization",
  "company-onboarding",
  "payroll-settlement",
  "time-leave-attendance",
  "documents-certificates",
  "notifications-reports",
  "recruitment",
  "onboarding",
  "offboarding",
  "learning-skills",
  "benefits-rewards",
  "government-integrations",
  "nitaqat-compliance",
  "ai-intelligence",
  "performance-goals",
  "engagement-retention",
  "travel-expenses",
  "employee-relations",
  "mobile-self-service",
  "workflow-automation",
  "people-analytics",
  "integration-marketplace",
];

describe("operational demo workflows", () => {
  it("defines an executable workflow for every customer workspace", () => {
    expect(Object.keys(demoWorkflows).sort()).toEqual([...expectedSlugs].sort());
    for (const workflow of Object.values(demoWorkflows)) {
      expect(workflow.metrics.length).toBeGreaterThanOrEqual(3);
      expect(workflow.records.length).toBeGreaterThan(0);
      expect(workflow.actions.length).toBeGreaterThan(0);
    }
  });

  it("labels every external-authority action as a mock operation", () => {
    const government = demoWorkflows["government-integrations"];
    expect(government).toBeDefined();
    if (!government) throw new Error("Government workflow is missing");
    expect(government.mode).toBe("mock");
    expect(government.actions.every((action) => action.result.includes("MOCK"))).toBe(true);
  });

  it("provides employee-safe expense submission", () => {
    const expenses = demoWorkflows["travel-expenses"];
    expect(expenses).toBeDefined();
    if (!expenses) throw new Error("Travel and expense workflow is missing");
    expect(expenses.allowedRoles).toContain("employee");
    expect(expenses.actions.some((action) => action.id === "submit-expense")).toBe(true);
  });
});
