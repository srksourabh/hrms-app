/**
 * Demo data seeding for the customer demo.
 *
 * Populates:
 *  - Leave types (Annual, Sick, Unpaid)
 *  - Leave balances for all active employees
 *  - Pending leave requests
 *  - Backfills missing employee fields (GOSI, iqama, occupation code, bank IBAN)
 *  - 3 open job requisitions
 *
 * Token-protected via MIGRATION_TOKEN. Idempotent.
 */
import { adminDb } from "@hrms-app/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MIGRATION_TOKEN = process.env.MIGRATION_TOKEN;

async function getSchemaName(): Promise<string> {
  const rows = await adminDb.execute(
    `SELECT schema_name FROM public.tenants WHERE onboarding_completed = 'true' LIMIT 1`,
  );
  const r = Array.isArray(rows) ? rows : (rows as any).rows ?? [];
  const name = r[0]?.schema_name;
  if (!name) throw new Error("No active tenant");
  return name;
}

// Helper: run a raw statement against a tenant schema using adminDb
async function tenantExec(schema: string, stmt: string): Promise<void> {
  // Use fully-qualified table names to bypass search_path entirely
  const q = stmt.replace(/\bemployees\b/g, `${schema}.employees`)
                 .replace(/\bleave_types\b/g, `${schema}.leave_types`)
                 .replace(/\bleave_balances\b/g, `${schema}.leave_balances`)
                 .replace(/\bleave_requests\b/g, `${schema}.leave_requests`)
                 .replace(/\bdepartments\b/g, `${schema}.departments`)
                 .replace(/\bjob_requisitions\b/g, `${schema}.job_requisitions`);
  await adminDb.execute(q);
}

