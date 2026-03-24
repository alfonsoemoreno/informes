import { handleAuthRoute } from "@/lib/auth/server";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export function GET(request: Request, context: RouteContext) {
  return handleAuthRoute("GET", request, context);
}

export function POST(request: Request, context: RouteContext) {
  return handleAuthRoute("POST", request, context);
}

export function PUT(request: Request, context: RouteContext) {
  return handleAuthRoute("PUT", request, context);
}

export function DELETE(request: Request, context: RouteContext) {
  return handleAuthRoute("DELETE", request, context);
}

export function PATCH(request: Request, context: RouteContext) {
  return handleAuthRoute("PATCH", request, context);
}
