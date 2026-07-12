"use client";
import { useState } from "react";
import Link from "next/link";
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsList, TabsTrigger, TabsContent } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { Plus, Search, FileText, Briefcase, Users, Clock, Filter, ChevronDown, ChevronUp } from "lucide-react";
const statusColors: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  applied: "outline",
  screening: "secondary",
  phone_screen: "secondary",
  technical_interview: "default",
  final_interview: "default",
  offer_extended: "default",
  offer_accepted: "default",
  offer_declined: "destructive",
  hired: "default",
  rejected: "destructive",
  withdrawn: "destructive",
};
export default function ApplicationsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [jobReqId, setJobReqId] = useState("");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const pageSize = 20;
  const { data, isLoading } = api.recruitment.application.list.useQuery({
    status: (status || undefined) as any,
    jobRequisitionId: (jobReqId || undefined) as any,
    page,
    pageSize,
  } as any);
  const jobRequisitions = api.recruitment.jobRequisition.list.useQuery({ pageSize: 100 });
  const tabs = [
    { id: "all", label: "All" },
    { id: "applied", label: "Applied" },
    { id: "screening", label: "Screening" },
    { id: "interviewing", label: "Interviewing" },
    { id: "offer", label: "Offer" },
    { id: "hired", label: "Hired" },
    { id: "rejected", label: "Rejected" },
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Applications</h1>
          <p className="text-muted-foreground">Track and manage job applications</p>
        </div>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search candidate name, email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="screening">Screening</SelectItem>
              <SelectItem value="phone_screen">Phone Screen</SelectItem>
              <SelectItem value="technical_interview">Technical Interview</SelectItem>
              <SelectItem value="final_interview">Final Interview</SelectItem>
              <SelectItem value="offer_extended">Offer Extended</SelectItem>
              <SelectItem value="offer_accepted">Offer Accepted</SelectItem>
              <SelectItem value="offer_declined">Offer Declined</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
          <Select value={jobReqId} onValueChange={(v) => { setJobReqId(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="All jobs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All jobs</SelectItem>
              {jobRequisitions.data?.items.map((job: any) => (
                <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          {tabs.map((tab: any) => (
            <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <ApplicationsTable 
            data={data} 
            isLoading={isLoading} 
            page={page} 
            setPage={setPage} 
            pageSize={pageSize}
            statusFilter={status}
          />
        </TabsContent>
        {tabs.slice(1).map((tab: any) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-4">
            <ApplicationsTable 
              data={data} 
              isLoading={isLoading} 
              page={page} 
              setPage={setPage} 
              pageSize={pageSize}
              statusFilter={tab.id}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
function ApplicationsTable({ data, isLoading, page, setPage, pageSize, statusFilter }: {
  data: any;
  isLoading: boolean;
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  pageSize: number;
  statusFilter: string;
}) {
  const filteredItems = data?.items.filter((app: any) => 
    !statusFilter || app.status === statusFilter || 
    (statusFilter === "interviewing" && ["phone_screen", "technical_interview", "final_interview"].includes(app.status)) ||
    (statusFilter === "offer" && ["offer_extended", "offer_accepted", "offer_declined"].includes(app.status))
  ) ?? [];
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"><FileText className="h-4 w-4 mx-auto" /></TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Screened By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No applications found</TableCell>
              </TableRow>
            ) : (
              filteredItems.map((app: any) => (
                <TableRow key={app.id} className="cursor-pointer" onClick={() => window.location.href = `/recruitment/applications/${app.id}`}>
                  <TableCell><FileText className="h-4 w-4 text-muted-foreground mx-auto" /></TableCell>
                  <TableCell className="font-medium">{app.candidate?.firstName} {app.candidate?.lastName}</TableCell>
                  <TableCell>{app.jobRequisition?.title}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[app.status] ?? "outline"}>
                      {app.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(app.appliedAt).toLocaleDateString()}</TableCell>
                  <TableCell>{app.currentStage}</TableCell>
                  <TableCell>{app.screenedBy?.fullName ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild onClick={(e) => { e.stopPropagation(); window.location.href = `/recruitment/applications/${app.id}`; }}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t">
          <p className="text-sm text-muted-foreground">
            Page {page} of {data.totalPages} ({data.total} total)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}