import { adminDb, tenants, users } from "@hrms-app/db";
import { createTenantSchema } from "@hrms-app/db";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import crypto from "crypto";

async function seed() {
  const existingTenant = await adminDb.query.tenants.findFirst({
    where: eq(tenants.companyName, "Demo Company"),
  });

  let tenantId: string;
  let schemaName: string;

  if (existingTenant) {
    tenantId = existingTenant.id;
    schemaName = existingTenant.schemaName;
    console.log("Demo tenant already exists, using existing");
  } else {
    schemaName = `tenant_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const [newTenant] = await adminDb.insert(tenants).values({
      companyName: "Demo Company",
      crNumber: "DEMO-00001",
      nitaqatActivity: "Software Development",
      schemaName,
      regulatoryContext: "saudi",
    }).returning();
    tenantId = newTenant.id;
    await createTenantSchema(schemaName);
    console.log("Demo tenant created");
  }

  const passwordHash = await hash("Demo@1234", 12);

  const existingUser = await adminDb.query.users.findFirst({
    where: eq(users.email, "admin@demo.com"),
  });

  if (existingUser) {
    await adminDb.update(users)
      .set({ passwordHash, preferredLanguage: "en" })
      .where(eq(users.email, "admin@demo.com"));
    console.log("Demo user password updated");
  } else {
    await adminDb.insert(users).values({
      email: "admin@demo.com",
      name: "Demo Admin",
      passwordHash,
      role: "admin",
      tenantId,
      preferredLanguage: "en",
    });
    console.log("Demo user created");
  }

  console.log("Demo user created successfully");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
