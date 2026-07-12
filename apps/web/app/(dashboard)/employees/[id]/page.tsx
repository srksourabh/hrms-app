"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, DualDate } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { ArrowLeft, Edit, FileText, CalendarCheck } from "lucide-react";

const statusColors: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  active: "default",
  terminated: "destructive",
  suspended: "secondary",
  on_leave: "outline",
};

const customColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  on_leave: "bg-blue-100 text-blue-800 border-blue-200",
};

const leaveStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function EmployeeDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: employee, isLoading } = api.employee.getById.useQuery(id);

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-12">Loading...</div>;
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium">Employee not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/employees")}>
          Back to Employees
        </Button>
      </div>
    );
  }

  const totalSalary = Number(employee.salaryBasic) + Number(employee.salaryHousing) + Number(employee.salaryTransport);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/employees")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{employee.fullName}</h1>
              <Badge
                variant={statusColors[employee.employmentStatus] ?? "outline"}
                className={customColors[employee.employmentStatus] ?? ""}
              >
                {employee.employmentStatus.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-muted-foreground capitalize">{employee.nationality} National</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/employees/${employee.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Employment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Department</span>
              <span className="font-medium">{employee.department?.name ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Manager</span>
              <span className="font-medium">{employee.manager?.fullName ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hire Date</span>
              <span className="font-medium">
                {employee.hireDate ? <DualDate date={employee.hireDate} locale="ar" /> : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GOSI System</span>
              <span className="font-medium capitalize">{employee.gosiSystem ? `${employee.gosiSystem} system` : "-"}</span>
            </div>
            {employee.gosiRegistrationDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">GOSI Reg. Date</span>
                <span className="font-medium">
                  <DualDate date={employee.gosiRegistrationDate} locale="ar" />
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salary (SAR)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Basic</span>
              <span className="font-medium">{Number(employee.salaryBasic).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Housing</span>
              <span className="font-medium">{Number(employee.salaryHousing).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transport</span>
              <span className="font-medium">{Number(employee.salaryTransport).toLocaleString()}</span>
            </div>
            <hr />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{totalSalary.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employee.documents && employee.documents.length > 0 ? (
            <p className="text-sm text-muted-foreground">{employee.documents.length} document(s) attached</p>
          ) : (
            <p className="text-sm text-muted-foreground">No documents attached</p>
          )}
          <Button variant="outline" size="sm" className="mt-3" asChild>
            <Link href={`/documents?employeeId=${employee.id}`}>Manage Documents</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" /> Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employee.leaveRequests && employee.leaveRequests.length > 0 ? (
            <div className="space-y-2">
              {employee.leaveRequests.slice(0, 5).map((lr: any) => (
                <div key={lr.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">
                      {lr.startDate ? <DualDate date={lr.startDate} locale="ar" /> : "—"} &rarr;{" "}
                      {lr.endDate ? <DualDate date={lr.endDate} locale="ar" /> : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">{lr.leaveType?.name ?? "Leave"}</p>
                  </div>
                  <Badge className={leaveStatusColors[lr.status] ?? ""} variant="outline">
                    {lr.status}
                  </Badge>
                </div>
              ))}
              {employee.leaveRequests.length > 5 && (
                <p className="text-xs text-muted-foreground">+{employee.leaveRequests.length - 5} more</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No leave requests</p>
          )}
          <Button variant="outline" size="sm" className="mt-3" asChild>
            <Link href={`/leave?employeeId=${employee.id}`}>View All Leave</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
