import { redirect } from "next/navigation";
import { auth } from "@hrms-app/auth";
import { DashboardProviders } from "~/components/dashboard-providers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <DashboardProviders session={session}>{children}</DashboardProviders>;
}
