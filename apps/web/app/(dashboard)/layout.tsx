import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@hrms-app/auth";
import { adminDb, tenants } from "@hrms-app/db";
import { eq } from "drizzle-orm";
import { DashboardShell } from "~/components/dashboard-shell";
import { DashboardProviders } from "~/components/dashboard-providers";

// Per-request memoized tenant lookup. With cache(), the second time any page
// calls this in the same request it returns the cached value.
const getTenantContext = cache(async (tenantId: string | undefined) => {
  if (!tenantId) return "saudi" as const;
  try {
    const tenant = await adminDb.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
      columns: { regulatoryContext: true },
    });
    return (tenant?.regulatoryContext as "saudi" | "india" | undefined) ?? "saudi";
  } catch {
    return "saudi" as const;
  }
});

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const regulatoryContext = await getTenantContext(session.user.tenantId);

  return (
    <DashboardProviders session={session}>
      <DashboardShell
        user={session.user}
        regulatoryContext={regulatoryContext}
        preferredLanguage={session.user.preferredLanguage ?? "en"}
      >
        {children}
      </DashboardShell>
    </DashboardProviders>
  );
}
