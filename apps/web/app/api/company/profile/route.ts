import { NextResponse } from "next/server";
import { auth } from "@hrms-app/auth";
import { adminDb, tenants } from "@hrms-app/db";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const tenant = await adminDb.query.tenants.findFirst({
      where: eq(tenants.id, session.user.tenantId!),
    });
    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    return NextResponse.json({
      industry: tenant.industry ?? "",
      companySize: tenant.companySize ?? "",
      website: tenant.website ?? "",
    });
  } catch (err) {
    console.error("[GET /api/company/profile]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { industry, companySize, website } = body;

  try {
    await adminDb
      .update(tenants)
      .set({
        industry: industry ?? null,
        companySize: companySize ?? null,
        website: website ?? null,
      })
      .where(eq(tenants.id, session.user.tenantId!));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/company/profile]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
