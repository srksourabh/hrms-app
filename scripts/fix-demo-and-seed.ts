/**
 * Fix demo login + seed Rukn Energy Services data.
 * Run: cd apps/web && npx tsx ../scripts/fix-demo-and-seed.ts
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

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL missing"); process.exit(1); }

const TENANT_ID    = "1ed8b6bd3743";
const TENANT_SCHEMA = "tenant_1ed8b6bd3743";
const S = (t: string) => `"${TENANT_SCHEMA}"."${t}"`;

// Stable v5-like UUIDs
const id = (slug: string) => {
  const hex = Array.from(slug).reduce((a, c) => a + c.charCodeAt(0).toString(16).padStart(2, "0"), "");
  const padded = (hex + "0".repeat(32)).slice(0, 32);
  return `${padded.slice(0,8)}-${padded.slice(8,12)}-5${padded.slice(13,16)}-8${padded.slice(17,20)}-${padded.slice(20,32)}`;
};

let _ctr = 1000;
const uid = () => `${String(_ctr++).padStart(4,"0")}-0000-5000-8000-${String(_ctr).padStart(12,"0")}`;

async function main() {
  const pgPath = pathToFileURL(resolve(ROOT, "packages/db/node_modules/postgres/src/index.js")).href;
  const postgres = await import(pgPath);
  const sql = postgres.default(DATABASE_URL!, { ssl: { rejectUnauthorized: false } });
  console.log("✓ Connected to DB");

  // STEP 1: Ensure tenant row
  console.log("\n=== STEP 1: Create tenant row ===");
  await sql.unsafe(`
    INSERT INTO public.tenants (id, company_name, cr_number, nitaqat_activity, schema_name, regulatory_context, plan_tier)
    VALUES ($1,'Rukn Energy Services','CR 1010987654','Oil & Gas Field Services',$2,'saudi','enterprise')
    ON CONFLICT (id) DO UPDATE SET company_name=EXCLUDED.company_name, schema_name=EXCLUDED.schema_name
  `, [TENANT_ID, TENANT_SCHEMA]);
  console.log("  ✓ Tenant: Rukn Energy Services (ID:", TENANT_ID + ")");

  // STEP 2: Create demo users
  console.log("\n=== STEP 2: Create demo users ===");
  const { hash } = await import("bcryptjs");
  const pwHash = await hash("TaazurDemo@2026", 12);
  const demoUsers = [
    { email:"admin@taazur.example",      name:"Reem Al-Harbi",      role:"hr_manager",         empId:id("emp-reem") },
    { email:"specialist@taazur.example", name:"Aisha Al-Otaibi",    role:"hr_specialist",      empId:id("emp-aisha") },
    { email:"manager@taazur.example",   name:"Fahad Al-Qahtani",  role:"department_manager",  empId:id("emp-fahad") },
    { email:"employee@taazur.example",  name:"Omar Al-Dossary",    role:"employee",           empId:id("emp-omar") },
  ];
  for (const u of demoUsers) {
    await sql.unsafe(`
      INSERT INTO public.users (id,tenant_id,email,name,password_hash,role,employee_id,preferred_language)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'en')
      ON CONFLICT (email) DO UPDATE SET tenant_id=EXCLUDED.tenant_id, name=EXCLUDED.name,
        password_hash=EXCLUDED.password_hash, role=EXCLUDED.role, employee_id=EXCLUDED.employee_id
    `, [u.empId, TENANT_ID, u.email, u.name, pwHash, u.role, u.empId]);
    console.log("  ✓", u.email, "(" + u.role + ")");
  }

  // STEP 3: Create tenant schema + tables
  console.log("\n=== STEP 3: Create schema + tables ===");
  await sql.unsafe(`CREATE SCHEMA IF NOT EXISTS "${TENANT_SCHEMA}"`);

  const stmts = [
    `CREATE TABLE IF NOT EXISTS ${S("departments")} (id uuid PRIMARY KEY, name text NOT NULL, parent_department_id uuid, head_employee_id uuid, created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS ${S("employees")} (id uuid PRIMARY KEY, department_id uuid, manager_employee_id uuid, nationality text NOT NULL CHECK (nationality = ANY (ARRAY['saudi','expat','gcc'])), full_name text NOT NULL, employment_status text NOT NULL, hire_date date NOT NULL, termination_date date, gosi_registration_date date, gosi_system text, salary_basic numeric NOT NULL DEFAULT 0, salary_housing numeric NOT NULL DEFAULT 0, salary_transport numeric NOT NULL DEFAULT 0, job_title text, photo_url text, rehire_eligible text, rehire_reason text, created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS ${S("documents")} (id uuid PRIMARY KEY, employee_id uuid NOT NULL, type text NOT NULL, file_name text NOT NULL, file_url text, expiry_date date, version text, created_at timestamp NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS ${S("payroll_runs")} (id uuid PRIMARY KEY, period_month date NOT NULL, status text NOT NULL, total_amount numeric NOT NULL DEFAULT 0, completed_at timestamp, created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS ${S("payslips")} (id uuid PRIMARY KEY, payroll_run_id uuid NOT NULL, employee_id uuid NOT NULL, basic numeric NOT NULL DEFAULT 0, housing numeric NOT NULL DEFAULT 0, transport numeric NOT NULL DEFAULT 0, overtime numeric NOT NULL DEFAULT 0, gosi_employee numeric NOT NULL DEFAULT 0, gosi_employer numeric NOT NULL DEFAULT 0, esb_accrual numeric NOT NULL DEFAULT 0, deductions numeric NOT NULL DEFAULT 0, net numeric NOT NULL DEFAULT 0, currency text NOT NULL DEFAULT 'SAR', created_at timestamp NOT NULL DEFAULT now())`,
    `DROP TABLE IF EXISTS ${S("leave_types")} CASCADE`,
    `CREATE TABLE IF NOT EXISTS ${S("leave_types")} (id uuid PRIMARY KEY, name text NOT NULL, default_days integer NOT NULL DEFAULT 0, paid boolean NOT NULL DEFAULT true, created_at timestamp NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS ${S("leave_requests")} (id uuid PRIMARY KEY, employee_id uuid NOT NULL, leave_type_id uuid NOT NULL, start_date date NOT NULL, end_date date NOT NULL, status text NOT NULL, approved_by_user_id uuid, created_at timestamp NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS ${S("leave_balances")} (id uuid PRIMARY KEY, employee_id uuid NOT NULL, leave_type_id uuid, balance numeric NOT NULL DEFAULT 0, year integer NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS ${S("job_requisitions")} (id uuid PRIMARY KEY, department_id uuid, title text NOT NULL, description text, requirements text, responsibilities text, status text NOT NULL, type text NOT NULL, location text, is_remote boolean NOT NULL DEFAULT false, openings integer NOT NULL DEFAULT 1, min_salary numeric, max_salary numeric, currency text, hiring_manager_id uuid, recruiter_id uuid, created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS ${S("candidates")} (id uuid PRIMARY KEY, full_name text NOT NULL, email text NOT NULL, phone text, nationality text, stage text NOT NULL, score integer, source text, created_at timestamp NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS ${S("applications")} (id uuid PRIMARY KEY, candidate_id uuid NOT NULL, job_requisition_id uuid NOT NULL, stage text NOT NULL, next_action text, notes text, created_at timestamp NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS ${S("offers")} (id uuid PRIMARY KEY, candidate_id uuid NOT NULL, job_requisition_id uuid NOT NULL, status text NOT NULL, basic_salary numeric NOT NULL, start_date date NOT NULL, created_at timestamp NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS ${S("interviews")} (id uuid PRIMARY KEY, application_id uuid NOT NULL, scheduled_at timestamp NOT NULL, location text, created_at timestamp NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS ${S("final_settlements")} (id uuid PRIMARY KEY, employee_id uuid NOT NULL, esb_amount numeric, unpaid_salary numeric, accrued_leave_payout numeric, exit_reason text, created_at timestamp NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS ${S("expenses")} (id uuid PRIMARY KEY, employee_id uuid NOT NULL, approver_employee_id uuid, category text NOT NULL, description text NOT NULL, amount numeric NOT NULL, currency text NOT NULL DEFAULT 'SAR', expense_date date NOT NULL, receipt_url text, status text NOT NULL, rejection_reason text, approved_at timestamp, paid_at timestamp, created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS ${S("goals")} (id uuid PRIMARY KEY, employee_id uuid NOT NULL, manager_id uuid, title text NOT NULL, progress integer NOT NULL DEFAULT 0, due_date date, status text NOT NULL DEFAULT 'in_progress', created_at timestamp NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS ${S("benefits_plans")} (id uuid PRIMARY KEY, name text NOT NULL, provider text, tier text, covers_dependents boolean NOT NULL DEFAULT false, created_at timestamp NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS ${S("benefits_enrollments")} (id uuid PRIMARY KEY, employee_id uuid NOT NULL, plan_id uuid NOT NULL, status text NOT NULL, effective_date date NOT NULL, dependant_count integer NOT NULL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS ${S("assets")} (id uuid PRIMARY KEY, employee_id uuid NOT NULL, type text NOT NULL, asset_tag text, status text NOT NULL, assigned_at date NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS ${S("learning_enrollments")} (id uuid PRIMARY KEY, employee_id uuid NOT NULL, title text NOT NULL, status text NOT NULL, progress integer NOT NULL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS ${S("recognitions")} (id uuid PRIMARY KEY, employee_id uuid NOT NULL, from_employee_id uuid, value text, message text, created_at timestamp NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS ${S("engagement_pulse")} (id uuid PRIMARY KEY, topic text NOT NULL, score numeric NOT NULL, period text NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS ${S("onboarding_cohorts")} (id uuid PRIMARY KEY, employee_id uuid, candidate_id uuid, role text, manager_id uuid, buddy_id uuid, start_date date NOT NULL, progress integer NOT NULL DEFAULT 0, status text NOT NULL)`,
  ];
  for (const s of stmts) { await sql.unsafe(s); }
  console.log("  ✓ Schema + tables created");

  // STEP 4: Clear existing data
  console.log("\n=== STEP 4: Clear existing seed ===");
  const tables = [
    "recognitions","learning_enrollments","assets","benefits_enrollments","benefits_plans",
    "goals","engagement_pulse","onboarding_cohorts","expenses","applications","offers",
    "interviews","candidates","job_requisitions","documents","leave_balances","leave_requests",
    "payslips","payroll_runs","employees","departments"
  ];
  for (const t of tables) { await sql.unsafe(`DELETE FROM ${S(t)}`); }
  console.log("  ✓ Cleared");

  // STEP 5: Departments
  const depts = [
    { id: id("dept-people"),   name: "People & Culture" },
    { id: id("dept-field"),    name: "Field Operations" },
    { id: id("dept-projects"), name: "Projects & PMO" },
    { id: id("dept-finance"),  name: "Finance & Procurement" },
    { id: id("dept-hse"),      name: "HSE & Quality" },
  ];
  for (const d of depts) { await sql.unsafe(`INSERT INTO ${S("departments")} (id,name) VALUES ($1,$2)`, [d.id, d.name]); }
  console.log("\n  ✓ 5 departments");

  // STEP 6: 12 Employees
  const employees = [
    { id: id("emp-reem"),   name:"Reem Al-Harbi",       nat:"saudi", dept:id("dept-people"),   status:"active",   hire:"2021-03-14", sal:[32000,8000,2500],  job:"People & Culture Director",       mgr:null },
    { id: id("emp-fahad"),  name:"Fahad Al-Qahtani",    nat:"saudi", dept:id("dept-field"),    status:"active",   hire:"2020-09-01", sal:[28500,7125,2000],  job:"Eastern Operations Manager",       mgr:null },
    { id: id("emp-aisha"),  name:"Aisha Al-Otaibi",     nat:"saudi", dept:id("dept-people"),   status:"active",   hire:"2022-01-10", sal:[22500,5625,1500],  job:"Payroll & GOSI Specialist",        mgr:id("emp-reem") },
    { id: id("emp-noura"),  name:"Noura Al-Subaie",     nat:"saudi", dept:id("dept-people"),   status:"active",   hire:"2022-06-15", sal:[20000,5000,1500],  job:"Talent Acquisition Lead",         mgr:id("emp-reem") },
    { id: id("emp-khalid"), name:"Khalid Al-Mutairi",   nat:"saudi", dept:id("dept-projects"), status:"active",   hire:"2019-04-22", sal:[31000,7750,2250],  job:"Projects Director",               mgr:null },
    { id: id("emp-ahmed"),  name:"Ahmed Al-Shehri",     nat:"saudi", dept:id("dept-hse"),      status:"active",   hire:"2017-03-05", sal:[24500,6125,1750],  job:"HSE Manager",                    mgr:id("emp-fahad") },
    { id: id("emp-salman"), name:"Salman Al-Ghamdi",     nat:"saudi", dept:id("dept-hse"),      status:"active",   hire:"2016-11-14", sal:[25500,6375,1750],  job:"HSE Lead",                       mgr:id("emp-ahmed") },
    { id: id("emp-yousef"), name:"Yousef Al-Harbi",     nat:"saudi", dept:id("dept-field"),    status:"active",   hire:"2018-08-12", sal:[22000,5500,1500],  job:"Senior Field Supervisor",         mgr:id("emp-fahad") },
    { id: id("emp-omar"),   name:"Omar Al-Dossary",      nat:"saudi", dept:id("dept-field"),    status:"active",   hire:"2026-05-03", sal:[14000,3500,1000],  job:"Field Engineer",                  mgr:id("emp-yousef") },
    { id: id("emp-mariam"), name:"Mariam Al-Dosari",     nat:"saudi", dept:id("dept-finance"),  status:"active",   hire:"2023-02-20", sal:[18000,4500,1250],  job:"Procurement Analyst",             mgr:null },
    { id: id("emp-priya"),  name:"Priya Menon",          nat:"expat", dept:id("dept-projects"), status:"on_leave", hire:"2021-11-08", sal:[26000,6500,2000],  job:"Senior Project Coordinator",       mgr:id("emp-khalid") },
    { id: id("emp-lina"),   name:"Lina Khalil",          nat:"expat", dept:id("dept-projects"), status:"active",   hire:"2025-11-02", sal:[19000,4750,1250],  job:"Project Coordinator",             mgr:id("emp-khalid") },
  ];
  for (const e of employees) {
    await sql.unsafe(`
      INSERT INTO ${S("employees")} (id,full_name,nationality,department_id,employment_status,hire_date,
        salary_basic,salary_housing,salary_transport,manager_employee_id,job_title)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [e.id, e.name, e.nat, e.dept, e.status, e.hire, e.sal[0], e.sal[1], e.sal[2], e.mgr, e.job]);
  }
  console.log("  ✓ 12 employees");

  // STEP 7: Payroll runs + payslips
  const runs = [
    { id: id("pay-apr"), period:"2026-04-01", status:"completed", total:278000 },
    { id: id("pay-may"), period:"2026-05-01", status:"completed", total:296000 },
    { id: id("pay-jun"), period:"2026-06-01", status:"ready",     total:325440 },
  ];
  for (const r of runs) {
    await sql.unsafe(`INSERT INTO ${S("payroll_runs")} (id,period_month,status,total_amount) VALUES ($1,$2,$3,$4)`,
      [r.id, r.period, r.status, r.total]);
  }
  let pc = 0;
  for (const r of runs) {
    for (const e of employees) {
      const basic = Number(e.sal[0]), housing = Number(e.sal[1]), transport = Number(e.sal[2]);
      const gE  = e.nat === "saudi" ? Math.round(basic * 0.0975) : 0;
      const gEr = e.nat === "saudi" ? Math.round(basic * 0.1175) : Math.round(basic * 0.02);
      const net = basic + housing + transport - gE;
      await sql.unsafe(`
        INSERT INTO ${S("payslips")} (id,payroll_run_id,employee_id,basic,housing,transport,gosi_employee,gosi_employer,net,currency)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'SAR')`,
        [uid(), r.id, e.id, basic, housing, transport, gE, gEr, net]);
      pc++;
    }
  }
  console.log(`  ✓ 3 runs + ${pc} payslips`);

  // STEP 8: Leave
  const annualId = id("lt-annual"), sickId = id("lt-sick"), personalId = id("lt-personal");
  await sql.unsafe(`INSERT INTO ${S("leave_types")} (id,name,default_days,paid) VALUES ($1,'Annual leave',21,true)`, [annualId]);
  await sql.unsafe(`INSERT INTO ${S("leave_types")} (id,name,default_days,paid) VALUES ($1,'Sick leave',30,true)`, [sickId]);
  await sql.unsafe(`INSERT INTO ${S("leave_types")} (id,name,default_days,paid) VALUES ($1,'Personal leave',5,false)`, [personalId]);

  const leaveReqs = [
    { emp:id("emp-priya"),  lt:annualId,   from:"2026-07-13", to:"2026-07-14", status:"approved" },
    { emp:id("emp-omar"),   lt:personalId, from:"2026-07-20", to:"2026-07-20", status:"pending" },
    { emp:id("emp-noura"),  lt:annualId,   from:"2026-08-02", to:"2026-08-06", status:"approved" },
    { emp:id("emp-ahmed"),  lt:sickId,     from:"2026-06-21", to:"2026-06-23", status:"approved" },
    { emp:id("emp-lina"),   lt:annualId,   from:"2026-07-27", to:"2026-07-27", status:"pending" },
    { emp:id("emp-yousef"),lt:annualId,   from:"2026-09-06", to:"2026-09-17", status:"cancelled" },
  ];
  for (const l of leaveReqs) {
    await sql.unsafe(`INSERT INTO ${S("leave_requests")} (id,employee_id,leave_type_id,start_date,end_date,status) VALUES ($1,$2,$3,$4,$5,$6)`,
      [uid(), l.emp, l.lt, l.from, l.to, l.status]);
  }
  for (const e of employees) {
    const bal = e.id === id("emp-priya") ? 4 : e.id === id("emp-omar") ? 18 : 14;
    await sql.unsafe(`INSERT INTO ${S("leave_balances")} (id,employee_id,leave_type_id,balance,year) VALUES ($1,$2,$3,$4,2026)`,
      [uid(), e.id, annualId, bal]);
  }
  console.log("  ✓ 6 leave requests + 12 balances");

  // STEP 9: Recruitment
  const jobs = [
    { id:id("req-01"), title:"Drilling Engineer",  dept:id("dept-field"),    status:"interviewing" },
    { id:id("req-02"), title:"Project Planner",   dept:id("dept-projects"), status:"offer" },
    { id:id("req-03"), title:"Payroll Officer",   dept:id("dept-people"),   status:"sourcing" },
  ];
  for (const j of jobs) {
    await sql.unsafe(`INSERT INTO ${S("job_requisitions")} (id,title,department_id,status,type,openings,location,hiring_manager_id,recruiter_id,currency) VALUES ($1,$2,$3,$4,'full_time',1,'Riyadh, Saudi Arabia',$5,$6,'SAR')`,
      [j.id, j.title, j.dept, j.status, id("emp-fahad"), id("emp-noura")]);
  }
  const cands = [
    { id:id("c-sara"),     name:"Sara Al-Mutairi",   email:"sara.almutairi@cand.example",    stage:"technical_interview", score:88 },
    { id:id("c-abdullah"), name:"Abdullah Al-Salem", email:"abdullah.alsalem@cand.example",  stage:"offer",             score:91 },
    { id:id("c-fatima"),   name:"Fatima Al-Dosari",  email:"fatima.aldosari@cand.example",   stage:"screening",         score:82 },
    { id:id("c-jose"),     name:"Jose Dela Cruz",    email:"jose.delacruz@cand.example",     stage:"rejected",          score:71 },
  ];
  for (const c of cands) {
    await sql.unsafe(`INSERT INTO ${S("candidates")} (id,full_name,email,stage,score,source) VALUES ($1,$2,$3,$4,$5,'careers_page')`,
      [c.id, c.name, c.email, c.stage, c.score]);
  }
  const apps = [
    { id:id("app-01"), cand:id("c-sara"),     job:id("req-01"), stage:"technical_interview", next:"Panel interview · 15 Jul" },
    { id:id("app-02"), cand:id("c-abdullah"), job:id("req-02"), stage:"offer",              next:"Approve bilingual offer" },
    { id:id("app-03"), cand:id("c-fatima"),   job:id("req-03"), stage:"screening",          next:"Payroll assessment" },
    { id:id("app-04"), cand:id("c-jose"),     job:id("req-01"), stage:"rejected",           next:"Archive after notice" },
  ];
  for (const a of apps) {
    await sql.unsafe(`INSERT INTO ${S("applications")} (id,candidate_id,job_requisition_id,stage,next_action) VALUES ($1,$2,$3,$4,$5)`,
      [a.id, a.cand, a.job, a.stage, a.next]);
  }
  const ints = [
    { id:id("int-01"), app:id("app-01"), when:"2026-07-15T10:00:00+03:00", loc:"Teams" },
    { id:id("int-02"), app:id("app-02"), when:"2026-07-12T13:30:00+03:00", loc:"Jubail Office" },
    { id:id("int-03"), app:id("app-03"), when:"2026-07-18T11:00:00+03:00", loc:"Riyadh HQ" },
  ];
  for (const i of ints) {
    await sql.unsafe(`INSERT INTO ${S("interviews")} (id,application_id,scheduled_at,location) VALUES ($1,$2,$3,$4)`,
      [i.id, i.app, i.when, i.loc]);
  }
  const offers = [
    { id:id("offer-01"), cand:id("c-sara"),     job:id("req-01"), status:"draft",            salary:21000, start:"2026-08-16" },
    { id:id("offer-02"), cand:id("c-abdullah"), job:id("req-02"), status:"approval_pending", salary:18500, start:"2026-09-01" },
  ];
  for (const o of offers) {
    await sql.unsafe(`INSERT INTO ${S("offers")} (id,candidate_id,job_requisition_id,status,basic_salary,start_date) VALUES ($1,$2,$3,$4,$5,$6)`,
      [o.id, o.cand, o.job, o.status, o.salary, o.start]);
  }
  console.log("  ✓ 3 jobs + 4 candidates + 4 apps + 3 interviews + 2 offers");

  // STEP 10: Documents
  const docs = [
    { emp:id("emp-reem"),   type:"contract",    name:"Employment contract 2021",                   expiry:null },
    { emp:id("emp-fahad"),  type:"certificate", name:"Operational safety leadership certification", expiry:"2026-08-22" },
    { emp:id("emp-aisha"),  type:"other",       name:"GOSI enrollment confirmation",             expiry:null },
    { emp:id("emp-priya"),  type:"iqama",       name:"Resident identity (Iqama)",                expiry:"2026-09-10" },
    { emp:id("emp-priya"),  type:"passport",    name:"Passport copy",                             expiry:"2028-02-18" },
    { emp:id("emp-ahmed"),  type:"iqama",       name:"Resident identity (Iqama)",                expiry:"2027-03-11" },
    { emp:id("emp-khalid"), type:"certificate", name:"PMP certification",                        expiry:"2028-05-30" },
    { emp:id("emp-salman"), type:"certificate", name:"NEBOSH International General Certificate", expiry:null },
  ];
  for (const d of docs) {
    await sql.unsafe(`INSERT INTO ${S("documents")} (id,employee_id,type,file_name,expiry_date) VALUES ($1,$2,$3,$4,$5)`,
      [uid(), d.emp, d.type, d.name, d.expiry]);
  }
  console.log("  ✓ 8 documents");

  // STEP 11: Supporting tables
  const expenses = [
    { emp:id("emp-fahad"),  cat:"Dhahran-Riyadh travel",  amount:1840, status:"approved" },
    { emp:id("emp-omar"),   cat:"Field per diem",           amount:620,  status:"pending" },
    { emp:id("emp-khalid"), cat:"Client workshop",          amount:2450, status:"approved" },
    { emp:id("emp-lina"),   cat:"Project supplies",          amount:380,  status:"approved" },
    { emp:id("emp-salman"),cat:"HSE inspection travel",     amount:910,  status:"pending" },
    { emp:id("emp-noura"),  cat:"Recruitment event",        amount:1200, status:"draft" },
  ];
  for (const e of expenses) {
    await sql.unsafe(`INSERT INTO ${S("expenses")} (id,employee_id,category,description,amount,status,expense_date) VALUES ($1,$2,$3,$3,$4,$5,'2026-07-01')`,
      [uid(), e.emp, e.cat, e.amount, e.status]);
  }
  const goals = [
    { emp:id("emp-omar"),   mgr:id("emp-yousef"), title:"Complete field certification",            progress:65, due:"2026-08-31" },
    { emp:id("emp-aisha"),  mgr:id("emp-reem"),   title:"Zero-error Mudad submissions",           progress:92, due:"2026-12-31" },
    { emp:id("emp-khalid"), mgr:id("emp-reem"),   title:"Deliver Jafurah mobilization gate",       progress:68, due:"2026-09-30" },
    { emp:id("emp-noura"),  mgr:id("emp-reem"),   title:"Reduce time-to-offer to 18 days",        progress:74, due:"2026-10-31" },
    { emp:id("emp-salman"), mgr:id("emp-ahmed"),  title:"Close all high-risk HSE actions",         progress:86, due:"2026-08-15" },
    { emp:id("emp-lina"),   mgr:id("emp-khalid"), title:"Automate weekly project reporting",       progress:55, due:"2026-09-15" },
  ];
  for (const g of goals) {
    await sql.unsafe(`INSERT INTO ${S("goals")} (id,employee_id,manager_id,title,progress,due_date) VALUES ($1,$2,$3,$4,$5,$6)`,
      [uid(), g.emp, g.mgr, g.title, g.progress, g.due]);
  }
  for (let i = 0; i < employees.length; i++) {
    const e = employees[i];
    const type = (e.dept === id("dept-field") || e.dept === id("dept-hse")) ? "Rugged tablet + PPE kit" : "Laptop + access badge";
    await sql.unsafe(`INSERT INTO ${S("assets")} (id,employee_id,type,asset_tag,status,assigned_at) VALUES ($1,$2,$3,$4,'assigned','2026-07-01')`,
      [uid(), e.id, type, `RUKN-${2026001 + i}`]);
  }
  const learnings = [
    { emp:id("emp-omar"),   title:"Advanced well-control fundamentals",  status:"in_progress", progress:40 },
    { emp:id("emp-lina"),   title:"Primavera P6 foundations",          status:"in_progress", progress:62 },
    { emp:id("emp-noura"),  title:"Structured technical interviewing",   status:"complete",    progress:100 },
    { emp:id("emp-ahmed"),  title:"Reliability-centered maintenance",   status:"in_progress", progress:35 },
    { emp:id("emp-salman"), title:"Incident investigation lead",         status:"assigned",    progress:0 },
  ];
  for (const l of learnings) {
    await sql.unsafe(`INSERT INTO ${S("learning_enrollments")} (id,employee_id,title,status,progress) VALUES ($1,$2,$3,$4,$5)`,
      [uid(), l.emp, l.title, l.status, l.progress]);
  }
  const recognitions = [
    { to:id("emp-aisha"),  from:id("emp-reem"),   value:"Precision",     message:"Closed payroll pre-checks with zero critical findings." },
    { to:id("emp-yousef"), from:id("emp-fahad"),  value:"Safety",        message:"Stopped a field task and corrected the permit before work resumed." },
    { to:id("emp-lina"),   from:id("emp-khalid"), value:"Collaboration", message:"Connected three project teams through one weekly control pack." },
  ];
  for (const r of recognitions) {
    await sql.unsafe(`INSERT INTO ${S("recognitions")} (id,employee_id,from_employee_id,value,message) VALUES ($1,$2,$3,$4,$5)`,
      [uid(), r.to, r.from, r.value, r.message]);
  }
  console.log("  ✓ expenses, goals, assets, learnings, recognitions");

  // STEP 12: Pulse + onboarding cohorts
  const pulse = [
    { topic:"Manager support",     score:4.4 },
    { topic:"Workload",           score:3.7 },
    { topic:"Safety culture",     score:4.7 },
    { topic:"Career growth",      score:3.9 },
    { topic:"Tools and systems",  score:4.1 },
  ];
  for (const p of pulse) {
    await sql.unsafe(`INSERT INTO ${S("engagement_pulse")} (id,topic,score,period) VALUES ($1,$2,$3,'H1 2026')`, [uid(), p.topic, p.score]);
  }
  await sql.unsafe(`INSERT INTO ${S("onboarding_cohorts")} (id,employee_id,role,manager_id,buddy_id,start_date,progress,status) VALUES ($1,$2,'Field Engineer',$3,$4,'2026-05-03',78,'in_progress')`, [uid(), id("emp-omar"), id("emp-fahad"), id("emp-yousef")]);
  await sql.unsafe(`INSERT INTO ${S("onboarding_cohorts")} (id,employee_id,role,manager_id,buddy_id,start_date,progress,status) VALUES ($1,$2,'Project Coordinator',$3,$4,'2025-11-02',100,'complete')`, [uid(), id("emp-lina"), id("emp-khalid"), id("emp-noura")]);
  console.log("  ✓ pulse scores + 2 cohorts");

  // STEP 13: Priya settlement
  await sql.unsafe(`INSERT INTO ${S("final_settlements")} (id,employee_id,esb_amount,unpaid_salary,accrued_leave_payout,exit_reason) VALUES ($1,$2,85000,26000,12000,'resignation')`, [id("fs-priya"), id("emp-priya")]);
  console.log("  ✓ Priya settlement");

  // VERIFY
  console.log("\n=== VERIFICATION ===");
  const countTables = [
    "departments","employees","documents","payroll_runs","payslips",
    "leave_requests","leave_balances","job_requisitions","candidates","applications",
    "offers","interviews","expenses","goals","assets","learning_enrollments",
    "recognitions","engagement_pulse","onboarding_cohorts"
  ];
  for (const t of countTables) {
    const r = await sql.unsafe(`SELECT COUNT(*)::int as c FROM ${S(t)}`);
    console.log(`  ${t.padEnd(25)} ${r[0].c}`);
  }

  await sql.end();
  console.log("\n✓ DONE — Tenant: " + TENANT_ID + " | Schema: " + TENANT_SCHEMA);
  console.log("Demo login: admin@taazur.example / TaazurDemo@2026 (HR Manager)");
}

main().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
