import { NextResponse } from "next/server";
import { auth } from "@hrms-app/auth";
import { adminDb, getTenantDb, tenants } from "@hrms-app/db";
import { departments } from "@hrms-app/db/schema/tenant";
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
    const depts = await tenantDb
      .select({ id: departments.id, name: departments.name })
      .from(departments);

    return NextResponse.json({ departments: depts });
  } catch (err) {
    console.error("[GET /api/company/departments]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name } = body;
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  try {
    const tenant = await adminDb.query.tenants.findFirst({
      where: eq(tenants.id, session.user.tenantId!),
    });
    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const tenantDb = getTenantDb(tenant.schemaName);
    const [dept] = await tenantDb
      .insert(departments)
      .values({ name: name.trim() })
      .returning();

    return NextResponse.json({ department: dept }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/company/departments]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
