import { redirect } from "next/navigation";
import { auth } from "@hrms-app/auth";
import { adminDb, tenants } from "@hrms-app/db";
import { eq } from "drizzle-orm";
import { DashboardShell } from "~/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  let regulatoryContext: "saudi" | "india" = "saudi";
  try {
    const tenant = await adminDb.query.tenants.findFirst({
      where: eq(tenants.id, session.user.tenantId!),
    });
    if (tenant?.regulatoryContext) {
      regulatoryContext = tenant.regulatoryContext as "saudi" | "india";
    }
  } catch {
    // DB column may not exist yet; default to saudi
  }

  return (
    <DashboardShell
      user={session.user}
      regulatoryContext={regulatoryContext}
      preferredLanguage={(session.user as any).preferredLanguage ?? "en"}
    >
      {children}
    </DashboardShell>
  );
}
