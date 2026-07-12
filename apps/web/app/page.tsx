"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DashboardShell } from "~/components/dashboard-shell";

export default function RootPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session?.user) {
    return null;
  }

  return (
    <DashboardShell
      user={session.user}
      regulatoryContext={session.user.regulatoryContext ?? "saudi"}
      preferredLanguage={session.user.preferredLanguage ?? "en"}
    >
      <DashboardContent />
    </DashboardShell>
  );
}

function DashboardContent() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-base text-slate-500">Welcome back!</p>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Employees" value="0" bg="bg-amber-50" />
        <DashboardCard title="Departments" value="0" bg="bg-green-50" />
        <DashboardCard title="Pending" value="0" bg="bg-orange-50" />
        <DashboardCard title="Present Today" value="0" bg="bg-blue-50" />
      </div>
    </div>
  );
}

function DashboardCard({ title, value, bg }: { title: string; value: string | number; bg: string }) {
  return (
    <div className={`group rounded-xl border ${bg} p-5 shadow-sm`}>
      <div className="text-3xl font-bold text-slate-900">{value}</div>
      <p className="mt-3 text-sm font-medium text-slate-500">{title}</p>
    </div>
  );
}