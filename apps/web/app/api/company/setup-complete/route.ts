import { NextResponse } from "next/server";
import { auth } from "@hrms-app/auth";
import { adminDb, tenants } from "@hrms-app/db";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await adminDb
      .update(tenants)
      .set({ onboardingCompleted: "true" })
      .where(eq(tenants.id, session.user.tenantId!));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/company/setup-complete]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
