const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

const ACCOUNTS = [
  { role: "HR Manager (Named)", email: "reem.alharbi@rukn-energy.example", pass: "Rukn2026!" },
  { role: "HR Specialist (Named)", email: "aisha.alotaibi@rukn-energy.example", pass: "Rukn2026!" },
  { role: "Dept Manager (Named)", email: "fahad.alqahtani@rukn-energy.example", pass: "Rukn2026!" },
  { role: "Employee (Named)", email: "omar.aldossary@rukn-energy.example", pass: "Rukn2026!" },
];

async function verifyLogins() {
  console.log(`\n==================================================`);
  console.log(` VERIFYING USER CREDENTIAL LOGINS (${BASE_URL})`);
  console.log(`==================================================\n`);

  let successCount = 0;

  for (const acc of ACCOUNTS) {
    const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.csrfToken;
    const setCookie = csrfRes.headers.get("set-cookie") || "";

    const params = new URLSearchParams({
      csrfToken,
      email: acc.email,
      password: acc.pass,
      json: "true",
      callbackUrl: `${BASE_URL}/`,
    });

    const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": setCookie,
      },
      body: params.toString(),
      redirect: "manual",
    });

    const status = loginRes.status;
    const location = loginRes.headers.get("location") || "";
    const isSuccess = (status === 302 || status === 303 || status === 200) && !location.includes("error=CredentialsSignin");

    if (isSuccess) {
      console.log(` ✓ [PASS 200/302] ${acc.role.padEnd(24)} | ${acc.email.padEnd(38)} | OK`);
      successCount++;
    } else {
      console.error(` ✗ [FAIL ${status}]   ${acc.role.padEnd(24)} | ${acc.email.padEnd(38)} | Location: ${location}`);
    }
  }

  console.log(`\n==================================================`);
  console.log(` RESULTS: ${successCount} / ${ACCOUNTS.length} logins verified successfully.`);
  console.log(`==================================================\n`);
}

verifyLogins().catch(console.error);
