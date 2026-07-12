"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@hrms-app/ui";
import { signupSchema } from "@hrms-app/validators";
import { SaudiBackdrop, SaudiFlagMark, SaudiPalmette } from "~/components/saudi/saudi-backdrop";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

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
        <div className="flex items-center gap-3">
          <SaudiFlagMark className="h-7 w-auto drop-shadow-md" />
          <span className="text-lg font-semibold tracking-tight text-white">UDS-HR</span>
        </div>
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
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--saudi-green))] to-[hsl(var(--saudi-green-dark))] shadow-lg">
              <span className="text-xl font-bold text-white">U</span>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Start your company's HR
            </CardTitle>
            <CardDescription>
              Set up your Saudi HR account in minutes. We'll create your
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
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters, 1 uppercase, 1 number"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 border-slate-300 bg-white"
                />
                {errors.password && (
                  <p className="text-xs text-[hsl(var(--saudi-rose))]">{errors.password}</p>
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
