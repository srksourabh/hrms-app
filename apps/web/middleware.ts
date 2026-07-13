import { canAccessRoute } from "@hrms-app/auth/rbac";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_ROUTES = ["/login", "/signup", "/api/auth"];
const API_ROUTES = ["/api/trpc", "/api/health"];

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isApiRoute = API_ROUTES.some((route) => pathname.startsWith(route));

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
    "/api/auth/callback/credentials",
    "/api/auth/signup",
    "/api/trpc/:path*",
    "/employees/:path*",
    "/departments/:path*",
    "/payroll/:path*",
    "/recruitment/:path*",
    "/settings/:path*",
    "/compliance/:path*",
    "/qiwa/:path*",
    "/ai/:path*",
    "/modules/:path*",
    "/retention/:path*",
  ],
};
