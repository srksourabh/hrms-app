/**
 * One-shot migration: reconcile live DB schema with current Drizzle definitions.
 *
 * The live DB was created from an older DDL. New columns have been added in
 * code but never applied. This fixes the gaps so the seed route and routers
 * can use the new columns.
 */
import { adminDb } from "@hrms-app/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MIGRATION_TOKEN = process.env.MIGRATION_TOKEN;
const SCHEMA = "rukn_energy_services";

const STATEMENTS = [
  // leave_types: align with current Drizzle schema (days_allowed, rules, updated_at)
  `ALTER TABLE ${SCHEMA}.leave_types ADD COLUMN IF NOT EXISTS days_allowed INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE ${SCHEMA}.leave_types ADD COLUMN IF NOT EXISTS rules JSONB`,
  `ALTER TABLE ${SCHEMA}.leave_types ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW() NOT NULL`,
  // leave_types: keep default_days + paid for backwards compat, no need to drop

  // leave_requests: needs updated_at
  `ALTER TABLE ${SCHEMA}.leave_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW() NOT NULL`,

  // documents already had updated_at added by previous migration; ensure for other tables
  `ALTER TABLE ${SCHEMA}.payroll_runs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW() NOT NULL`,
  `ALTER TABLE ${SCHEMA}.payslips ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW() NOT NULL`,

  // audit_logs / notifications / leave_balances consistency
  `ALTER TABLE ${SCHEMA}.leave_balances ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW() NOT NULL`,
];

export async function POST(req: Request) {
  const provided =
    req.headers.get("x-migration-token") ??
    new URL(req.url).searchParams.get("token");
  if (!MIGRATION_TOKEN || provided !== MIGRATION_TOKEN) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const results: string[] = [];
  for (const stmt of STATEMENTS) {
    try {
      await adminDb.execute(stmt);
      results.push("OK: " + stmt.substring(0, 80));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push("ERR: " + msg);
    }
  }
  return NextResponse.json({ ok: true, results });
}
