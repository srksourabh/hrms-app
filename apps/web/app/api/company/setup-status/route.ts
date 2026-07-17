import { NextResponse } from "next/server";
import { auth } from "@hrms-app/auth";
import { adminDb, tenants } from "@hrms-app/db";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const tenant = await adminDb.query.tenants.findFirst({
      where: eq(tenants.id, session.user.tenantId!),
    });
    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    return NextResponse.json({
      completed: tenant.onboardingCompleted === "true",
      industry: tenant.industry ?? null,
      companySize: tenant.companySize ?? null,
      website: tenant.website ?? null,
    });
  } catch (err) {
    console.error("[GET /api/company/setup-status]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
