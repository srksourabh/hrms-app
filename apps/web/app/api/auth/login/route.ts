import { NextResponse } from "next/server";
import { adminDb, users } from "@hrms-app/db";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await adminDb.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    });
  } catch (e) {
    // Log details server-side only; never leak error text or stack to the client.
    console.error("Login error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
