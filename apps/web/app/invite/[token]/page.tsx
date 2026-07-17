"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { SaudiBackdrop, SaudiPalmette } from "~/components/saudi/saudi-backdrop";
import { BrandLockup, BrandMark } from "~/components/brand/brand-lockup";
import { Loader2, CheckCircle2, XCircle, Building2, ShieldCheck } from "lucide-react";

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  // Validate token first (public — no session required)
  const { data: invite, isLoading: checkingToken } = api.invite.getByToken.useQuery(
    { token },
    { retry: false }
  );

  // Accept the invite
  const acceptMutation = api.invite.acceptInvite.useMutation({
    onSuccess: () => {
      setTimeout(() => router.push("/login?invite_accepted=true"), 1500);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError("");

    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    acceptMutation.mutate({ token, password });
  }

  // Already accepted or expired
  if (!checkingToken && !invite) {
    return (
      <div className="relative min-h-screen w-full">
        <SaudiBackdrop variant="jeddah" dim className="absolute inset-0" />
        <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
          <BrandLockup inverse priority />
        </header>
        <main className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-6">
          <Card className="saudi-glass w-full max-w-md border-0 shadow-2xl text-center">
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <XCircle className="h-16 w-16 text-[hsl(var(--saudi-rose))]" />
              <h2 className="text-2xl font-bold text-slate-900">Invitation unavailable</h2>
              <p className="text-sm text-slate-600">
                This invitation link has expired or was already used.<br />
                Contact your HR administrator for a new invite.
              </p>
              <Button asChild className="mt-2">
                <a href="/login">Go to sign in</a>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full">
      <SaudiBackdrop variant="jeddah" dim className="absolute inset-0" />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <BrandLockup inverse priority />
        <a href="/login" className="text-sm text-white/80 transition hover:text-white">
          Already have an account? <span className="font-semibold">Sign in</span>
        </a>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-10">
        {checkingToken ? (
          <div className="flex flex-col items-center gap-3 text-white">
            <Loader2 className="h-8 w-8 animate-spin text-white/70" />
            <p className="text-sm text-white/70">Verifying your invitation…</p>
          </div>
        ) : invite ? (
          <Card className="saudi-glass w-full max-w-md border-0 shadow-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600/20 ring-2 ring-emerald-400/30">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">You&apos;re invited!</CardTitle>
              <CardDescription>
                Join <strong>{invite.fullName}</strong>&apos;s team on Taāzur HR.
                Set your password to activate your account.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-4">
                {/* Role badge */}
                <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald-200/40 bg-emerald-50/40 py-2.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800 capitalize">
                    {invite.role.replace("_", " ")}
                  </span>
                </div>

                {acceptMutation.error && (
                  <div className="rounded-lg border border-[hsl(var(--saudi-rose))]/30 bg-[hsl(var(--saudi-rose))]/10 px-4 py-3 text-sm text-[hsl(var(--saudi-rose))]">
                    {acceptMutation.error.message}
                  </div>
                )}

                {localError && (
                  <div className="rounded-lg border border-amber-200/60 bg-amber-50/60 px-4 py-3 text-sm text-amber-800">
                    {localError}
                  </div>
                )}

                {acceptMutation.isSuccess ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    <p className="text-sm font-semibold text-emerald-700">Account created!</p>
                    <p className="text-xs text-slate-500">Redirecting you to sign in…</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                        Set Password
                      </label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="h-11 border-slate-300 bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                        Confirm Password
                      </label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="h-11 border-slate-300 bg-white"
                      />
                    </div>
                  </>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={acceptMutation.isPending || acceptMutation.isSuccess}
                  className="saudi-gradient-primary h-11 w-full text-base font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-60"
                >
                  {acceptMutation.isPending
                    ? "Creating your account…"
                    : acceptMutation.isSuccess
                    ? "Done!"
                    : "Activate my account"}
                </Button>
                <p className="text-center text-xs text-slate-500">
                  Your account will be linked to your company&apos;s workspace.
                  All data is isolated and private to your organization.
                </p>
              </CardFooter>
            </form>
          </Card>
        ) : null}
      </main>
    </div>
  );
}
