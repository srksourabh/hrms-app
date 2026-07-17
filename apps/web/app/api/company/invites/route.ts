import { NextResponse } from "next/server";
import { auth } from "@hrms-app/auth";
import { adminDb, getTenantDb, tenants } from "@hrms-app/db";
import { employeeInvitations } from "@hrms-app/db/schema/tenant";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const tenant = await adminDb.query.tenants.findFirst({
      where: eq(tenants.id, session.user.tenantId!),
    });
    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const tenantDb = getTenantDb(tenant.schemaName);

    const invites = await tenantDb
      .select({
        id: employeeInvitations.id,
        email: employeeInvitations.email,
        role: employeeInvitations.role,
        status: employeeInvitations.status,
        expiresAt: employeeInvitations.expiresAt,
      })
      .from(employeeInvitations)
      .where(eq(employeeInvitations.status, "pending"));

    return NextResponse.json({ invites });
  } catch (err) {
    console.error("[GET /api/company/invites]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
