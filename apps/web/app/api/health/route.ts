import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

const startTime = Date.now();

export async function GET() {
  let dbStatus = "disconnected";
  // Redis is optional in this deployment — only used for background queues
  // (accrual, expiry alerts). If not configured, status is "not_configured"
  // rather than "disconnected" so we don't imply a regression.
  const redisStatus = process.env.REDIS_URL ? "configured" : "not_configured";

  try {
    const { adminDb } = await import("@hrms-app/db");
    await adminDb.execute(sql`SELECT 1`);
    dbStatus = "connected";
  } catch {
    dbStatus = "error";
  }

  return NextResponse.json({
    status: dbStatus === "connected" ? "ok" : "degraded",
    db: dbStatus,
    redis: redisStatus,
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
}
