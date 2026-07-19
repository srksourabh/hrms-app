"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Card, CardHeader, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { Plus, Search } from "lucide-react";

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

export default function EmployeesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading } = api.employee.list.useQuery({
    search: (search || undefined) as any,
    status: (status as "active" | "terminated" | "suspended" | "on_leave") || undefined,
    pageSize: 50,
  } as any);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground">Manage employee records</p>
        </div>
        <Button asChild>
          <Link href="/employees/new">
            <Plus className="mr-2 h-4 w-4" /> New Employee
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="terminated">Terminated</option>
              <option value="suspended">Suspended</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Nationality</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hire Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                data?.map((employee: any) => (
                  <TableRow
                    key={employee.id}
                    className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-700/30"
                    role="link"
                    tabIndex={0}
                    aria-label={`Open ${employee.fullName}`}
                    onClick={() => router.push(`/employees/${employee.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/employees/${employee.id}`);
                      }
                    }}
                  >
                    <TableCell className="font-medium">{employee.fullName}</TableCell>
                    <TableCell>{employee.department?.name ?? "-"}</TableCell>
                    <TableCell className="capitalize">{employee.nationality}</TableCell>
                    <TableCell>
                      <Badge
                        variant={statusColors[employee.employmentStatus] ?? "outline"}
                        className={customColors[employee.employmentStatus] ?? ""}
                      >
                        {employee.employmentStatus.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{employee.hireDate}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/employees/${employee.id}`);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
