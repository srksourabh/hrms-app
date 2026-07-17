"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@hrms-app/ui";
import { signupSchema } from "@hrms-app/validators";
import { SaudiBackdrop, SaudiPalmette } from "~/components/saudi/saudi-backdrop";
import { BrandLockup, BrandMark } from "~/components/brand/brand-lockup";

// Inline password strength — pure function, easy to test in isolation if
// needed. Returns 0..4 and a label.
function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  const labels = ["", "Weak", "Fair", "Good", "Strong"] as const;
  return { score: score as 0 | 1 | 2 | 3 | 4, label: labels[score] ?? "" };
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Confirm-password check (not part of the zod schema so we run it manually)
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      setLoading(false);
      return;
    }

    const result = signupSchema.safeParse({
      name,
      email,
      password,
      companyName,
      crNumber,
      regulatoryContext: "saudi" as const,
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.data),
    });

    if (!res.ok) {
      const data = await res.json();
      setErrors({ form: data.error ?? "Something went wrong" });
      setLoading(false);
      return;
    }

    router.push("/login?registered=true");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen w-full">
      <SaudiBackdrop variant="jeddah" dim className="absolute inset-0" />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <BrandLockup inverse priority />
        <a
          href="/login"
          className="text-sm text-white/80 transition hover:text-white"
        >
          Already have an account? <span className="font-semibold">Sign in</span>
        </a>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-10 sm:px-10">
        <Card className="saudi-glass w-full max-w-2xl border-0 shadow-2xl">
          <CardHeader className="text-center">
            <BrandMark className="mx-auto mb-3 h-14 w-14 drop-shadow-lg" />
            <CardTitle className="text-2xl font-bold tracking-tight">
              Start your company&apos;s HR
            </CardTitle>
            <CardDescription>
              Set up your Saudi HR account in minutes. We&apos;ll create your
              isolated tenant schema automatically.
            </CardDescription>
            <SaudiPalmette className="mx-auto mt-3 h-4 w-32 text-[hsl(var(--saudi-gold))]" />
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              {errors.form && (
                <div
                  role="alert"
                  className="rounded-lg border border-[hsl(var(--saudi-rose))]/30 bg-[hsl(var(--saudi-rose))]/10 px-4 py-3 text-sm text-[hsl(var(--saudi-rose))]"
                >
                  {errors.form}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="companyName" className="block text-sm font-medium text-slate-700">
                    Company Name
                    <span className="ms-1 text-xs text-slate-400" dir="rtl">اسم الشركة</span>
                  </label>
                  <Input
                    id="companyName"
                    placeholder="e.g. Al-Noor Trading Co."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    className="h-11 border-slate-300 bg-white"
                  />
                  {errors.companyName && (
                    <p className="text-xs text-[hsl(var(--saudi-rose))]">{errors.companyName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="crNumber" className="block text-sm font-medium text-slate-700">
                    CR Number
                    <span className="ms-1 text-xs text-slate-400" dir="rtl">السجل التجاري</span>
                  </label>
                  <Input
                    id="crNumber"
                    placeholder="1010XXXXXX"
                    value={crNumber}
                    onChange={(e) => setCrNumber(e.target.value)}
                    required
                    className="h-11 border-slate-300 bg-white"
                  />
                  {errors.crNumber && (
                    <p className="text-xs text-[hsl(var(--saudi-rose))]">{errors.crNumber}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                    Your Name
                    <span className="ms-1 text-xs text-slate-400" dir="rtl">الاسم الكامل</span>
                  </label>
                  <Input
                    id="name"
                    placeholder="HR Manager"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11 border-slate-300 bg-white"
                  />
                  {errors.name && (
                    <p className="text-xs text-[hsl(var(--saudi-rose))]">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                    Work Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.sa"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 border-slate-300 bg-white"
                  />
                  {errors.email && (
                    <p className="text-xs text-[hsl(var(--saudi-rose))]">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters, 1 uppercase, 1 number"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 border-slate-300 bg-white pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {/* Password strength meter */}
                {password && (() => {
                  const { score, label } = passwordStrength(password);
                  const colors = ["", "bg-rose-500", "bg-amber-500", "bg-sky-500", "bg-emerald-600"];
                  return (
                    <div className="flex items-center gap-2" aria-live="polite">
                      <div className="flex h-1.5 flex-1 gap-0.5">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-full ${i <= score ? colors[score] : "bg-slate-200"}`}
                          />
                        ))}
                      </div>
                      <span className="w-12 text-right text-[11px] font-medium text-slate-500">{label}</span>
                    </div>
                  );
                })()}
                {errors.password && (
                  <p className="text-xs text-[hsl(var(--saudi-rose))]">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                  Confirm password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-11 border-slate-300 bg-white pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    aria-pressed={showConfirmPassword}
                    className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-[hsl(var(--saudi-rose))]">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="rounded-lg border border-amber-200/60 bg-amber-50/60 p-3 text-xs text-amber-900">
                <strong>Compliance note:</strong> By creating an account, you
                confirm your company operates under Saudi labor law. Your
                data is hosted in AWS me-south-1 (Bahrain) under PDPL.
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="saudi-gradient-primary h-11 w-full text-base font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-60"
              >
                {loading ? "Creating your company…" : "Create my company account"}
              </Button>
              <p className="text-center text-xs text-slate-500">
                A separate schema will be created in our database for your
                company. Other companies cannot see your data.
              </p>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
