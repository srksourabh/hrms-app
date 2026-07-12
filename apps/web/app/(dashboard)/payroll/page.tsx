"use client";

import { api } from "~/trpc/react";
import { Button, Badge, DualDate } from "@hrms-app/ui";
import { Plus } from "lucide-react";
import Link from "next/link";

const statusBadge: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
  draft: { variant: "secondary", className: "bg-gray-100 text-gray-800 border-gray-200" },
  pre_check: { variant: "outline", className: "bg-blue-100 text-blue-800 border-blue-200" },
  ready: { variant: "default", className: "bg-green-100 text-green-800 border-green-200" },
  completed: { variant: "default", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  cancelled: { variant: "destructive", className: "bg-red-100 text-red-800 border-red-200" },
};

export default function PayrollPage() {
  const { data: runs, isLoading } = api.payroll.run.list.useQuery();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payroll Runs</h1>
          <p className="text-muted-foreground">Manage payroll periods and payslips</p>
        </div>
        <Button asChild>
          <Link href="/payroll/new">
            <Plus className="mr-2 h-4 w-4" /> New Payroll Run
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-12 px-4 text-left font-medium text-muted-foreground">Period</th>
              <th className="h-12 px-4 text-left font-medium text-muted-foreground">Status</th>
              <th className="h-12 px-4 text-left font-medium text-muted-foreground">Total Amount</th>
              <th className="h-12 px-4 text-left font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {runs?.map((run: any) => {
              const badge = statusBadge[run.status as keyof typeof statusBadge] ?? statusBadge.draft;
              return (
                <tr key={run.id} className="border-b hover:bg-muted/50">
                  <td className="p-4 align-middle">
                    {run.periodMonth ? <DualDate date={run.periodMonth} locale="en" /> : "—"}
                  </td>
                  <td className="p-4 align-middle">
                    <Badge variant={badge!.variant} className={badge!.className}>
                      {run.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="p-4 align-middle">
                    {run.totalAmount ? `${Number(run.totalAmount).toLocaleString()} SAR` : "—"}
                  </td>
                  <td className="p-4 align-middle">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/payroll/${run.id}`}>View</Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
            {(!runs || runs.length === 0) && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-muted-foreground">
                  No payroll runs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
