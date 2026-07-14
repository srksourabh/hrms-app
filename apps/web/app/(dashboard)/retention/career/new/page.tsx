"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { ArrowLeft, Route, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@hrms-app/ui";
import { Input } from "@hrms-app/ui";
import { Label } from "@hrms-app/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@hrms-app/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@hrms-app/ui";
import { SaudiPalmette } from "~/components/saudi/saudi-backdrop";

const CAREER_STATUSES = ["active", "paused", "completed", "archived"] as const;

export default function CareerNewPage() {
  const router = useRouter();
  const utils = api.useUtils();

  const { data: careerRoles } = api.retention.careerRole.list.useQuery({ pageSize: 200 });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fromRoleId, setFromRoleId] = useState("");
  const [toRoleId, setToRoleId] = useState("");
  const [status, setStatus] = useState<string>("active");
  const [estimatedMonths, setEstimatedMonths] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");

  const create = api.retention.careerPath.create.useMutation({
    onSuccess: async () => {
      await utils.retention.careerPath.list.invalidate();
      router.push("/retention/career");
    },
    onError: (err) => setGlobalError(err.message),
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Career path name is required";
    if (!toRoleId) e.toRoleId = "Target role is required";
    if (!status) e.status = "Status is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setGlobalError("");
    if (!validate()) return;
    create.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      fromRoleId: fromRoleId || undefined,
      toRoleId,
      status: status as any,
      estimatedMonths: estimatedMonths ? Number(estimatedMonths) : undefined,
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/retention/career"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-[hsl(var(--saudi-green))]"
      >
        <ArrowLeft className="h-4 w-4 rtl-flip" />
        Back to Career Paths
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="bg-gradient-to-br from-amber-50 via-white to-emerald-50/40 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--saudi-gold))] to-amber-600 text-white shadow-sm">
              <Route className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Create Career Path</CardTitle>
              <CardDescription>Define a career progression path between roles within the organisation.</CardDescription>
            </div>
          </div>
          <SaudiPalmette className="mt-3 h-3.5 w-28 text-[hsl(var(--saudi-gold))]" />
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 pt-6">
            {globalError && (
              <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <strong>Error:</strong> {globalError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name">
                Path Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((er) => ({ ...er, name: "" })); }}
                placeholder="e.g. Junior Developer → Senior Developer → Tech Lead"
                className={errors.name ? "border-rose-400" : ""}
              />
              {errors.name && <p className="text-xs text-rose-600">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this career path"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fromRole">From Role (Optional)</Label>
                <Select
                  value={fromRoleId}
                  onValueChange={(v) => setFromRoleId(v === "__none__" ? "" : v)}
                >
                  <SelectTrigger id="fromRole" className="w-full">
                    <SelectValue placeholder="Select starting role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Any starting role —</SelectItem>
                    {careerRoles?.items?.map((role: any) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.title} {role.department ? `· ${role.department.name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="toRole">
                  Target Role <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={toRoleId}
                  onValueChange={(v) => { setToRoleId(v); setErrors((er) => ({ ...er, toRoleId: "" })); }}
                >
                  <SelectTrigger id="toRole" className={`w-full ${errors.toRoleId ? "border-rose-400" : ""}`}>
                    <SelectValue placeholder="Select target role" />
                  </SelectTrigger>
                  <SelectContent>
                    {careerRoles?.items?.map((role: any) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.title} {role.department ? `· ${role.department.name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.toRoleId && <p className="text-xs text-rose-600">{errors.toRoleId}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="status">
                  Status <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={status}
                  onValueChange={(v) => { setStatus(v); setErrors((er) => ({ ...er, status: "" })); }}
                >
                  <SelectTrigger id="status" className={`w-full ${errors.status ? "border-rose-400" : ""}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAREER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-xs text-rose-600">{errors.status}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="estimatedMonths">Estimated Duration (Months)</Label>
                <Input
                  id="estimatedMonths"
                  type="number"
                  min="1"
                  value={estimatedMonths}
                  onChange={(e) => setEstimatedMonths(e.target.value)}
                  placeholder="e.g. 12, 24"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/retention/career")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={create.isPending}
                className="saudi-gradient-primary h-10 px-6 text-sm font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-60"
              >
                {create.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Create Career Path</>
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </div>
    </div>
  );
}
