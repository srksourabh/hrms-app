import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { auth } from "@hrms-app/auth";
import { adminDb, getTenantDb, tenants, inviteTokenIndex } from "@hrms-app/db";
import { employeeInvitations } from "@hrms-app/db/schema/tenant";
import { eq, and } from "drizzle-orm";

const INVITE_EXPIRY_DAYS = 7;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { email, role = "employee" } = body;
  if (!email?.trim()) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  try {
    const tenant = await adminDb.query.tenants.findFirst({
      where: eq(tenants.id, session.user.tenantId!),
    });
    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const tenantDb = getTenantDb(tenant.schemaName);

    // Check for existing pending invite using direct table query
    const [existing] = await tenantDb
      .select()
      .from(employeeInvitations)
      .where(
        and(
          eq(employeeInvitations.email, email.toLowerCase()),
          eq(employeeInvitations.status, "pending"),
        ),
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "A pending invitation already exists for this email" }, { status: 409 });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    const [invite] = await tenantDb
      .insert(employeeInvitations)
      .values({
        email: email.toLowerCase(),
        token,
        fullName: "",
        role,
        invitedByUserId: session.user.id,
        status: "pending",
        expiresAt,
      })
      .returning();

    // Mirror into the public invite-token index so the public
    // acceptInvite / getByToken tRPC procedures can resolve the
    // tenant schema without scanning every tenant.
    await adminDb.insert(inviteTokenIndex).values({
      token,
      tenantSchema: tenant.schemaName,
      invitationId: invite!.id,
      status: "pending",
      expiresAt,
    });

    return NextResponse.json({ invite }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/company/invite]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
