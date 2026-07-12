import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const QIWA_API_BASE = process.env.QIWA_ENVIRONMENT === "production"
  ? "https://api.qiwa.sa"
  : "https://sandbox-api.qiwa.sa";

const QIWA_CONFIG = {
  clientId: process.env.QIWA_CLIENT_ID ?? "",
  clientSecret: process.env.QIWA_CLIENT_SECRET ?? "",
  baseUrl: QIWA_API_BASE,
};

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  if (!QIWA_CONFIG.clientId || !QIWA_CONFIG.clientSecret) {
    throw new Error("Qiwa credentials not configured");
  }

  const response = await fetch(`${QIWA_CONFIG.baseUrl}/api/v2/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: QIWA_CONFIG.clientId,
      client_secret: QIWA_CONFIG.clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Qiwa auth failed: ${response.status} - ${error}`);
  }

  const data = await response.json() as { access_token: string; expires_in: number };
  if (!data.access_token) {
    throw new Error("No access token received");
  }
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;

  return cachedToken;
}

function getHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${cachedToken ?? ""}`,
    "Content-Type": "application/json",
  };
}

export async function POST(request: NextRequest) {
  try {
    const token = await getAccessToken();
    const body = await request.json();

    const response = await fetch(`${QIWA_CONFIG.baseUrl}/api/v2/employees`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = await getAccessToken();
    const url = new URL(request.url);
    const employeeId = url.searchParams.get("id");

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID required" }, { status: 400 });
    }

    const body = await request.json();

    const response = await fetch(`${QIWA_CONFIG.baseUrl}/api/v2/employees/${employeeId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = await getAccessToken();
    const url = new URL(request.url);
    const employeeId = url.searchParams.get("id");

    if (employeeId) {
      const response = await fetch(`${QIWA_CONFIG.baseUrl}/api/v2/employees/${employeeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 404) {
        return NextResponse.json({ employee: null });
      }

      const data = await response.json();
      return NextResponse.json({ employee: data });
    }

    const response = await fetch(`${QIWA_CONFIG.baseUrl}/api/v2/employees`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}