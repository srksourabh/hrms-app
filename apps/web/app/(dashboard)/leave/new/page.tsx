"use client";

import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { Button, Card, CardHeader, CardTitle, CardContent, Input, DualDate } from "@hrms-app/ui";
import { useState } from "react";

export default function NewLeaveRequestPage() {
  const router = useRouter();
  const utils = api.useUtils();
  const { data: employees } = api.employee.list.useQuery({ pageSize: 200 });
  const { data: leaveTypes } = api.leave.leaveType.list.useQuery();

  const [employeeId, setEmployeeId] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");

  const createMutation = api.leave.request.create.useMutation({
    onSuccess: () => {
      utils.leave.request.list.invalidate();
      router.push("/leave");
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!employeeId || !leaveTypeId || !startDate || !endDate) {
      setError("All fields are required");
      return;
    }
    if (endDate < startDate) {
      setError("End date must be on or after start date");
      return;
    }

    createMutation.mutate({ employeeId, leaveTypeId, startDate, endDate });
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Leave Request</h1>
        <p className="text-muted-foreground">Create a leave request for an employee</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Leave Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Employee</label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select employee</option>
                {employees?.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Leave Type</label>
              <select
                value={leaveTypeId}
                onChange={(e) => setLeaveTypeId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select leave type</option>
                {leaveTypes?.map((type: any) => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.daysAllowed} days)
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              {startDate && (
                <p className="text-xs text-muted-foreground">
                  <DualDate date={startDate} locale="ar" />
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              {endDate && (
                <p className="text-xs text-muted-foreground">
                  <DualDate date={endDate} locale="ar" />
                </p>
              )}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Submitting..." : "Create Leave Request"}
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
