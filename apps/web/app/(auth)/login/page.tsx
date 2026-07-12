"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@hrms-app/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", { email, password, redirect: false });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      if (result?.ok) {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setEmail("admin@demo.com");
    setPassword("Demo@1234");
    await signIn("credentials", {
      email: "admin@demo.com",
      password: "Demo@1234",
      redirect: true,
      callbackUrl: "/",
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-stone-100 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-green-800 shadow-sm">
            <span className="text-xl font-bold text-white">U</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">UDS-HR</h1>
          <p className="text-sm text-slate-500">Saudi HR & Payroll Platform</p>
        </div>

        <Card className="border border-slate-200/60 bg-white shadow-md">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-lg font-semibold text-slate-900">Welcome back</CardTitle>
            <CardDescription className="text-sm text-slate-500">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-green-700/40"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-green-700/40"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                className="w-full h-10 bg-green-800 text-white font-medium hover:bg-green-900 active:bg-green-950"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              <div className="relative flex items-center w-full">
                <div className="flex-1 border-t border-slate-200" />
                <span className="px-3 text-xs font-medium text-slate-400">or</span>
                <div className="flex-1 border-t border-slate-200" />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 border-amber-300 bg-amber-50 text-amber-800 font-medium hover:bg-amber-100 hover:border-amber-400"
                disabled={loading}
                onClick={handleDemoLogin}
              >
                <span className="mr-2">&#9733;</span>
                Demo Login (one-click)
              </Button>
              <div className="text-center pt-1">
                <Button variant="link" className="text-sm text-slate-500 hover:text-slate-700" asChild>
                  <a href="/signup">Don't have an account? Sign up</a>
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-xs text-slate-400">
          UDS-HR v1.0 &mdash; Saudi HR & Payroll Platform
        </p>
      </div>
    </div>
  );
}
