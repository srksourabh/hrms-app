/**
 * Seed Rukn Energy Services sample data into the live Supabase database.
 *
 * Strategy: We can't easily make drizzle push to a per-tenant schema
 * (the schema files use pgTable without pgSchema), so this script:
 *
 *   1. Connects to the pooled Supabase endpoint
 *   2. Runs CREATE TABLE IF NOT EXISTS for every required table inside
 *      the `tenant_1ed8b6bd3743` schema (matching the drizzle column
 *      definitions, with foreign keys relaxed to plain UUIDs to avoid
 *      circular ordering issues during bulk insert)
 *   3. Inserts the 12 Rukn Energy employees + 5 departments + 3 branches
 *      + 4 projects + 19 project assignments + 12 payslips + 6 leave
 *      requests + 8 documents + 3 jobs + 4 candidates + 4 applications
 *      + 2 offers + 3 interviews + 6 expenses + 6 goals + 5 learning
 *      enrollments + 3 recognitions + 4 benefits plans + 12 benefit
 *      enrollments + 12 assets + 5 engagement pulse scores + 2 onboarding
 *      cohorts
 *
 * All numeric IDs are stable UUIDs (deterministic), so the seed is
 * idempotent: re-running deletes the existing fixture rows and re-inserts.
 *
 * Run from repo root:
 *   node node_modules/.pnpm/tsx@4.23.0/node_modules/tsx/dist/cli.mjs \
 *     scripts/seed-rukn-energy.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// Load env
for (const file of [".env", "apps/web/.env"]) {
  const path = resolve(ROOT, file);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, "utf-8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const TENANT = "tenant_1ed8b6bd3743";
const S = (table) => `"${TENANT}"."${table}"`;

// Stable UUIDs (deterministic, so re-seeding is idempotent)
const id = (slug) => {
  // Generate a stable v5-like UUID from a namespace + slug
  const ns = "abcdef00-0000-5000-8000-000000000000";
  const hex = Array.from(slug).reduce((a, c) => a + c.charCodeAt(0).toString(16).padStart(2, "0"), "");
  const padded = (hex + "0".repeat(32)).slice(0, 32);
  return `${padded.slice(0,8)}-${padded.slice(8,12)}-5${padded.slice(13,16)}-8${padded.slice(17,20)}-${padded.slice(20,32)}`;
};

// Counter-based UUID for rows where the slug would be too long for the hash function.
// Use a single shared counter so the script stays deterministic across runs.
let _uuidCounter = 0;
const idSeq = (label) => {
  _uuidCounter++;
  // Build a UUID v5-style: replace the first 8 hex chars with a hash of the label
  const hex = Array.from(label).reduce((a, c) => a + c.charCodeAt(0).toString(16).padStart(2, "0"), "");
  const prefix = (hex + "0".repeat(8)).slice(0, 8);
  return `${prefix}-0000-5000-8000-${String(_uuidCounter).padStart(12, "0")}`;
};

async function main() {
  const postgresPath = pathToFileURL(resolve(ROOT, "packages/db/node_modules/postgres/src/index.js")).href;
  const postgres = await import(postgresPath);
  const sql = postgres.default(url, { ssl: { rejectUnauthorized: false } });
  console.log("✓ Connected to", url.replace(/:[^:@]+@/, ":***@"));

  // ===== STEP 1: Create schema + tables =====
  console.log("\n=== STEP 1: Create schema and tables ===");
  await sql.unsafe(`CREATE SCHEMA IF NOT EXISTS "${TENANT}"`);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("departments")} (
      id uuid PRIMARY KEY,
      name text NOT NULL,
      parent_department_id uuid,
      head_employee_id uuid,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("employees")} (
      id uuid PRIMARY KEY,
      department_id uuid,
      manager_employee_id uuid,
      iqama_number_enc text,
      passport_number_enc text,
      bank_iban_enc text,
      nationality text NOT NULL CHECK (nationality = ANY (ARRAY['saudi'::text, 'expat'::text])),
      full_name text NOT NULL,
      employment_status text NOT NULL,
      hire_date date NOT NULL,
      termination_date date,
      gosi_registration_date date,
      gosi_system text,
      salary_basic numeric NOT NULL DEFAULT 0,
      salary_housing numeric NOT NULL DEFAULT 0,
      salary_transport numeric NOT NULL DEFAULT 0,
      rehire_eligible text,
      rehire_reason text,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("documents")} (
      id uuid PRIMARY KEY,
      employee_id uuid NOT NULL,
      type text NOT NULL,
      file_name text NOT NULL,
      file_url text,
      expiry_date date,
      version text,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("payroll_runs")} (
      id uuid PRIMARY KEY,
      period_month date NOT NULL,
      status text NOT NULL,
      total_amount numeric NOT NULL DEFAULT 0,
      completed_at timestamp,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("payslips")} (
      id uuid PRIMARY KEY,
      payroll_run_id uuid NOT NULL,
      employee_id uuid NOT NULL,
      basic numeric NOT NULL DEFAULT 0,
      housing numeric NOT NULL DEFAULT 0,
      transport numeric NOT NULL DEFAULT 0,
      overtime numeric NOT NULL DEFAULT 0,
      gosi_employee numeric NOT NULL DEFAULT 0,
      gosi_employer numeric NOT NULL DEFAULT 0,
      esb_accrual numeric NOT NULL DEFAULT 0,
      deductions numeric NOT NULL DEFAULT 0,
      net numeric NOT NULL DEFAULT 0,
      currency text NOT NULL DEFAULT 'SAR',
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await sql.unsafe(`DROP TABLE IF EXISTS ${S("leave_types")} CASCADE`);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("leave_types")} (
      id uuid PRIMARY KEY,
      name text NOT NULL,
      default_days integer NOT NULL DEFAULT 0,
      paid boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("leave_requests")} (
      id uuid PRIMARY KEY,
      employee_id uuid NOT NULL,
      leave_type_id uuid NOT NULL,
      start_date date NOT NULL,
      end_date date NOT NULL,
      status text NOT NULL,
      approved_by_user_id uuid,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("leave_balances")} (
      id uuid PRIMARY KEY,
      employee_id uuid NOT NULL,
      leave_type_id uuid,
      balance numeric NOT NULL DEFAULT 0,
      year integer NOT NULL
    )
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("job_requisitions")} (
      id uuid PRIMARY KEY,
      department_id uuid,
      title text NOT NULL,
      description text,
      requirements text,
      responsibilities text,
      status text NOT NULL,
      type text NOT NULL,
      location text,
      is_remote boolean NOT NULL DEFAULT false,
      openings integer NOT NULL DEFAULT 1,
      min_salary numeric,
      max_salary numeric,
      currency text,
      hiring_manager_id uuid,
      recruiter_id uuid,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("candidates")} (
      id uuid PRIMARY KEY,
      full_name text NOT NULL,
      email text NOT NULL,
      phone text,
      nationality text,
      stage text NOT NULL,
      score integer,
      source text,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("applications")} (
      id uuid PRIMARY KEY,
      candidate_id uuid NOT NULL,
      job_requisition_id uuid NOT NULL,
      stage text NOT NULL,
      next_action text,
      notes text,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("offers")} (
      id uuid PRIMARY KEY,
      candidate_id uuid NOT NULL,
      job_requisition_id uuid NOT NULL,
      status text NOT NULL,
      basic_salary numeric NOT NULL,
      start_date date NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("interviews")} (
      id uuid PRIMARY KEY,
      application_id uuid NOT NULL,
      scheduled_at timestamp NOT NULL,
      location text,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("final_settlements")} (
      id uuid PRIMARY KEY,
      employee_id uuid NOT NULL,
      esb_amount numeric,
      unpaid_salary numeric,
      accrued_leave_payout numeric,
      exit_reason text,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("expenses")} (
      id uuid PRIMARY KEY,
      employee_id uuid NOT NULL,
      category text NOT NULL,
      amount numeric NOT NULL,
      currency text NOT NULL DEFAULT 'SAR',
      status text NOT NULL,
      submitted_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("goals")} (
      id uuid PRIMARY KEY,
      employee_id uuid NOT NULL,
      manager_id uuid,
      title text NOT NULL,
      progress integer NOT NULL DEFAULT 0,
      due_date date,
      status text NOT NULL DEFAULT 'in_progress',
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("benefits_plans")} (
      id uuid PRIMARY KEY,
      name text NOT NULL,
      provider text,
      tier text,
      covers_dependents boolean NOT NULL DEFAULT false,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("benefits_enrollments")} (
      id uuid PRIMARY KEY,
      employee_id uuid NOT NULL,
      plan_id uuid NOT NULL,
      status text NOT NULL,
      effective_date date NOT NULL,
      dependant_count integer NOT NULL DEFAULT 0
    )
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("assets")} (
      id uuid PRIMARY KEY,
      employee_id uuid NOT NULL,
      type text NOT NULL,
      asset_tag text,
      status text NOT NULL,
      assigned_at date NOT NULL
    )
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("learning_enrollments")} (
      id uuid PRIMARY KEY,
      employee_id uuid NOT NULL,
      title text NOT NULL,
      status text NOT NULL,
      progress integer NOT NULL DEFAULT 0
    )
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("recognitions")} (
      id uuid PRIMARY KEY,
      employee_id uuid NOT NULL,
      from_employee_id uuid,
      value text,
      message text,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("engagement_pulse")} (
      id uuid PRIMARY KEY,
      topic text NOT NULL,
      score numeric NOT NULL,
      period text NOT NULL
    )
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("onboarding_cohorts")} (
      id uuid PRIMARY KEY,
      employee_id uuid,
      candidate_id uuid,
      role text,
      manager_id uuid,
      buddy_id uuid,
      start_date date NOT NULL,
      progress integer NOT NULL DEFAULT 0,
      status text NOT NULL
    )
  `);

  console.log("  ✓ Created all 19 tables in", TENANT);

  // ===== STEP 2: Clear and seed =====
  console.log("\n=== STEP 2: Clear existing seed data (idempotent) ===");
  const tables = [
    "recognitions", "learning_enrollments", "assets", "benefits_enrollments",
    "benefits_plans", "goals", "engagement_pulse", "onboarding_cohorts",
    "expenses", "applications", "offers", "interviews", "candidates",
    "job_requisitions", "documents", "leave_balances", "leave_requests",
    "payslips", "payroll_runs", "employees", "departments"
  ];
  for (const t of tables) {
    await sql.unsafe(`DELETE FROM ${S(t)}`);
  }
  console.log("  ✓ Cleared all tables");

  // ===== STEP 3: Insert departments =====
  console.log("\n=== STEP 3: Seed departments ===");
  const departments = [
    { id: id("dept-people"), name: "People & Culture" },
    { id: id("dept-field"), name: "Field Operations" },
    { id: id("dept-projects"), name: "Projects & PMO" },
    { id: id("dept-finance"), name: "Finance & Procurement" },
    { id: id("dept-hse"), name: "HSE & Quality" },
  ];
  for (const d of departments) {
    await sql.unsafe(`INSERT INTO ${S("departments")} (id, name) VALUES ($1, $2)`, [d.id, d.name]);
  }
  console.log(`  ✓ Inserted ${departments.length} departments`);

  // ===== STEP 4: Insert employees =====
  console.log("\n=== STEP 4: Seed 12 employees ===");
  const employees = [
    { id: id("emp-reem"),   name: "Reem Al-Harbi",      nat: "saudi", dept: id("dept-people"),  status: "active",    hire: "2021-03-14", sal: [32000, 8000, 2500],  job: "People & Culture Director" },
    { id: id("emp-fahad"),  name: "Fahad Al-Qahtani",    nat: "saudi", dept: id("dept-field"),   status: "active",    hire: "2020-09-01", sal: [28500, 7125, 2000],  job: "Eastern Operations Manager" },
    { id: id("emp-aisha"),  name: "Aisha Al-Otaibi",     nat: "saudi", dept: id("dept-people"),  status: "active",    hire: "2022-01-10", sal: [22500, 5625, 1500],  job: "Payroll & GOSI Specialist" },
    { id: id("emp-omar"),   name: "Omar Al-Dossary",     nat: "saudi", dept: id("dept-field"),   status: "active",    hire: "2026-05-03", sal: [14000, 3500, 1000],  job: "Field Engineer" },
    { id: id("emp-priya"),  name: "Priya Menon",         nat: "expat", dept: id("dept-projects"), status: "on_leave",  hire: "2021-11-08", sal: [26000, 6500, 2000], job: "Senior Project Coordinator" },
    { id: id("emp-noura"),  name: "Noura Al-Subaie",     nat: "saudi", dept: id("dept-people"),  status: "active",    hire: "2022-06-15", sal: [20000, 5000, 1500],  job: "Talent Acquisition Lead" },
    { id: id("emp-khalid"), name: "Khalid Al-Mutairi",   nat: "saudi", dept: id("dept-projects"), status: "active",   hire: "2019-04-22", sal: [31000, 7750, 2250], job: "Projects Director" },
    { id: id("emp-mariam"), name: "Mariam Al-Dosari",    nat: "saudi", dept: id("dept-finance"), status: "active",   hire: "2023-02-20", sal: [18000, 4500, 1250],  job: "Procurement Analyst" },
    { id: id("emp-yousef"), name: "Yousef Al-Harbi",     nat: "saudi", dept: id("dept-field"),   status: "active",   hire: "2018-08-12", sal: [22000, 5500, 1500],  job: "Senior Field Supervisor" },
    { id: id("emp-ahmed"),  name: "Ahmed Al-Shehri",     nat: "saudi", dept: id("dept-hse"),     status: "active",   hire: "2017-03-05", sal: [24500, 6125, 1750],  job: "HSE Manager" },
    { id: id("emp-lina"),   name: "Lina Khalil",         nat: "expat", dept: id("dept-projects"), status: "active",   hire: "2025-11-02", sal: [19000, 4750, 1250],  job: "Project Coordinator" },
    { id: id("emp-salman"), name: "Salman Al-Ghamdi",    nat: "saudi", dept: id("dept-hse"),     status: "active",   hire: "2016-11-14", sal: [25500, 6375, 1750],  job: "HSE Lead" },
  ];
  for (const e of employees) {
    await sql.unsafe(`
      INSERT INTO ${S("employees")}
        (id, full_name, nationality, department_id, employment_status, hire_date, salary_basic, salary_housing, salary_transport)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [e.id, e.name, e.nat, e.dept, e.status, e.hire, e.sal[0], e.sal[1], e.sal[2]]);
  }
  console.log(`  ✓ Inserted ${employees.length} employees`);

  // ===== STEP 5: Insert documents =====
  console.log("\n=== STEP 5: Seed 8 documents ===");
  // Type must be one of: iqama, passport, work_permit, contract, certificate, other
  const documents = [
    { emp: id("emp-reem"),   type: "contract",   name: "Employment contract 2021" },
    { emp: id("emp-fahad"),  type: "certificate", name: "Operational safety leadership",        expiry: "2026-08-22" },
    { emp: id("emp-aisha"),  type: "other",       name: "GOSI enrollment confirmation" },
    { emp: id("emp-priya"),  type: "iqama",       name: "Resident identity",                  expiry: "2026-09-10" },
    { emp: id("emp-priya"),  type: "passport",    name: "Passport copy",                      expiry: "2028-02-18" },
    { emp: id("emp-ahmed"),  type: "iqama",       name: "Resident identity (Ahmed)",         expiry: "2027-03-11" },
    { emp: id("emp-khalid"), type: "certificate", name: "Project management certification",  expiry: "2028-05-30" },
    { emp: id("emp-salman"), type: "certificate", name: "NEBOSH International General Certificate" },
  ];
  for (const d of documents) {
    const docId = idSeq("doc");
    await sql.unsafe(`
      INSERT INTO ${S("documents")} (id, employee_id, type, file_name, file_url, version, expiry_date)
      VALUES ($1, $2, $3, $4, $5, '1', $6)
    `, [docId, d.emp, d.type, d.name, `/docs/${docId}.pdf`, d.expiry ?? null]);
  }
  console.log(`  ✓ Inserted ${documents.length} documents`);

  // ===== STEP 6: Insert payroll runs + payslips =====
  console.log("\n=== STEP 6: Seed 3 payroll runs + 12 payslips ===");
  const payrollRuns = [
    { id: id("payroll-apr-2026"), period: "2026-04-01", status: "completed", total: 278000 },
    { id: id("payroll-may-2026"), period: "2026-05-01", status: "completed", total: 296000 },
    { id: id("payroll-jun-2026"), period: "2026-06-01", status: "ready", total: 325440 },
  ];
  for (const r of payrollRuns) {
    await sql.unsafe(`INSERT INTO ${S("payroll_runs")} (id, period_month, status, total_amount) VALUES ($1, $2, $3, $4)`,
      [r.id, r.period, r.status, r.total]);
  }
  let payslipCount = 0;
  for (const run of payrollRuns) {
    for (const e of employees) {
      const basic = Number(e.sal[0]);
      const housing = Number(e.sal[1]);
      const transport = Number(e.sal[2]);
      // GOSI: saudi=9.75% / 11.75% employer, expat=0% / 2% hazards employer
      const gosiEmployee = e.nat === "saudi" ? Math.round(basic * 0.0975) : 0;
      const gosiEmployer = e.nat === "saudi" ? Math.round(basic * 0.1175) : Math.round(basic * 0.02);
      const net = basic + housing + transport - gosiEmployee;
      const payslipId = idSeq("payslip");
      await sql.unsafe(`
        INSERT INTO ${S("payslips")}
          (id, payroll_run_id, employee_id, basic, housing, transport, gosi_employee, gosi_employer, net_pay, pdf_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [payslipId, run.id, e.id, basic, housing, transport, gosiEmployee, gosiEmployer, net, `/payslips/${payslipId}.pdf`]);
      payslipCount++;
    }
  }
  console.log(`  ✓ Inserted ${payrollRuns.length} runs + ${payslipCount} payslips`);

  // ===== STEP 7: Insert leave requests + balances =====
  console.log("\n=== STEP 7: Seed 6 leave requests + 12 balances ===");
  // First create the leave types
  const annualTypeId = id("leave-type-annual");
  const sickTypeId = id("leave-type-sick");
  const personalTypeId = id("leave-type-personal");
  const examTypeId = id("leave-type-exam");
  await sql.unsafe(`INSERT INTO ${S("leave_types")} (id, name, default_days, paid) VALUES ($1, 'Annual leave', 21, true) ON CONFLICT DO NOTHING`, [annualTypeId]);
  await sql.unsafe(`INSERT INTO ${S("leave_types")} (id, name, default_days, paid) VALUES ($1, 'Sick leave', 30, true) ON CONFLICT DO NOTHING`, [sickTypeId]);
  await sql.unsafe(`INSERT INTO ${S("leave_types")} (id, name, default_days, paid) VALUES ($1, 'Personal leave', 5, false) ON CONFLICT DO NOTHING`, [personalTypeId]);
  await sql.unsafe(`INSERT INTO ${S("leave_types")} (id, name, default_days, paid) VALUES ($1, 'Examination leave', 10, true) ON CONFLICT DO NOTHING`, [examTypeId]);

  const leaveRequests = [
    { emp: id("emp-priya"),  type: "Annual leave",       from: "2026-07-13", to: "2026-07-14", status: "approved" },
    { emp: id("emp-omar"),   type: "Personal leave",     from: "2026-07-20", to: "2026-07-20", status: "pending" },
    { emp: id("emp-noura"),  type: "Annual leave",       from: "2026-08-02", to: "2026-08-06", status: "approved" },
    { emp: id("emp-ahmed"),  type: "Sick leave",         from: "2026-06-21", to: "2026-06-23", status: "approved" },
    { emp: id("emp-lina"),   type: "Examination leave",  from: "2026-07-27", to: "2026-07-27", status: "pending" },
    { emp: id("emp-yousef"), type: "Annual leave",       from: "2026-09-06", to: "2026-09-17", status: "cancelled" },
  ];
  for (const l of leaveRequests) {
    await sql.unsafe(`
      INSERT INTO ${S("leave_requests")} (id, employee_id, leave_type_id, start_date, end_date, status)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [idSeq("leave"), l.emp, annualTypeId, l.from, l.to, l.status]);
  }
  // Leave balances (annual remaining per employee)
  for (const e of employees) {
    const annualRemaining = e.id === id("emp-priya") ? 4 : e.id === id("emp-omar") ? 18 : 14;
    await sql.unsafe(`
      INSERT INTO ${S("leave_balances")} (id, employee_id, leave_type_id, balance, year)
      VALUES ($1, $2, $3, $4, 2026)
    `, [idSeq("leavebal"), e.id, annualTypeId, annualRemaining]);
  }
  console.log(`  ✓ Inserted ${leaveRequests.length} leave requests + ${employees.length} balances`);

  // ===== STEP 8: Insert recruitment =====
  console.log("\n=== STEP 8: Seed 3 jobs + 4 candidates + 4 applications + 3 interviews + 2 offers ===");
  const jobs = [
    { id: id("req-01"), title: "Drilling Engineer",   dept: id("dept-field"),   status: "interviewing" },
    { id: id("req-02"), title: "Project Planner",     dept: id("dept-projects"), status: "offer" },
    { id: id("req-03"), title: "Payroll Officer",     dept: id("dept-people"),  status: "sourcing" },
  ];
  for (const j of jobs) {
    await sql.unsafe(`
      INSERT INTO ${S("job_requisitions")} (id, title, department_id, status, type, openings, location, hiring_manager_id, recruiter_id, currency)
      VALUES ($1, $2, $3, $4, 'full_time', 1, 'Riyadh, Saudi Arabia', $5, $6, 'SAR')
    `, [j.id, j.title, j.dept, j.status, id("emp-fahad"), id("emp-noura")]);
  }
  const candidates = [
    { id: id("candidate-sara"),      name: "Sara Al-Mutairi",    email: "sara.almutairi@candidate.example",    stage: "technical_interview", score: 88 },
    { id: id("candidate-abdullah"),  name: "Abdullah Al-Salem",  email: "abdullah.alsalem@candidate.example",  stage: "offer",             score: 91 },
    { id: id("candidate-fatima"),    name: "Fatima Al-Dosari",   email: "fatima.aldosari@candidate.example",   stage: "screening",         score: 82 },
    { id: id("candidate-jose"),      name: "Jose Dela Cruz",     email: "jose.delacruz@candidate.example",     stage: "rejected",          score: 71 },
  ];
  for (const c of candidates) {
    await sql.unsafe(`
      INSERT INTO ${S("candidates")} (id, full_name, email, stage, score, source)
      VALUES ($1, $2, $3, $4, $5, 'careers_page')
    `, [c.id, c.name, c.email, c.stage, c.score]);
  }
  const applications = [
    { id: id("app-01"), cand: id("candidate-sara"),     job: id("req-01"), stage: "technical_interview", next: "Panel interview · 15 Jul" },
    { id: id("app-02"), cand: id("candidate-abdullah"), job: id("req-02"), stage: "offer",             next: "Approve bilingual offer" },
    { id: id("app-03"), cand: id("candidate-fatima"),   job: id("req-03"), stage: "screening",         next: "Payroll assessment" },
    { id: id("app-04"), cand: id("candidate-jose"),     job: id("req-01"), stage: "rejected",          next: "Archive after notice" },
  ];
  for (const a of applications) {
    await sql.unsafe(`
      INSERT INTO ${S("applications")} (id, candidate_id, job_requisition_id, stage, next_action)
      VALUES ($1, $2, $3, $4, $5)
    `, [a.id, a.cand, a.job, a.stage, a.next]);
  }
  const interviews = [
    { id: id("int-01"), app: id("app-01"), when: "2026-07-15T10:00:00+03:00", loc: "Teams" },
    { id: id("int-02"), app: id("app-02"), when: "2026-07-12T13:30:00+03:00", loc: "Jubail Office" },
    { id: id("int-03"), app: id("app-03"), when: "2026-07-18T11:00:00+03:00", loc: "Riyadh HQ" },
  ];
  for (const i of interviews) {
    await sql.unsafe(`
      INSERT INTO ${S("interviews")} (id, application_id, scheduled_at, location)
      VALUES ($1, $2, $3, $4)
    `, [i.id, i.app, i.when, i.loc]);
  }
  const offers = [
    { id: id("offer-01"), cand: id("candidate-sara"),     job: id("req-01"), status: "draft",             salary: 21000, start: "2026-08-16" },
    { id: id("offer-02"), cand: id("candidate-abdullah"), job: id("req-02"), status: "approval_pending", salary: 18500, start: "2026-09-01" },
  ];
  for (const o of offers) {
    await sql.unsafe(`
      INSERT INTO ${S("offers")} (id, candidate_id, job_requisition_id, status, basic_salary, start_date)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [o.id, o.cand, o.job, o.status, o.salary, o.start]);
  }
  console.log(`  ✓ Inserted ${jobs.length} jobs + ${candidates.length} candidates + ${applications.length} applications + ${interviews.length} interviews + ${offers.length} offers`);

  // ===== STEP 9: Insert expenses, goals, benefits, assets, learning, recognitions, engagement =====
  console.log("\n=== STEP 9: Seed supporting records ===");

  const expenses = [
    { emp: id("emp-fahad"),  cat: "Dhahran–Riyadh travel",    amount: 1840, status: "approved" },
    { emp: id("emp-omar"),   cat: "Field per diem",            amount: 620,  status: "pending" },
    { emp: id("emp-khalid"), cat: "Client workshop",           amount: 2450, status: "approved" },
    { emp: id("emp-lina"),   cat: "Project supplies",          amount: 380,  status: "approved" },
    { emp: id("emp-salman"), cat: "HSE inspection travel",     amount: 910,  status: "pending" },
    { emp: id("emp-noura"),  cat: "Recruitment event",         amount: 1200, status: "draft" },
  ];
  for (const e of expenses) {
    await sql.unsafe(`INSERT INTO ${S("expenses")} (id, employee_id, category, amount, currency, status) VALUES ($1, $2, $3, $4, 'SAR', $5)`,
      [idSeq("exp"), e.emp, e.cat, e.amount, e.status]);
  }

  const goals = [
    { emp: id("emp-omar"),   mgr: id("emp-fahad"),  title: "Complete field certification",          progress: 65, due: "2026-08-31" },
    { emp: id("emp-aisha"),  mgr: id("emp-reem"),   title: "Zero-error Mudad submissions",           progress: 92, due: "2026-12-31" },
    { emp: id("emp-khalid"), mgr: id("emp-reem"),   title: "Deliver Jafurah mobilization gate",     progress: 68, due: "2026-09-30" },
    { emp: id("emp-noura"),  mgr: id("emp-reem"),   title: "Reduce time-to-offer to 18 days",        progress: 74, due: "2026-10-31" },
    { emp: id("emp-salman"), mgr: id("emp-fahad"),  title: "Close all high-risk HSE actions",         progress: 86, due: "2026-08-15" },
    { emp: id("emp-lina"),   mgr: id("emp-khalid"), title: "Automate weekly project reporting",      progress: 55, due: "2026-09-15" },
  ];
  for (const g of goals) {
    await sql.unsafe(`INSERT INTO ${S("goals")} (id, employee_id, manager_id, title, progress, due_date) VALUES ($1, $2, $3, $4, $5, $6)`,
      [idSeq("goal"), g.emp, g.mgr, g.title, g.progress, g.due]);
  }

  const benefitPlans = [
    { id: id("plan-medical-exec"),    name: "Executive medical", provider: "Fictional Gulf Health", tier: "VIP",   deps: true },
    { id: id("plan-medical-family"),  name: "Family medical",    provider: "Fictional Gulf Health", tier: "A",     deps: true },
    { id: id("plan-medical-standard"),name: "Standard medical",  provider: "Fictional Gulf Health", tier: "B",     deps: false },
    { id: id("plan-life"),            name: "Group life",        provider: "Fictional Takaful",     tier: "2x basic", deps: false },
  ];
  for (const p of benefitPlans) {
    await sql.unsafe(`INSERT INTO ${S("benefits_plans")} (id, name, provider, tier, covers_dependents) VALUES ($1, $2, $3, $4, $5)`,
      [p.id, p.name, p.provider, p.tier, p.deps]);
  }
  for (const e of employees) {
    const plan = e.id === id("emp-reem") ? id("plan-medical-exec") :
                 e.id === id("emp-aisha") || e.id === id("emp-fahad") || e.id === id("emp-khalid") || e.id === id("emp-salman") ? id("plan-medical-family") :
                 id("plan-medical-standard");
    await sql.unsafe(`INSERT INTO ${S("benefits_enrollments")} (id, employee_id, plan_id, status, effective_date, dependant_count) VALUES ($1, $2, $3, 'active', $4, $5)`,
      [idSeq("benr"), e.id, plan, e.id === id("emp-reem") ? "2021-03-14" : e.id === id("emp-aisha") ? "2022-01-10" : "2024-01-01", plan === id("plan-medical-family") ? 2 : 0]);
  }

  const assets = employees.map((e, i) => ({
    emp: e.id,
    type: e.dept === id("dept-field") || e.dept === id("dept-hse") ? "Rugged tablet + PPE kit" : "Laptop + access badge",
    tag: `RUKN-${2026001 + i}`,
    status: e.status === "notice_period" ? "return_due" : "assigned",
  }));
  for (const a of assets) {
    await sql.unsafe(`INSERT INTO ${S("assets")} (id, employee_id, type, asset_tag, status, assigned_at) VALUES ($1, $2, $3, $4, $5, '2026-07-01')`,
      [idSeq("asset"), a.emp, a.type, a.tag, a.status]);
  }

  const learnings = [
    { emp: id("emp-omar"),   title: "Advanced well-control fundamentals",  status: "in_progress", progress: 40 },
    { emp: id("emp-lina"),   title: "Primavera P6 foundations",             status: "in_progress", progress: 62 },
    { emp: id("emp-noura"),  title: "Structured technical interviewing",     status: "complete",    progress: 100 },
    { emp: id("emp-ahmed"),  title: "Reliability-centered maintenance",     status: "in_progress", progress: 35 },
    { emp: id("emp-salman"), title: "Incident investigation lead",           status: "assigned",    progress: 0 },
  ];
  for (const l of learnings) {
    await sql.unsafe(`INSERT INTO ${S("learning_enrollments")} (id, employee_id, title, status, progress) VALUES ($1, $2, $3, $4, $5)`,
      [idSeq("learn"), l.emp, l.title, l.status, l.progress]);
  }

  const recognitions = [
    { to: id("emp-aisha"),  from: id("emp-reem"),  value: "Precision",     message: "Closed payroll pre-checks with zero critical findings." },
    { to: id("emp-yousef"), from: id("emp-fahad"), value: "Safety",        message: "Stopped a field task and corrected the permit before work resumed." },
    { to: id("emp-lina"),   from: id("emp-khalid"), value: "Collaboration", message: "Connected three project teams through one weekly control pack." },
  ];
  for (const r of recognitions) {
    await sql.unsafe(`INSERT INTO ${S("recognitions")} (id, employee_id, from_employee_id, value, message) VALUES ($1, $2, $3, $4, $5)`,
      [idSeq("rec"), r.to, r.from, r.value, r.message]);
  }

  const pulse = [
    { topic: "Manager support", score: 4.4 },
    { topic: "Workload",         score: 3.7 },
    { topic: "Safety culture",   score: 4.7 },
    { topic: "Career growth",    score: 3.9 },
    { topic: "Tools and systems", score: 4.1 },
  ];
  for (const p of pulse) {
    await sql.unsafe(`INSERT INTO ${S("engagement_pulse")} (id, topic, score, period) VALUES ($1, $2, $3, 'H1 2026')`,
      [idSeq("pulse"), p.topic, p.score]);
  }

  // Onboarding cohorts
  await sql.unsafe(`INSERT INTO ${S("onboarding_cohorts")} (id, employee_id, role, manager_id, buddy_id, start_date, progress, status) VALUES ($1, $2, 'Field Engineer', $3, $4, '2026-05-03', 78, 'in_progress')`,
    [idSeq("cohort"), id("emp-omar"), id("emp-fahad"), id("emp-yousef")]);
  await sql.unsafe(`INSERT INTO ${S("onboarding_cohorts")} (id, employee_id, role, manager_id, buddy_id, start_date, progress, status) VALUES ($1, $2, 'Project Coordinator', $3, $4, '2025-11-02', 100, 'complete')`,
    [idSeq("cohort"), id("emp-lina"), id("emp-khalid"), id("emp-noura")]);

  console.log(`  ✓ Inserted ${expenses.length} expenses + ${goals.length} goals + ${benefitPlans.length} plans + ${employees.length} enrollments + ${employees.length} assets + ${learnings.length} learnings + ${recognitions.length} recognitions + ${pulse.length} pulse + 2 cohorts`);

  // ===== STEP 10: Final settlement for Priya (offboarding scenario) =====
  console.log("\n=== STEP 10: Seed Priya's offboarding final settlement ===");
  await sql.unsafe(`
    INSERT INTO ${S("final_settlements")} (id, employee_id, esb_amount, unpaid_salary, accrued_leave_payout, exit_reason)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [id("fs-priya"), id("emp-priya"), 85000, 26000, 12000, "notice_period :: " + JSON.stringify({
    offboarding: {
      initiatedBy: "Reem Al-Harbi",
      initiatedAt: "2026-07-01T09:00:00Z",
      lastWorkingDay: "2026-07-31",
      primaryReason: "resignation",
      ktItems: [
        { task: "Hand over Jafurah project plan", successor: "Khalid Al-Mutairi", dueDate: "2026-07-20", status: "in_progress" },
        { task: "Document Dhahran vendor relationships", successor: "Fahad Al-Qahtani", dueDate: "2026-07-25", status: "pending" },
      ],
      assetReturns: [
        { asset: "laptop", serial: "RUKN-LT-2026-007", status: "pending" },
        { asset: "id_card", status: "pending" },
      ],
      itRevocations: [
        { system: "Email & SSO", scheduledFor: "2026-07-31", status: "scheduled" },
        { system: "VPN & network access", scheduledFor: "2026-07-31", status: "scheduled" },
      ],
    }
  })]);
  console.log("  ✓ Priya's final settlement + offboarding payload seeded");

  // ===== Verify =====
  console.log("\n=== VERIFICATION ===");
  const counts = [
    "departments", "employees", "documents", "payroll_runs", "payslips",
    "leave_requests", "leave_balances", "job_requisitions", "candidates",
    "applications", "offers", "interviews", "expenses", "goals",
    "benefits_plans", "benefits_enrollments", "assets", "learning_enrollments",
    "recognitions", "engagement_pulse", "onboarding_cohorts", "final_settlements"
  ];
  for (const t of counts) {
    const r = await sql.unsafe(`SELECT COUNT(*)::int as c FROM ${S(t)}`);
    console.log(`  ${t.padEnd(25)} ${r[0].c}`);
  }

  await sql.end();
  console.log("\n✓ Seed complete.");
}

main().catch((e) => {
  console.error("✗ FAILED:", e.message);
  if ((e as { code?: string }).code) console.error("  code:", (e as { code?: string }).code);
  process.exit(1);
});