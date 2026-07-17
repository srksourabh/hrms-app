"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@hrms-app/ui";
import {
  UserPlus,
  Mail,
  Copy,
  RefreshCw,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  ShieldCheck,
  Users,
  Building2,
  Link2,
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  hr_manager: "HR Manager",
  department_manager: "Department Manager",
  payroll_admin: "Payroll Admin",
  employee: "Employee",
};

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline" | "success"> = {
  pending: "secondary",
  accepted: "success",
  expired: "destructive",
  revoked: "outline",
};

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TeamPage() {
  const { data: session } = useSession();
  const utils = api.useUtils();

  // Invite form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("employee");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Departments for dropdown
  const { data: departments } = api.department.list.useQuery();
  const inviteList = api.invite.list.useQuery(undefined, { retry: false });
  const pendingInviteList = api.invite.pending.useQuery(undefined, { retry: false });

  const createInvite = api.invite.create.useMutation({
    onSuccess: (data) => {
      setFormSuccess(`Invite sent! Share the link: ${window.location.origin}/invite/${data.invite.token}`);
      setFullName("");
      setEmail("");
      setRole("employee");
      setDepartmentId("");
      setFormError("");
      utils.invite.list.invalidate();
      utils.invite.pending.invalidate();
    },
    onError: (err) => {
      setFormError(err.message);
      setFormSuccess("");
    },
  });

  const revokeInvite = api.invite.revoke.useMutation({
    onSuccess: () => {
      utils.invite.list.invalidate();
      utils.invite.pending.invalidate();
    },
  });

  const resendInvite = api.invite.resend.useMutation({
    onSuccess: (data) => {
      setFormSuccess(`New invite sent! Share: ${window.location.origin}/invite/${data.invite.token}`);
      utils.invite.list.invalidate();
      utils.invite.pending.invalidate();
    },
  });

  function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!fullName.trim() || !email.trim()) {
      setFormError("Full name and email are required");
      return;
    }

    createInvite.mutate({
      email: email.trim(),
      fullName: fullName.trim(),
      role: role as any,
      departmentId: departmentId || undefined,
    });
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`);
  }

  const isHR = ["super_admin", "hr_manager"].includes(session?.user?.role ?? "");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Team &amp; Invitations</h1>
          <p className="mt-1 text-base text-slate-500">
            Invite colleagues to join your organization and manage their roles.
          </p>
        </div>
        {isHR && (
          <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 text-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            You can send invitations
          </Badge>
        )}
      </div>

      <Tabs defaultValue="invites" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invites" className="gap-2">
            <Mail className="h-4 w-4" /> Invitations
            {pendingInviteList.data && (pendingInviteList.data as any[])?.length > 0 && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
                {(pendingInviteList.data as any[]).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <Users className="h-4 w-4" /> All Activity
          </TabsTrigger>
        </TabsList>

        {/* INVITES TAB */}
        <TabsContent value="invites" className="mt-6 space-y-6">
          {/* Send Invite Form — HR only */}
          {isHR ? (
            <Card className="rounded-xl border bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserPlus className="h-4 w-4 text-indigo-600" />
                  Send an Invitation
                </CardTitle>
                <CardDescription>
                  The person will receive a link to set their password and join your workspace.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSendInvite}>
                <CardContent className="space-y-4">
                  {formError && (
                    <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {formError}
                    </div>
                  )}
                  {formSuccess && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span className="flex-1 text-sm text-emerald-800">{formSuccess}</span>
                      <button
                        type="button"
                        onClick={() => setFormSuccess("")}
                        className="text-emerald-600 hover:text-emerald-800"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Full Name *</label>
                      <Input
                        placeholder="e.g. Sara Al-Rashid"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Work Email *</label>
                      <Input
                        type="email"
                        placeholder="sara@company.sa"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Role</label>
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="hr_manager">HR Manager</SelectItem>
                          <SelectItem value="department_manager">Department Manager</SelectItem>
                          <SelectItem value="payroll_admin">Payroll Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Department</label>
                      <Select value={departmentId} onValueChange={setDepartmentId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Any department</SelectItem>
                          {(departments ?? []).map((d: any) => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button
                    type="submit"
                    disabled={createInvite.isPending}
                    className="gap-2"
                  >
                    {createInvite.isPending ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                    ) : (
                      <><Mail className="h-4 w-4" /> Send Invitation</>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          ) : (
            <Card className="rounded-xl border bg-slate-50 p-6 text-center text-sm text-slate-600">
              <ShieldCheck className="mx-auto mb-2 h-6 w-6 text-slate-400" />
              Only HR Managers and Admins can send invitations.
            </Card>
          )}

          {/* Pending Invites */}
          <Card className="rounded-xl border bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-amber-500" />
                Pending Invitations
              </CardTitle>
              <CardDescription>
                Invitations expire after 7 days. Resend to extend the deadline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingInviteList.isLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : (
                <PendingInviteTable
                  invites={(pendingInviteList.data ?? []) as any[]}
                  onCopy={copyLink}
                  onResend={(id) => resendInvite.mutate({ inviteId: id })}
                  onRevoke={(id) => {
                    if (confirm("Revoke this invitation?")) revokeInvite.mutate({ inviteId: id });
                  }}
                  resendingId={resendInvite.variables?.inviteId}
                  revokingId={revokeInvite.variables?.inviteId}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ALL ACTIVITY TAB */}
        <TabsContent value="all" className="mt-6">
          <Card className="rounded-xl border bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">All Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              {inviteList.isLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : (
                <AllInviteTable invites={(inviteList.data ?? []) as any[]} onCopy={copyLink} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PendingInviteTable({
  invites,
  onCopy,
  onResend,
  onRevoke,
  resendingId,
  revokingId,
}: {
  invites: any[];
  onCopy: (token: string) => void;
  onResend: (id: string) => void;
  onRevoke: (id: string) => void;
  resendingId?: string;
  revokingId?: string;
}) {
  if (invites.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
        No pending invitations. Send one above to get started.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invites.map((inv) => (
        <div
          key={inv.id}
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
              {inv.fullName?.charAt(0) ?? "?"}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-slate-900 truncate">{inv.fullName}</p>
              <p className="text-xs text-slate-500 truncate">{inv.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className="text-xs capitalize hidden sm:inline-flex">
              {ROLE_LABELS[inv.role] ?? inv.role}
            </Badge>
            <span className="text-xs text-slate-400 whitespace-nowrap">
              Expires {formatDate(inv.expiresAt)}
            </span>

            <button
              onClick={() => onCopy(inv.token)}
              title="Copy invite link"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-indigo-600 transition"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => onResend(inv.id)}
              disabled={resendingId === inv.id}
              title="Resend invite"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-amber-600 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${resendingId === inv.id ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={() => onRevoke(inv.id)}
              disabled={revokingId === inv.id}
              title="Revoke invite"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-red-600 transition disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AllInviteTable({ invites, onCopy }: { invites: any[]; onCopy: (token: string) => void }) {
  if (invites.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        No invitations yet.
      </div>
    );
  }

  const statusIcon = (s: string) => {
    switch (s) {
      case "accepted": return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
      case "expired": return <XCircle className="h-3.5 w-3.5 text-slate-400" />;
      case "revoked": return <XCircle className="h-3.5 w-3.5 text-red-400" />;
      default: return <Clock className="h-3.5 w-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase text-slate-500">
            <th className="pb-3 pr-4">Name</th>
            <th className="pb-3 pr-4">Email</th>
            <th className="pb-3 pr-4">Role</th>
            <th className="pb-3 pr-4">Status</th>
            <th className="pb-3 pr-4">Sent</th>
            <th className="pb-3 pr-4">Accepted</th>
            <th className="pb-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {invites.map((inv) => (
            <tr key={inv.id} className="hover:bg-slate-50/50">
              <td className="py-3 pr-4 font-medium text-slate-900">{inv.fullName}</td>
              <td className="py-3 pr-4 text-slate-600">{inv.email}</td>
              <td className="py-3 pr-4 text-slate-600 capitalize">{ROLE_LABELS[inv.role] ?? inv.role}</td>
              <td className="py-3 pr-4">
                <span className="inline-flex items-center gap-1.5">
                  {statusIcon(inv.status)}
                  <span className="capitalize text-xs">{inv.status}</span>
                </span>
              </td>
              <td className="py-3 pr-4 text-slate-500 text-xs whitespace-nowrap">{formatDate(inv.createdAt)}</td>
              <td className="py-3 pr-4 text-slate-500 text-xs whitespace-nowrap">{formatDate(inv.acceptedAt)}</td>
              <td className="py-3 text-right">
                {inv.status === "pending" && (
                  <button
                    onClick={() => onCopy(inv.token)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Copy link
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
