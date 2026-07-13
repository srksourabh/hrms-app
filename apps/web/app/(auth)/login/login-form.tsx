"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { productBrand } from "@hrms-app/config/brand";
import {
  demoIdentities,
  type DemoIdentity,
  type DemoIdentityKey,
} from "@hrms-app/auth/demo-identities";
import { BrandMark } from "~/components/brand/brand-lockup";

const demoOptions: readonly {
  key: DemoIdentityKey;
  label: string;
  person: string;
  symbol: string;
  className: string;
}[] = [
  { key: "admin", label: "HR Manager", person: "Reem", symbol: "◆", className: "saudi-badge-premium" },
  { key: "hrSpecialist", label: "HR Specialist", person: "Aisha", symbol: "●", className: "border-sky-200 bg-sky-50 text-sky-950 hover:bg-sky-100" },
  { key: "departmentManager", label: "Department Manager", person: "Fahad", symbol: "■", className: "border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100" },
  { key: "employee", label: "Employee", person: "Omar", symbol: "○", className: "border-emerald-200 bg-emerald-50 text-emerald-950 hover:bg-emerald-100" },
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoRole, setDemoRole] = useState<DemoIdentityKey | null>(null);

  async function authenticate(credentials: { email: string; password: string }, isDemo = false) {
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        ...credentials,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/");
        router.refresh();
        return;
      }

      setError(
        isDemo
          ? "Demo access is temporarily unavailable. Please try again."
          : "بيانات الدخول غير صحيحة",
      );
    } catch {
      setError(
        isDemo
          ? "Demo access is temporarily unavailable. Please try again."
          : "حدث خطأ ما. حاول مرة أخرى",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await authenticate({ email, password });
  }

  async function handleDemoLogin(kind: DemoIdentityKey, identity: DemoIdentity) {
    setDemoRole(kind);
    const demoCredentials = { email: identity.email, password: identity.password };
    setEmail(demoCredentials.email);
    setPassword(demoCredentials.password);
    await authenticate(demoCredentials, true);
    setDemoRole(null);
  }

  return (
    <div className="saudi-glass w-full max-w-md rounded-xl border-0 shadow-2xl">
      <div className="p-6 pb-2 text-center">
        <BrandMark className="mx-auto mb-4 h-16 w-16 drop-shadow-lg" priority />
        <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
        <p className="mt-1 text-sm text-slate-500">Sign in to your {productBrand.name} account</p>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          {productBrand.attribution}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4 p-6 pt-4">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-[hsl(var(--saudi-rose))]/30 bg-[hsl(var(--saudi-rose))]/10 px-4 py-3 text-sm text-[hsl(var(--saudi-rose))]"
            >
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.sa"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 px-6 pb-6 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="saudi-gradient-primary inline-flex h-11 w-full items-center justify-center rounded-md px-4 text-base font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="relative flex w-full items-center">
            <div className="flex-1 border-t border-slate-200" />
            <span className="px-3 text-xs font-medium uppercase tracking-wider text-slate-400">or</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {demoOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                aria-label={`${option.label} demo`}
                onClick={() => handleDemoLogin(option.key, demoIdentities[option.key])}
                disabled={loading}
                className={`inline-flex min-h-14 items-center gap-2 rounded-lg border px-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${option.className}`}
              >
                <span aria-hidden="true" className="text-xs">{option.symbol}</span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold">
                    {demoRole === option.key ? "Opening..." : option.label}
                  </span>
                  <span className="block text-[10px] opacity-60">{option.person} · demo</span>
                </span>
              </button>
            ))}
          </div>
          <p className="text-center text-[10px] leading-4 text-slate-400">
            Fictional Rukn Energy data · role-based access · no real employee records
          </p>

          <div className="pt-1 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="font-semibold text-[hsl(var(--saudi-green))] hover:underline"
            >
              Sign up
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}