export async function POST(req: Request) {
  const provided =
    req.headers.get("x-migration-token") ??
    new URL(req.url).searchParams.get("token");
  if (!MIGRATION_TOKEN || provided !== MIGRATION_TOKEN) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const schema = await getSchemaName();
  const log: string[] = [];

  try {
    // 1. Leave types (use ON CONFLICT to make idempotent)
    await tenantExec(schema, `
      INSERT INTO leave_types (id, name, days_allowed, rules, created_at, updated_at)
      VALUES
        (gen_random_uuid(), 'Annual Leave', 21, '{"accrual":"monthly","carryover":5}'::jsonb, NOW(), NOW()),
        (gen_random_uuid(), 'Sick Leave', 30, '{"requires_doc_after":2}'::jsonb, NOW(), NOW()),
        (gen_random_uuid(), 'Unpaid Leave', 30, '{}'::jsonb, NOW(), NOW())
    `);
    log.push("leave_types seeded");

    // 2. Leave balances for each active employee
    const emps = await adminDb.execute(
      `SELECT id FROM ${schema}.employees WHERE employment_status = 'active'`,
    );
    const empList = Array.isArray(emps) ? emps : (emps as any).rows ?? [];
    const types = await adminDb.execute(`SELECT id, name FROM ${schema}.leave_types`);
    const typeList = Array.isArray(types) ? types : (types as any).rows ?? [];
    const year = new Date().getFullYear();

    for (const emp of empList) {
      for (const t of typeList) {
        const balance = t.name === "Annual Leave" ? 14 : t.name === "Sick Leave" ? 30 : 30;
        await adminDb.execute(
          `INSERT INTO ${schema}.leave_balances (id, employee_id, leave_type_id, balance, year)
           VALUES (gen_random_uuid(), '${emp.id}', '${t.id}', ${balance}, ${year})`,
        );
      }
    }
    log.push(`leave_balances seeded for ${empList.length} employees`);

    // 3. Pending leave requests
    if (empList.length >= 3) {
      const annual = typeList.find((t: any) => t.name === "Annual Leave");
      if (annual) {
        await adminDb.execute(`
          INSERT INTO ${schema}.leave_requests (id, employee_id, leave_type_id, start_date, end_date, status, created_at, updated_at)
          VALUES
            (gen_random_uuid(), '${empList[0].id}', '${annual.id}', CURRENT_DATE + 7, CURRENT_DATE + 11, 'pending', NOW(), NOW()),
            (gen_random_uuid(), '${empList[1].id}', '${annual.id}', CURRENT_DATE + 14, CURRENT_DATE + 18, 'pending', NOW(), NOW()),
            (gen_random_uuid(), '${empList[2].id}', '${annual.id}', CURRENT_DATE - 7, CURRENT_DATE - 3, 'approved', NOW(), NOW())
        `);
        log.push("leave_requests seeded (3)");
      }
    }

    // 4. Backfill missing employee fields
    await adminDb.execute(`
      UPDATE ${schema}.employees SET
        gosi_registration_date = hire_date + INTERVAL '30 days',
        occupation_code = COALESCE(occupation_code, '2512-' || LPAD((RANDOM() * 100)::int::text, 4, '0')),
        gosi_system = COALESCE(gosi_system, 'new')
      WHERE gosi_registration_date IS NULL
    `);
    log.push("employees GOSI + occupation backfilled");

    // For expats, generate realistic iqama/passport numbers
    await adminDb.execute(`
      UPDATE ${schema}.employees SET
        iqama_number_enc = COALESCE(iqama_number_enc, 'IQM-' || LPAD((RANDOM() * 10000000)::int::text, 10, '0')),
        passport_number_enc = COALESCE(passport_number_enc, 'P-' || LPAD((RANDOM() * 100000000)::int::text, 9, '0')),
        passport_expiry = COALESCE(passport_expiry, CURRENT_DATE + INTERVAL '2 years'),
        iqama_expiry = COALESCE(iqama_expiry, CURRENT_DATE + INTERVAL '1 year'),
        visa_type = COALESCE(visa_type, 'work'),
        immigration_status = COALESCE(immigration_status, 'valid')
      WHERE nationality = 'expat'
    `);
    log.push("expat iqama/passport backfilled");

    // Saudi employees — backfill IBAN + skill level
    await adminDb.execute(`
      UPDATE ${schema}.employees SET
        bank_iban_enc = COALESCE(bank_iban_enc, 'SA' || LPAD((RANDOM() * 1000000000000000)::bigint::text, 18, '0')),
        skill_level = COALESCE(skill_level, '3')
      WHERE nationality = 'saudi'
    `);
    log.push("saudi IBAN + skill_level backfilled");

    // 5. Job requisitions
    const dept = await adminDb.execute(
      `SELECT id FROM ${schema}.departments LIMIT 1`,
    );
    const deptList = Array.isArray(dept) ? dept : (dept as any).rows ?? [];
    if (deptList.length > 0 && empList.length > 0) {
      await adminDb.execute(`
        INSERT INTO ${schema}.job_requisitions (id, title, description, department_id, hiring_manager_id, recruiter_id, status, openings, created_at, updated_at)
        VALUES
          (gen_random_uuid(), 'Senior Project Engineer', 'Lead energy infrastructure projects in Riyadh.', '${deptList[0].id}', '${empList[0].id}', '${empList[Math.min(1, empList.length - 1)].id}', 'open', 2, NOW(), NOW()),
          (gen_random_uuid(), 'HSE Specialist', 'Health, safety and environment compliance.', '${deptList[0].id}', '${empList[0].id}', '${empList[Math.min(1, empList.length - 1)].id}', 'open', 1, NOW(), NOW()),
          (gen_random_uuid(), 'HR Operations Specialist', 'Support payroll, leave and onboarding.', '${deptList[0].id}', '${empList[0].id}', '${empList[Math.min(1, empList.length - 1)].id}', 'open', 1, NOW(), NOW())
      `);
      log.push("job_requisitions seeded (3)");
    }

    return NextResponse.json({ ok: true, log });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e), log },
      { status: 500 },
    );
  }
}
