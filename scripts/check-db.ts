import { adminDb, tenants, users } from "@hrms-app/db";
import { eq } from "drizzle-orm";

async function check() {
  const allTenants = await adminDb.select().from(tenants);
  console.log("Tenants:", JSON.stringify(allTenants, null, 2));
  const allUsers = await adminDb.select().from(users);
  console.log("Users:", JSON.stringify(allUsers.map((u: any) => ({ ...u, passwordHash: u.passwordHash ? "[HASHED]" : null })), null, 2));
  process.exit(0);
}

check().catch((e) => { console.error(e); process.exit(1); });
