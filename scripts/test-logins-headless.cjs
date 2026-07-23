const path = require("path");
const playwright = require(path.resolve(__dirname, "../node_modules/@playwright/test"));

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

const TEST_ACCOUNTS = [
  { role: "HR Manager (Named)", email: "reem.alharbi@rukn-energy.example", pass: "Rukn2026!" },
  { role: "HR Specialist (Named)", email: "aisha.alotaibi@rukn-energy.example", pass: "Rukn2026!" },
  { role: "Dept Manager (Named)", email: "fahad.alqahtani@rukn-energy.example", pass: "Rukn2026!" },
  { role: "Employee (Named)", email: "omar.aldossary@rukn-energy.example", pass: "Rukn2026!" },
  { role: "SuperAdmin (Generic)", email: "superadmin@rukn-energy.example", pass: "RuknDemo@2026" },
  { role: "HR Manager (Generic)", email: "hrmanager@rukn-energy.example", pass: "RuknDemo@2026" },
  { role: "Employee (Generic)", email: "employee@rukn-energy.example", pass: "RuknDemo@2026" },
  { role: "Taazur Admin", email: "admin@taazur.example", pass: "TaazurDemo@2026" },
];

async function runHeadlessLoginTests() {
  console.log(`Starting headless browser test against ${BASE_URL}...\n`);
  const browser = await playwright.chromium.launch({ headless: true });

  let passedCount = 0;

  for (const acc of TEST_ACCOUNTS) {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });

      await page.fill("#email", acc.email);
      await page.fill("#password", acc.pass);
      await page.click("button[type='submit']");

      // Wait for navigation away from login
      await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });

      const currentUrl = page.url();
      console.log(` ✓ [PASS] ${acc.role.padEnd(24)} | ${acc.email} -> ${currentUrl}`);
      passedCount++;
    } catch (err) {
      console.error(` ✗ [FAIL] ${acc.role.padEnd(24)} | ${acc.email} -> ${err.message}`);
    } finally {
      await context.close();
    }
  }

  await browser.close();

  console.log(`\nResults: ${passedCount} / ${TEST_ACCOUNTS.length} logins passed in headless mode.`);
  if (passedCount < TEST_ACCOUNTS.length) {
    process.exit(1);
  }
}

runHeadlessLoginTests().catch((err) => {
  console.error("Headless test script error:", err);
  process.exit(1);
});
