import type { NextRequest } from "next/server";
import { runAuthMiddleware } from "@/lib/auth/server";

export default function proxy(request: NextRequest) {
  return runAuthMiddleware(request, "/auth/sign-in");
}

export const config = {
  matcher: ["/dashboard/:path*", "/account/:path*"],
};
