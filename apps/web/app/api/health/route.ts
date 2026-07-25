import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

const startTime = Date.now();

function isTransientDbConnectionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /connection closed|connection terminated|econnreset|socket hang up|timeout/i.test(message);
}

async function checkDb(attempt = 1): Promise<boolean> {
  try {
    const { adminDb } = await import("@hrms-app/db");
    await adminDb.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    if (attempt < 3 && isTransientDbConnectionError(error)) {
      await new Promise((resolve) => setTimeout(resolve, 150 * attempt));
      return checkDb(attempt + 1);
    }
    return false;
  }
}

export async function GET() {
  // Redis is optional in this deployment — only used for background queues
  // (accrual, expiry alerts). If not configured, status is "not_configured"
  // rather than "disconnected" so we don't imply a regression.
  const redisStatus = process.env.REDIS_URL ? "configured" : "not_configured";

  const dbStatus = (await checkDb()) ? "connected" : "error";

  return NextResponse.json({
    status: dbStatus === "connected" ? "ok" : "degraded",
    db: dbStatus,
    redis: redisStatus,
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
}
