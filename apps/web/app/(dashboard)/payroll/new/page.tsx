"use client";

import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from "@hrms-app/ui";
import { useState } from "react";

export default function NewPayrollRunPage() {
  const router = useRouter();
  const utils = api.useUtils();
  const [periodMonth, setPeriodMonth] = useState("");
  const [error, setError] = useState("");

  const createMutation = api.payroll.run.create.useMutation({
    onSuccess: () => {
      utils.payroll.run.list.invalidate();
      router.push("/payroll");
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^\d{4}-\d{2}$/.test(periodMonth)) {
      setError("Period must be in YYYY-MM format");
      return;
    }

    createMutation.mutate({ periodMonth });
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Payroll Run</h1>
        <p className="text-muted-foreground">Create a new payroll run for a period</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Payroll Period</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Period Month</label>
              <Input
                type="month"
                value={periodMonth}
                onChange={(e) => setPeriodMonth(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Select the payroll period</p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Payroll Run"}
              </Button>
              <Button variant="outline" type="button" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
