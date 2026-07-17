/**
 * Configuration diagnostics endpoint.
 *
 * Disabled in production — the response reveals internal hostnames and
 * the length of the auth secret which is enough information to start a
 * side-channel attack. The endpoint stays available in non-production
 * environments so on-call engineers can confirm env wiring without
 * having to ssh into the box.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEBUG_ENDPOINT !== "true") {
    return new Response("Not found", { status: 404 });
  }

  const authSecret = process.env.AUTH_SECRET;
  const authUrl = process.env.AUTH_URL;
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const dbUrl = process.env.DATABASE_URL;
  const demoMode = process.env.DEMO_MODE;

  let dbHost = "unknown";
  let dbPort = "unknown";
  try {
    const u = new URL(dbUrl ?? "");
    dbHost = u.hostname;
    dbPort = u.port || "5432";
  } catch { /* ignore */ }

  return Response.json({
    hasAuthSecret: !!authSecret,
    authSecretLength: authSecret?.length ?? 0,
    hasAuthUrl: !!authUrl,
    authUrlValue: authUrl ?? "not set",
    hasNextAuthUrl: !!nextAuthUrl,
    nextAuthUrlValue: nextAuthUrl ?? "not set",
    hasDbUrl: !!dbUrl,
    dbHost,
    dbPort,
    nodeEnv: process.env.NODE_ENV,
    demoModeValue: demoMode ?? "not set",
    demoModeIsTrue: demoMode === "true",
  });
}
