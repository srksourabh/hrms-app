/**
 * One-shot migration endpoint for the demo-blocker bugs the QA team found.
 *
 * Protected by a static token (CRON_SECRET-style). This endpoint is
 * intentionally short-lived — delete it after the demo.
 *
 * Bugs fixed:
 *  - F2: documents.updated_at column missing
 *  - F3: notifications table missing
 */
import { adminDb } from "@hrms-app/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MIGRATION_TOKEN = process.env.MIGRATION_TOKEN ?? "demo-fix-2026";

const SCHEMA = "rukn_energy_services";

const STATEMENTS = [
  // F2: documents.updated_at
  `ALTER TABLE ${SCHEMA}.documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW() NOT NULL`,

  // F3: notifications table (mirrors the Drizzle schema definition)
  `CREATE TABLE IF NOT EXISTS ${SCHEMA}.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email','sms','in_app')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,

  // Index for the notification bell unread count query
  `CREATE INDEX IF NOT EXISTS ${SCHEMA}_notifications_user_idx ON ${SCHEMA}.notifications (user_id)`,
  `CREATE INDEX IF NOT EXISTS ${SCHEMA}_notifications_unread_idx ON ${SCHEMA}.notifications (user_id, read)`,
];

export async function POST(req: Request) {
  // Token guard — refuse without the right header
  const provided = req.headers.get("x-migration-token") ?? new URL(req.url).searchParams.get("token");
  if (provided !== MIGRATION_TOKEN) {
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
