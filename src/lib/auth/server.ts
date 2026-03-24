import type { NextRequest } from "next/server";

function assertAuthEnv() {
  if (!process.env.NEON_AUTH_BASE_URL) {
    throw new Error(
      "Missing environment variable: NEON_AUTH_BASE_URL. Configure Neon Auth before using server-side auth helpers.",
    );
  }
}

export async function getAuthServer() {
  assertAuthEnv();
  const { createAuthServer } = await import("@neondatabase/auth/next/server");
  return createAuthServer();
}

export async function handleAuthRoute(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!process.env.NEON_AUTH_BASE_URL) {
    return Response.json(
      {
        error:
          "Missing NEON_AUTH_BASE_URL. Copy .env.example to .env.local and configure Neon Auth.",
      },
      { status: 500 },
    );
  }

  const { authApiHandler } = await import("@neondatabase/auth/next/server");
  const handler = authApiHandler();
  return handler[method](request, context);
}

export async function runAuthMiddleware(
  request: NextRequest,
  loginUrl = "/auth/sign-in",
) {
  if (!process.env.NEON_AUTH_BASE_URL) {
    const { NextResponse } = await import("next/server");
    return NextResponse.next();
  }

  const { neonAuthMiddleware } = await import("@neondatabase/auth/next/server");
  return neonAuthMiddleware({ loginUrl })(request);
}
