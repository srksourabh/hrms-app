"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardHeader, CardContent, Badge, Input } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { LocationPicker, type LocationPickerValue } from "~/components/location-picker";
import { Clock, MapPin, LogIn, LogOut, AlertTriangle, Calendar } from "lucide-react";

const statusBadge: Record<string, { label: string; className: string }> = {
  present:    { label: "Present",    className: "bg-green-100 text-green-800 border-green-200" },
  late:       { label: "Late",       className: "bg-amber-100 text-amber-800 border-amber-200" },
  absent:     { label: "Absent",     className: "bg-red-100 text-red-800 border-red-200" },
  on_leave:   { label: "On leave",   className: "bg-blue-100 text-blue-800 border-blue-200" },
  remote:     { label: "Remote",     className: "bg-violet-100 text-violet-800 border-violet-200" },
  half_day:   { label: "Half day",   className: "bg-orange-100 text-orange-800 border-orange-200" },
  holiday:    { label: "Holiday",    className: "bg-slate-100 text-slate-700 border-slate-200" },
  weekend:    { label: "Weekend",    className: "bg-slate-100 text-slate-700 border-slate-200" },
};

function formatMinutes(min: number): string {
  if (!min || min <= 0) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatTime(d: Date | string | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function MyAttendancePage() {
  const [month, setMonth] = useState<string>(currentMonth());
  const [location, setLocation] = useState<LocationPickerValue | null>(null);
  const utils = api.useUtils();

  const { data: today, isLoading: loadingToday } = api.attendance.today.useQuery();
  const { data: history, isLoading: loadingHistory } = api.attendance.myHistory.useQuery({});
  const { data: monthly, isLoading: loadingMonthly } = api.attendance.myMonthlySummary.useQuery({ month });

  const punchInMutation = api.attendance.punchIn.useMutation({
    onSuccess: () => {
      utils.attendance.today.invalidate();
      utils.attendance.myHistory.invalidate();
      utils.attendance.myMonthlySummary.invalidate({ month });
    },
  });
  const punchOutMutation = api.attendance.punchOut.useMutation({
    onSuccess: () => {
      utils.attendance.today.invalidate();
      utils.attendance.myHistory.invalidate();
      utils.attendance.myMonthlySummary.invalidate({ month });
    },
  });

  const records = today?.records ?? [];
  const shift = today?.assignment?.shift;
  const latestRecord = records.find((r: any) => !r.punchOutAt) ?? records[0];
  const punchedIn = !!latestRecord?.punchInAt;
  const punchedOut = !!latestRecord?.punchOutAt;
  const todayLocation = useMemo<LocationPickerValue | null>(() => {
    if (latestRecord?.workLocation) {
      return {
        lat: latestRecord.workLocation.split(",")[0]?.trim() ? Number(latestRecord.workLocation.split(",")[0]) : 0,
        lng: latestRecord.workLocation.split(",")[1]?.trim() ? Number(latestRecord.workLocation.split(",")[1]) : 0,
        siteName: latestRecord.workLocation,
      };
    }
    return null;
  }, [latestRecord?.workLocation]);

  const monthLabel = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    return new Date(y ?? new Date().getFullYear(), (m ?? 1) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [month]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Attendance</h1>
        <p className="text-muted-foreground">Punch in, punch out, and review your monthly record</p>
      </div>

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
          {loadingToday ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="text-sm text-muted-foreground">Today</div>
                  <div className="text-2xl font-semibold">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  {shift && (
                    <div className="mt-1 text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      {shift.name} · {shift.startTime}–{shift.endTime}
                    </div>
                  )}
                </div>
                {latestRecord && (
                  <Badge className={statusBadge[latestRecord.status]?.className ?? statusBadge.present!.className}>
                    {statusBadge[latestRecord.status]?.label ?? latestRecord.status}
                    {latestRecord.lateMinutes > 0 ? ` · ${latestRecord.lateMinutes}m late` : ""}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <TimeTile
                  label="Punch in"
                  value={formatTime(latestRecord?.punchInAt ?? null)}
                  icon={<LogIn className="h-4 w-4" />}
                  active={punchedIn}
                />
                <TimeTile
                  label="Punch out"
                  value={formatTime(latestRecord?.punchOutAt ?? null)}
                  icon={<LogOut className="h-4 w-4" />}
                  active={punchedOut}
                />
                <TimeTile
                  label="Worked today"
                  value={formatMinutes(latestRecord?.workedMinutes ?? 0)}
                  icon={<Clock className="h-4 w-4" />}
                />
              </div>

              {latestRecord?.workLocation && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {latestRecord.workLocation}
                </div>
              )}

              {latestRecord?.exceptions && latestRecord.exceptions.length > 0 && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-700 shrink-0" />
                  <div className="text-amber-900">
                    {latestRecord.exceptions.length} exception(s) raised for today:{" "}
                    {latestRecord.exceptions.map((e: any) => e.exceptionType.replace(/_/g, " ")).join(", ")}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Punch-in location
                </div>
                <LocationPicker
                  value={todayLocation}
                  onChange={setLocation}
                  variant="compact"
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <Button
                  size="lg"
                  disabled={punchedIn || punchInMutation.isPending}
                  onClick={() =>
                    punchInMutation.mutate({
                      workLocation: location?.siteName ?? (location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "On-site"),
                      notes: location ? `lat=${location.lat},lng=${location.lng}${location.accuracy ? `,acc=${Math.round(location.accuracy)}m` : ""}` : undefined,
                    })
                  }
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {punchedIn ? "Already punched in" : "Punch in"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  disabled={!punchedIn || punchedOut || punchOutMutation.isPending}
                  onClick={() =>
                    punchOutMutation.mutate({
                      workLocation: location?.siteName ?? latestRecord?.workLocation ?? (location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "On-site"),
                      notes: location ? `lat=${location.lat},lng=${location.lng}${location.accuracy ? `,acc=${Math.round(location.accuracy)}m` : ""}` : undefined,
                    })
                  }
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {punchedOut ? "Already punched out" : "Punch out"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {monthly && (
          <>
            <SummaryTile label="Present"   value={monthly.summary.present}     tone="green" />
            <SummaryTile label="Late"      value={monthly.summary.late}        tone="amber" sub={formatMinutes(monthly.summary.totalLateMinutes)} />
            <SummaryTile label="On leave"  value={monthly.summary.onLeave}     tone="blue" />
            <SummaryTile label="Remote"    value={monthly.summary.remote}      tone="violet" />
            <SummaryTile label="Half day"  value={monthly.summary.halfDay}     tone="orange" />
            <SummaryTile label="Worked"    value={formatMinutes(monthly.summary.totalWorkedMinutes)} tone="slate" />
            <SummaryTile label="Overtime"  value={formatMinutes(monthly.summary.totalOvertimeMinutes)} tone="slate" />
          </>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Recent history</h3>
            <p className="text-xs text-muted-foreground">{monthLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-44"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loadingHistory || loadingMonthly ? (
            <div className="py-6 text-center text-muted-foreground">Loading...</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="h-10 px-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="h-10 px-3 text-left font-medium text-muted-foreground">Punch in</th>
                    <th className="h-10 px-3 text-left font-medium text-muted-foreground">Punch out</th>
                    <th className="h-10 px-3 text-right font-medium text-muted-foreground">Worked</th>
                    <th className="h-10 px-3 text-right font-medium text-muted-foreground">Late</th>
                    <th className="h-10 px-3 text-right font-medium text-muted-foreground">OT</th>
                  </tr>
                </thead>
                <tbody>
                  {(history ?? []).map((r: any) => (
                    <tr key={r.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 align-middle">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {r.workDate}
                        </div>
                      </td>
                      <td className="p-3 align-middle">
                        <Badge className={statusBadge[r.status]?.className ?? statusBadge.present!.className}>
                          {statusBadge[r.status]?.label ?? r.status}
                        </Badge>
                      </td>
                      <td className="p-3 align-middle">{formatTime(r.punchInAt)}</td>
                      <td className="p-3 align-middle">{formatTime(r.punchOutAt)}</td>
                      <td className="p-3 align-middle text-right">{formatMinutes(r.workedMinutes)}</td>
                      <td className="p-3 align-middle text-right">
                        {r.lateMinutes > 0 ? `${r.lateMinutes}m` : "—"}
                      </td>
                      <td className="p-3 align-middle text-right">
                        {r.overtimeMinutes > 0 ? formatMinutes(r.overtimeMinutes) : "—"}
                      </td>
                    </tr>
                  ))}
                  {(!history || history.length === 0) && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-muted-foreground">
                        No attendance records yet — punch in to get started
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TimeTile({
  label,
  value,
  icon,
  active,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 transition ${
        active
          ? "border-primary/40 bg-primary/5"
          : "border-dashed border-muted-foreground/30 bg-background/40"
      }`}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </div>
      <div className="text-2xl font-bold mt-1 tabular-nums">{value}</div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: number | string;
  tone: "green" | "amber" | "blue" | "violet" | "orange" | "slate";
  sub?: string;
}) {
  const tones: Record<string, string> = {
    green: "border-green-200 bg-green-50/40 text-green-900",
    amber: "border-amber-200 bg-amber-50/40 text-amber-900",
    blue: "border-blue-200 bg-blue-50/40 text-blue-900",
    violet: "border-violet-200 bg-violet-50/40 text-violet-900",
    orange: "border-orange-200 bg-orange-50/40 text-orange-900",
    slate: "border-slate-200 bg-slate-50/40 text-slate-900",
  };
  return (
    <Card className={tones[tone]}>
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
        <div className="text-2xl font-bold mt-1">{value}</div>
        {sub ? <div className="text-xs mt-0.5 opacity-70">{sub}</div> : null}
      </CardContent>
    </Card>
  );
}
