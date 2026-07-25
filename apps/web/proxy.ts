import { canAccessRoute } from "@hrms-app/auth/rbac";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_ROUTES = ["/login", "/api/auth"];
const API_ROUTES = ["/api/health"];
const SIMPLIFIED_HR_ROUTES = [
  "/",
  "/employees",
  "/departments",
  "/designations",
  "/attendance/me",
  "/attendance/portal",
  "/attendance/reports",
  "/locations",
  "/leave",
  "/expenses",
  "/payroll",
  "/compliance",
  "/reports",
] as const;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
// Bound the per-instance store (API-007): sweep expired entries once the cap is
// hit, then drop oldest-inserted keys if churn (e.g. spoofed IPs) outpaces expiry.
const RATE_LIMIT_MAX_ENTRIES = 10_000;

function evictRateLimitEntries(now: number): void {
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
  for (const key of rateLimitMap.keys()) {
    if (rateLimitMap.size < RATE_LIMIT_MAX_ENTRIES) break;
    rateLimitMap.delete(key);
  }
}

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  if (rateLimitMap.size >= RATE_LIMIT_MAX_ENTRIES) evictRateLimitEntries(now);
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

const CSRF_PROTECTED_PREFIXES: string[] = [];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isApiRoute = API_ROUTES.some((route) => pathname.startsWith(route));

  if (pathname.startsWith("/api/trpc")) {
    return new NextResponse(JSON.stringify({ error: "tRPC is disabled for this Supabase-direct HR app." }), {
      status: 410,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Same-origin (CSRF) check for state-changing requests to custom API routes
  // that don't carry NextAuth's built-in CSRF token (F2 / SEC-004).
  const method = request.method.toUpperCase();
  if (
    (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE") &&
    CSRF_PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin) {
      try {
        if (new URL(origin).host !== host) {
          return new NextResponse(JSON.stringify({ error: "Cross-origin request rejected" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }
      } catch {
        return new NextResponse(JSON.stringify({ error: "Invalid origin" }), { status: 403 });
      }
    } else {
      // Fail closed when Origin is absent (API-007): fall back to Referer and
      // reject requests carrying neither.
      const referer = request.headers.get("referer");
      let refererHost: string | null = null;
      try {
        refererHost = referer ? new URL(referer).host : null;
      } catch {
        refererHost = null;
      }
      if (!refererHost || refererHost !== host) {
        return new NextResponse(JSON.stringify({ error: "Cross-origin request rejected" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    // Rate-limit these sensitive endpoints (30/min/IP).
    if (!checkRateLimit(`custom:${ip}`, 30, 60_000)) {
      return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Tight limit on credential login attempts (brute-force front line, C2).
  // Complemented by durable per-account lockout in the authorize() callback.
  const isLoginAttempt = pathname.startsWith("/api/auth/callback/credentials");
  if (isLoginAttempt && !checkRateLimit(`login:${ip}`, 5, 60_000)) {
    return new NextResponse(JSON.stringify({ error: "Too many login attempts. Please wait a minute and try again." }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (isAuthRoute && !checkRateLimit(`auth:${ip}`, 10, 1000)) {
    return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (isApiRoute && !isAuthRoute && !checkRateLimit(`api:${ip}`, 100, 1000)) {
    return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!pathname.startsWith("/api/")) {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: request.nextUrl.protocol === "https:",
    });
    const role = typeof token?.role === "string" ? token.role : null;
    const simplifiedRouteAllowed = SIMPLIFIED_HR_ROUTES.includes(pathname as (typeof SIMPLIFIED_HR_ROUTES)[number]);
    if (role && !simplifiedRouteAllowed) {
      const destination = request.nextUrl.clone();
      destination.pathname = "/";
      destination.searchParams.set("legacy", "disabled");
      return NextResponse.redirect(destination);
    }
    if (role && !canAccessRoute(role, pathname)) {
      const destination = request.nextUrl.clone();
      destination.pathname = "/";
      destination.searchParams.set("access", "denied");
      return NextResponse.redirect(destination);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/api/auth/callback/credentials",
    "/api/trpc/:path*",
    "/employees/:path*",
    "/departments/:path*",
    "/designations/:path*",
    "/attendance/:path*",
    "/locations/:path*",
    "/payroll/:path*",
    "/compliance/:path*",
    "/leave/:path*",
    "/expenses/:path*",
    "/reports/:path*",
  ],
};
