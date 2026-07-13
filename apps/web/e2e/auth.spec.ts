import { expect, test, type Page } from "@playwright/test";

type DemoLoginRole = "admin" | "hrSpecialist" | "departmentManager" | "employee";

const demoButtonNames: Record<DemoLoginRole, RegExp> = {
  admin: /HR Manager demo/i,
  hrSpecialist: /HR Specialist demo/i,
  departmentManager: /Department Manager demo/i,
  employee: /Employee demo/i,
};

async function loginAs(page: Page, role: DemoLoginRole) {
  await page.goto("/login");
  await page.getByRole("button", { name: demoButtonNames[role] }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe("Taāzur customer-demo journeys", () => {
  test("public authentication is branded and reports invalid credentials", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByText("Sign in to your Taāzur account")).toBeVisible();
    await expect(page.getByRole("main").getByText("powered by UDS-Noon JV")).toBeVisible();
    await expect(page.getByRole("button", { name: /HR Manager demo/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /HR Specialist demo/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Department Manager demo/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Employee demo/i })).toBeVisible();

    await page.getByLabel("Email").fill("invalid@taazur.example");
    await page.getByLabel("Password").fill("incorrect-password");
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("all four demo role buttons open the correct fixture session", async ({ page, context }) => {
    const roleJourneys = [
      { role: "admin", name: "Reem Al-Harbi", roleText: "hr manager" },
      { role: "hrSpecialist", name: "Aisha Al-Otaibi", roleText: "hr specialist" },
      { role: "departmentManager", name: "Fahad Al-Qahtani", roleText: "department manager" },
      { role: "employee", name: "Omar Nasser Al-Dossary", roleText: "employee" },
    ] as const;

    for (const journey of roleJourneys) {
      await loginAs(page, journey.role);
      await expect(page.getByText(journey.name, { exact: true }).first()).toBeVisible();
      await expect(page.getByText(journey.roleText, { exact: true }).first()).toBeVisible();

      if (journey.role === "hrSpecialist") {
        await expect(page.getByRole("link", { name: "Government links" })).toHaveCount(0);
        await expect(page.getByRole("link", { name: "Settings" })).toHaveCount(0);
      }

      if (journey.role === "departmentManager") {
        await expect(page.getByRole("link", { name: "Payroll" })).toHaveCount(0);
        await expect(page.getByRole("link", { name: "Documents" })).toHaveCount(0);
        await expect(page.getByRole("link", { name: "Nitaqat & compliance" })).toHaveCount(0);
        await expect(page.getByRole("link", { name: "Government links" })).toHaveCount(0);
        await expect(page.getByRole("link", { name: "Settings" })).toHaveCount(0);
      }

      await context.clearCookies();
    }
  });

  test("administrator can use the command center and all-workspace catalog", async ({ page }) => {
    await loginAs(page, "admin");
    await expect(page.getByRole("heading", { name: /Lead your workforce with clarity/i })).toBeVisible();
    await expect(page.getByText(/Rukn Energy Services \(Demo\)/)).toBeVisible();
    await expect(page.getByText("5 total profiles")).toBeVisible();

    await page.goto("/modules");
    await expect(page.getByRole("heading", { name: /Every HR capability/i })).toBeVisible();
    await expect(page.getByText("Operational product workspaces")).toBeVisible();
    await expect(page.getByText("Planned", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Preview", { exact: true })).toHaveCount(0);

    await page.getByPlaceholder(/Search payroll/).fill("travel");
    await expect(page.getByRole("heading", { name: "Travel, Expenses & Delegation" })).toBeVisible();
  });

  test("government workspace executes an explicitly mocked authority action", async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("/modules/government-integrations");
    await expect(page.getByRole("heading", { name: "Saudi government integration center" })).toBeVisible();
    await expect(page.getByText(/no authority call/i)).toBeVisible();

    await page.getByRole("button", { name: "Run Qiwa contract check" }).click();
    await expect(page.getByRole("status")).toContainText("MOCK Qiwa response accepted");
    await expect(page.getByText("Actions by Reem Al-Harbi")).toBeVisible();
  });

  test("administrator completes the company onboarding wizard", async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("/modules/company-onboarding");
    await expect(page.getByRole("heading", { name: "Set up your Saudi company" })).toBeVisible();
    await expect(page.getByText("Step 1 of 5")).toBeVisible();
    await expect(page.getByLabel("English legal name")).toHaveValue("Rukn Energy Services Company");

    await page.getByRole("button", { name: "Continue to Saudi compliance" }).click();
    await expect(page.getByText("Step 2 of 5")).toBeVisible();
    await page.getByRole("button", { name: "Continue to branches and work" }).click();
    await expect(page.getByText("2 configured branches")).toBeVisible();
    await page.getByRole("button", { name: "Continue to payroll setup" }).click();
    await expect(page.getByLabel("Payroll day")).toHaveValue("27");
    await page.getByRole("button", { name: "Review company setup" }).click();
    await expect(page.getByText("100% ready")).toBeVisible();

    await page.getByRole("button", { name: "Activate company workspace" }).click();
    await expect(page.getByRole("status")).toContainText("Company workspace activated");
    await expect(page.getByRole("status").getByText("ONB-DEMO-1010987654")).toBeVisible();
  });

  test("employee sees owned records and is denied company payroll", async ({ page }) => {
    await loginAs(page, "employee");
    await expect(page.getByRole("heading", { name: "Welcome, Omar" })).toBeVisible();
    await expect(page.getByText(/only Omar Nasser Al-Dossary's fictional records/i)).toBeVisible();
    await expect(page.getByText("Payroll", { exact: true })).toHaveCount(0);

    await page.goto("/payroll");
    await expect(page).toHaveURL(/\/?access=denied$/);
    await expect(page.getByRole("heading", { name: "Welcome, Omar" })).toBeVisible();

    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "Omar Nasser Al-Dossary" })).toBeVisible();
    await expect(page.getByText("Ownership scoped")).toBeVisible();
    await expect(page.getByText("National ID •••• 9182")).toBeVisible();
  });

  test("employee can execute personal expense workflow", async ({ page }) => {
    await loginAs(page, "employee");
    await page.goto("/modules/travel-expenses");
    await expect(page.getByRole("heading", { name: "Travel & expenses" })).toBeVisible();
    await page.getByRole("button", { name: "Submit expense" }).click();
    await expect(page.getByRole("status")).toContainText("Expense draft created");
    await expect(page.getByText("Actions by Omar Nasser Al-Dossary")).toBeVisible();
  });

  test("employee command center remains usable on a mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAs(page, "employee");
    await expect(page.getByRole("heading", { name: "Welcome, Omar" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Request leave/i })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
});
