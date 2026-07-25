import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@hrms-app/db/health";

const startTime = Date.now();

export async function GET() {
  // Redis is optional in this deployment — only used for background queues
  // (accrual, expiry alerts). If not configured, status is "not_configured"
  // rather than "disconnected" so we don't imply a regression.
  const redisStatus = process.env.REDIS_URL ? "configured" : "not_configured";

  const dbStatus = (await checkDatabaseConnection()) ? "connected" : "error";

  return NextResponse.json({
    status: dbStatus === "connected" ? "ok" : "degraded",
    db: dbStatus,
    redis: redisStatus,
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
}
