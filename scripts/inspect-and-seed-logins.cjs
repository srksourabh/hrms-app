const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres.iefwhxxhrycaalhxkfgp:0uKNZKTCt9JjHonT@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function run() {
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected to Supabase PostgreSQL database.");

  // Check columns of users table
  const { rows: cols } = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`);
  console.log("Users table columns:", cols.map(c => c.column_name));

  const nameCol = cols.some(c => c.column_name === 'name') ? 'name' : (cols.some(c => c.column_name === 'full_name') ? 'full_name' : null);
  console.log("Name column found:", nameCol);

  // Get Rukn Energy tenant id
  const tenantId = "1ed8b6bd-3743-5000-8000-000000000001";

  // Real employee IDs in Rukn Energy schema
  const { rows: employees } = await client.query(`SELECT id, full_name FROM rukn_energy_services.employees LIMIT 20`);
  const reem = employees.find(e => e.full_name.includes("Reem"))?.id || "656d702d-7265-556d-8000-000000000000";
  const aisha = employees.find(e => e.full_name.includes("Aisha"))?.id || "656d702d-6169-5368-8100-000000000000";
  const fahad = employees.find(e => e.full_name.includes("Fahad"))?.id || "656d702d-6661-5861-8400-000000000000";
  const omar = employees.find(e => e.full_name.includes("Omar"))?.id || "656d702d-6f6d-5172-8000-000000000000";
  const mariam = employees.find(e => e.full_name.includes("Mariam"))?.id || "656d702d-6d61-5269-816d-000000000000";
  const noura = employees.find(e => e.full_name.includes("Noura"))?.id || "656d702d-6e6f-5572-8100-000000000000";

  const passRukn = "Rukn2026!";
  const passDemo = "RuknDemo@2026";
  const passTaazur = "TaazurDemo@2026";

  const hashRukn = await bcrypt.hash(passRukn, 10);
  const hashDemo = await bcrypt.hash(passDemo, 10);
  const hashTaazur = await bcrypt.hash(passTaazur, 10);

  const demoAccounts = [
    // Standard named logins (Rukn2026!)
    { email: "reem.alharbi@rukn-energy.example", role: "hr_manager", name: "Reem Al-Harbi", employeeId: reem, hash: hashRukn },
    { email: "aisha.alotaibi@rukn-energy.example", role: "hr_specialist", name: "Aisha Al-Otaibi", employeeId: aisha, hash: hashRukn },
    { email: "fahad.alqahtani@rukn-energy.example", role: "department_manager", name: "Fahad Al-Qahtani", employeeId: fahad, hash: hashRukn },
    { email: "omar.aldossary@rukn-energy.example", role: "employee", name: "Omar Al-Dossary", employeeId: omar, hash: hashRukn },

    // Generic role logins (RuknDemo@2026)
    { email: "superadmin@rukn-energy.example", role: "super_admin", name: "Demo Super Admin", employeeId: reem, hash: hashDemo },
    { email: "hrmanager@rukn-energy.example", role: "hr_manager", name: "Demo HR Manager", employeeId: reem, hash: hashDemo },
    { email: "hrspecialist@rukn-energy.example", role: "hr_specialist", name: "Demo HR Specialist", employeeId: aisha, hash: hashDemo },
    { email: "payrolladmin@rukn-energy.example", role: "payroll_admin", name: "Demo Payroll Admin", employeeId: mariam, hash: hashDemo },
    { email: "deptmanager@rukn-energy.example", role: "department_manager", name: "Demo Dept Manager", employeeId: fahad, hash: hashDemo },
    { email: "recruiter@rukn-energy.example", role: "recruiter", name: "Demo Recruiter", employeeId: noura, hash: hashDemo },
    { email: "employee@rukn-energy.example", role: "employee", name: "Demo Employee", employeeId: omar, hash: hashDemo },

    // Taazur domain aliases (TaazurDemo@2026)
    { email: "admin@taazur.example", role: "hr_manager", name: "Reem Al-Harbi", employeeId: reem, hash: hashTaazur },
    { email: "specialist@taazur.example", role: "hr_specialist", name: "Aisha Al-Otaibi", employeeId: aisha, hash: hashTaazur },
    { email: "manager@taazur.example", role: "department_manager", name: "Fahad Al-Qahtani", employeeId: fahad, hash: hashTaazur },
    { email: "employee@taazur.example", role: "employee", name: "Omar Al-Dossary", employeeId: omar, hash: hashTaazur },
  ];

  console.log("\nUpserting demo accounts...");

  for (const acc of demoAccounts) {
    const query = nameCol ? `
      INSERT INTO users (id, tenant_id, email, password_hash, ${nameCol}, role, employee_id, preferred_language, email_verified, failed_login_attempts, locked_until)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'en', NOW(), 0, NULL)
      ON CONFLICT (email) DO UPDATE SET
        tenant_id = EXCLUDED.tenant_id,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        ${nameCol} = EXCLUDED.${nameCol},
        employee_id = EXCLUDED.employee_id,
        failed_login_attempts = 0,
        locked_until = NULL;
    ` : `
      INSERT INTO users (id, tenant_id, email, password_hash, role, employee_id, preferred_language, email_verified, failed_login_attempts, locked_until)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'en', NOW(), 0, NULL)
      ON CONFLICT (email) DO UPDATE SET
        tenant_id = EXCLUDED.tenant_id,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        employee_id = EXCLUDED.employee_id,
        failed_login_attempts = 0,
        locked_until = NULL;
    `;
    const params = nameCol ? [tenantId, acc.email, acc.hash, acc.name, acc.role, acc.employeeId] : [tenantId, acc.email, acc.hash, acc.role, acc.employeeId];
    await client.query(query, params);
    console.log(` ✓ ${acc.email} (${acc.role})`);
  }

  // Also clear any lockouts across all existing users
  await client.query(`UPDATE users SET failed_login_attempts = 0, locked_until = NULL;`);
  console.log("\nUnlocked all user accounts.");

  // Test bcrypt comparison for sample user reem.alharbi@rukn-energy.example
  const { rows: testUsers } = await client.query(`SELECT email, password_hash FROM users WHERE email = 'reem.alharbi@rukn-energy.example'`);
  const matchRukn = await bcrypt.compare("Rukn2026!", testUsers[0].password_hash);
  console.log(`Test password match for reem.alharbi@rukn-energy.example with 'Rukn2026!': ${matchRukn ? "SUCCESS ✓" : "FAILED ✗"}`);

  console.log("\nAll demo users successfully upserted and verified!");
  await client.end();
}

run().catch((e) => {
  console.error("Error seeding users:", e);
  process.exit(1);
});
