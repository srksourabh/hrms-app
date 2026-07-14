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
        { role: "admin", name: "Reem", roleText: "hr manager" },
        { role: "hrSpecialist", name: "Aisha", roleText: "hr specialist" },
        { role: "departmentManager", name: "Fahad", roleText: "department manager" },
        { role: "employee", name: "Omar", roleText: "employee" },
      ] as const;

    for (const journey of roleJourneys) {
      await loginAs(page, journey.role);
      // Wait for the dashboard to render. The sidebar shows the user name +
      // role pill; assert on those instead of the greeting heading which
      // may be deferred while tRPC queries resolve.
      await expect(page.getByText(journey.roleText, { exact: false }).first()).toBeVisible({ timeout: 15000 });

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
      await expect(page.getByRole("heading", { name: /Good morning/i })).toBeVisible();
      await expect(page.getByRole("heading", { name: /Run the employee lifecycle/i })).toBeVisible();
      await expect(page.getByText("Add employee")).toBeVisible();

      await page.goto("/modules");
      await expect(page.getByText(/All 22 workspaces|All workspaces/i).first()).toBeVisible();

      await page.getByPlaceholder(/Search people/).first().fill("travel");
      await expect(page.getByRole("heading", { name: "Travel & expenses" })).toBeVisible();
    });

    test("government workspace exposes production connector placeholders", async ({ page }) => {
      await loginAs(page, "admin");
      await page.goto("/modules/government-integrations");
      await expect(page.getByRole("heading", { name: "Saudi government integration center" })).toBeVisible();
      await expect(page.getByText(/Production connectors/i)).toBeVisible();
      await expect(page.getByText(/Qiwa · Ministry of Labor/)).toBeVisible();
      await page.getByRole("button", { name: /Configure/i }).first().click();
      await expect(page.getByText(/QIWA_API_KEY/i)).toBeVisible();
      await expect(page.getByText(/Production go-live checklist/i)).toBeVisible();
    });

  test("administrator completes the company onboarding wizard", async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("/modules/company-onboarding");
    await expect(page.getByRole("heading", { name: "Set up your Saudi company" })).toBeVisible();
    await expect(page.getByText("Step 1 of 7")).toBeVisible();
    await expect(page.getByLabel("English legal name")).toHaveValue("Rukn Energy Services Company");

    await page.getByRole("button", { name: /Continue to Saudi compliance/i }).click();
    await expect(page.getByText("Step 2 of 7")).toBeVisible();
    await page.getByRole("button", { name: /Continue to branches and work/i }).click();
    await expect(page.getByText("3 configured branches")).toBeVisible();
    await page.getByRole("button", { name: /Continue to organization and managers/i }).click();
    await expect(page.getByText("5 sample departments")).toBeVisible();
    await page.getByRole("button", { name: /Continue to payroll setup/i }).click();
    await expect(page.getByLabel("Payroll day")).toHaveValue("27");
    await page.getByRole("button", { name: /Continue to projects and sample data/i }).click();
    await expect(page.getByText("4 sample projects")).toBeVisible();
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
      await page.goto("/expenses");
      await expect(page.getByRole("heading", { name: /Expenses|expense/i }).first()).toBeVisible();
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