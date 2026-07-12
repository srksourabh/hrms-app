"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsList, TabsTrigger, TabsContent, Input } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { Plus, Search, Calendar, Clock, CheckCircle, AlertCircle, FileText, Users, Filter } from "lucide-react";

const HIJRI_MONTHS_AR = [
  "محرم", "صفر", "ربيع الأول", "ربيع الثاني", "جمادى الأولى", "جمادى الآخرة",
  "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
];

function gregorianToHijri(date: Date): string {
  const d = new Date(date);
  const hijri = new Date(d.getFullYear(), 0, 1);
  hijri.setFullYear(d.getFullYear(), 0, 1);
  const islamicEpoch = 1948439.5;
  const days = Math.floor((d.getTime() / 86400000) - islamicEpoch + 1);
  const year = Math.floor((30 * days + 10646) / 10631);
  const dayOfYear = days - Math.floor((29 + 11 * year) / 30) - 354 * (year - 1);
  let month = Math.ceil(dayOfYear / 29.5);
  if (month < 1) month = 1;
  if (month > 12) month = 12;
  const day = dayOfYear - Math.floor(29.5 * (month - 1));
  const hijriMonth = HIJRI_MONTHS_AR[month - 1];
  return `${day} ${hijriMonth} ${year} هـ`;
}

function formatDualDate(dateStr: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const greg = date.toLocaleDateString('ar-SA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const hijri = gregorianToHijri(date);
  return `${greg} | ${hijri}`;
}

const statusColors: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  not_started: "outline",
  in_progress: "secondary",
  completed: "default",
  overdue: "destructive",
};

const dayLabels: Record<number, string> = {
  1: "Day 1",
  30: "Day 30",
  60: "Day 60",
  90: "Day 90",
};

export default function OnboardingPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dayNumber, setDayNumber] = useState("");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const pageSize = 20;

  const { data, isLoading } = api.recruitment.onboardingPlan.list.useQuery({
    search,
    status: (status || undefined) as any,
    dayNumber: dayNumber ? parseInt(dayNumber) : undefined,
    page,
    pageSize,
  } as any);

  const tabs = [
    { id: "all", label: "All" },
    { id: "1", label: "Day 1" },
    { id: "30", label: "Day 30" },
    { id: "60", label: "Day 60" },
    { id: "90", label: "Day 90" },
    { id: "not_started", label: "Not Started" },
    { id: "in_progress", label: "In Progress" },
    { id: "completed", label: "Completed" },
    { id: "overdue", label: "Overdue" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">30/60/90 Day Onboarding Plans</h1>
          <p className="text-muted-foreground">Track new hire onboarding progress</p>
        </div>
        <Button asChild>
          <Link href="/recruitment/onboarding/new">
            <Plus className="mr-2 h-4 w-4" /> Create Plan
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employee, title..."
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
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dayNumber} onValueChange={(v) => { setDayNumber(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Day number" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All days</SelectItem>
              <SelectItem value="1">Day 1</SelectItem>
              <SelectItem value="30">Day 30</SelectItem>
              <SelectItem value="60">Day 60</SelectItem>
              <SelectItem value="90">Day 90</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {tabs.map((tab: any) => (
            <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab: any) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-4">
            <OnboardingTable 
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

function OnboardingTable({ data, isLoading, page, setPage, pageSize, statusFilter }: {
  data: any;
  isLoading: boolean;
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  pageSize: number;
  statusFilter: string;
}) {
  const filteredItems = data?.items.filter((item: any) => 
    !statusFilter || 
    item.status === statusFilter ||
    (dayLabels[parseInt(statusFilter)] && item.dayNumber === parseInt(statusFilter))
  ) ?? [];

  const isOverdue = (item: any) => {
    if (item.status === "completed") return false;
    if (!item.dueDate) return false;
    return new Date(item.dueDate) < new Date() && item.status !== "completed";
  };

  const formatDueDate = (item: any) => {
    return formatDualDate(item.dueDate);
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"><FileText className="h-4 w-4 mx-auto" /></TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Status</TableHead>
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
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No onboarding plans found</TableCell>
              </TableRow>
            ) : (
              filteredItems.map((plan: any) => (
                <TableRow key={plan.id} className="cursor-pointer" onClick={() => window.location.href = `/recruitment/onboarding/${plan.id}`}>
                  <TableCell><FileText className="h-4 w-4 text-muted-foreground mx-auto" /></TableCell>
                  <TableCell className="font-medium">
                    {plan.employee?.fullName}
                    <br />
                    <span className="text-sm text-muted-foreground">{plan.employee?.department?.name}</span>
                  </TableCell>
                  <TableCell>{plan.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{dayLabels[plan.dayNumber] ?? `Day ${plan.dayNumber}`}</Badge>
                  </TableCell>
                  <TableCell className={isOverdue(plan) && plan.status !== "completed" ? "text-destructive font-medium" : ""}>
                    {formatDueDate(plan)}
                  </TableCell>
                  <TableCell>{plan.assignedTo?.fullName ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={isOverdue(plan) && plan.status !== "completed" ? "destructive" : statusColors[plan.status] ?? "outline"}>
                      {isOverdue(plan) && plan.status !== "completed" ? "Overdue" : plan.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild onClick={(e) => { e.stopPropagation(); window.location.href = `/recruitment/onboarding/${plan.id}`; }}>
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