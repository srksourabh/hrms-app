"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { productBrand } from "@hrms-app/config/brand";
import { BrandMark } from "~/components/brand/brand-lockup";

const SAMPLE_PASSWORD = "Rukn2026!";

const SAMPLE_USERS = [
  { role: "HR Manager", email: "reem.alharbi@rukn-energy.example" },
  { role: "HR Specialist", email: "aisha.alotaibi@rukn-energy.example" },
  { role: "Department Manager", email: "fahad.alqahtani@rukn-energy.example" },
  { role: "Employee", email: "omar.aldossary@rukn-energy.example" },
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/");
        router.refresh();
        return;
      }

      setError("Invalid email or password.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function fillSample(sample: { email: string }) {
    setEmail(sample.email);
    setPassword(SAMPLE_PASSWORD);
    setError("");
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

      <div className="mx-6 mt-4 rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">
          Working sample logins
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Password for every sample account:
          <span className="ml-1 rounded bg-slate-950 px-2 py-0.5 font-mono text-[11px] font-semibold text-white">
            {SAMPLE_PASSWORD}
          </span>
        </p>
        <div className="mt-3 grid gap-2">
          {SAMPLE_USERS.map((sample) => (
            <button
              key={sample.email}
              type="button"
              onClick={() => fillSample(sample)}
              className="rounded-md border border-emerald-100 bg-white px-3 py-2 text-left transition hover:border-emerald-400 hover:bg-emerald-50"
            >
              <span className="block text-xs font-semibold text-slate-900">{sample.role}</span>
              <span className="mt-0.5 block font-mono text-[11px] text-slate-600">{sample.email}</span>
            </button>
          ))}
        </div>
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
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="********"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 pr-11 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
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
          </div>
        </div>

        <div className="flex flex-col gap-3 px-6 pb-4 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="saudi-gradient-primary inline-flex h-11 w-full items-center justify-center rounded-md px-4 text-base font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </form>

      <div className="px-6 pb-6 pt-2 text-center text-xs text-slate-500">
        Need help?{" "}
        <a
          href="mailto:support@saudi-hrms.example"
          className="font-semibold text-[hsl(var(--saudi-green))] hover:underline"
        >
          Contact support
        </a>
      </div>
    </div>
  );
}
