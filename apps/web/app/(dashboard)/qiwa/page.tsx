"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { CheckCircle, XCircle, RefreshCw, UserPlus } from "lucide-react";
import Link from "next/link";

const statusColors: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  draft: "outline",
  submitted: "secondary",
  accepted: "default",
  rejected: "destructive",
  terminated: "destructive",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  accepted: "Accepted",
  rejected: "Rejected",
  terminated: "Terminated",
};

const customColors: Record<string, string> = {
  accepted: "bg-green-100 text-green-800 border-green-200",
  submitted: "bg-blue-100 text-blue-800 border-blue-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  terminated: "bg-gray-100 text-gray-800 border-gray-200",
  draft: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function QiwaDashboardPage() {
  const [setActiveTab] = useState("dashboard"); 

  const { data: connectionStatus } = api.qiwa.testConnection.useQuery();
  const { data: dashboardData, refetch: refetchDashboard } = api.qiwa.dashboard.useQuery();

  const isConnected = connectionStatus?.connected ?? false;
  const connectionError = connectionStatus?.error;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Qiwa Integration</h1>
          <p className="text-muted-foreground">Manage employee contracts and GOSI compliance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetchDashboard()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {isConnected ? "Connected" : "Disconnected"}
          </Button>
          <Button asChild>
            <Link href="/employees/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Employee
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardContent className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Contracts</p>
              <p className="text-2xl font-bold">{dashboardData?.summary.total ?? 0}</p>
            </CardContent>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardContent className="space-y-1">
              <p className="text-xs text-muted-foreground">Submitted</p>
              <p className="text-2xl font-bold text-secondary">{dashboardData?.summary.submitted ?? 0}</p>
            </CardContent>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardContent className="space-y-1">
              <p className="text-xs text-muted-foreground">Accepted</p>
              <p className="text-2xl font-bold text-green-600">{dashboardData?.summary.accepted ?? 0}</p>
            </CardContent>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardContent className="space-y-1">
              <p className="text-xs text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold text-destructive">{dashboardData?.summary.rejected ?? 0}</p>
            </CardContent>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardContent className="space-y-1">
              <p className="text-xs text-muted-foreground">Terminated</p>
              <p className="text-2xl font-bold text-destructive">{dashboardData?.summary.terminated ?? 0}</p>
            </CardContent>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {isConnected ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <XCircle className="h-8 w-8 text-destructive" />
              )}
              <div>
                <p className="font-medium">
                  {isConnected ? "Connected to Qiwa" : "Not Connected"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {connectionError ?? "API credentials configured"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <UserPlus className="mr-2 h-4 w-4" />
              Sync New Employee
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <RefreshCw className="mr-2 h-4 w-4" />
              Bulk Sync Contracts
            </Button>
            <Button variant="outline" className="w-full justify-start">
              View Sync Errors
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Contracts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboardData?.recentSyncs?.map((contract: (typeof dashboardData.recentSyncs)[0]) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">
                    {contract.employee?.fullName ?? "-"}
                  </TableCell>
                  <TableCell>{contract.jobTitle}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[contract.status ?? "draft"]} className={customColors[contract.status ?? "draft"]}>
                      {statusLabels[contract.status ?? "draft"]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {contract.lastSyncAt ? new Date(contract.lastSyncAt).toLocaleDateString() : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!dashboardData?.recentSyncs || dashboardData.recentSyncs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No contracts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}