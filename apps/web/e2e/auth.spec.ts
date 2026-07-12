import { test, expect } from "@playwright/test";

test.describe("Authentication flow", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login");
    expect(page.url()).toContain("/login");
  });

  test("shows login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("shows signup page", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: "Create Account" })).toBeVisible();
  });

  test("shows validation errors on signup", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();
  });

  test("shows error on invalid login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText("Invalid email or password")).toBeVisible();
  });

  test("landing page shows sign in and get started buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Sign In" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Get Started" })).toBeVisible();
  });

  test("demo login redirects to dashboard", async ({ page }) => {
    await page.goto("/login");
    // The "Demo Login (one-click)" button auto-fills admin@demo.com / Demo@1234 and submits.
    // It uses next-auth redirect:true with callbackUrl="/", so the page navigates.
    await page.getByRole("button", { name: /Demo Login/i }).click();
    // After successful demo login the user is sent to "/", which the middleware
    // routes to the employee list. Wait for either of those to appear.
    await page.waitForURL(/\/(employees|dashboard|$)/, { timeout: 10_000 });
    // Smoke check: confirm we are no longer on /login.
    expect(page.url()).not.toContain("/login");
  });
});
