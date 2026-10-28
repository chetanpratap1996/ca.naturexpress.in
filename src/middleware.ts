import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { UserRole } from "@/lib/auth/session";

function allowedRoles(pathname: string, method: string, action?: string): UserRole[] {
  if (pathname === "/api/session" || pathname === "/api/data") return ["PARTNER", "ARTICLE", "CLIENT"];
  if (pathname === "/api/clients") return method === "GET" ? ["PARTNER", "ARTICLE", "CLIENT"] : ["PARTNER"];
  // Client task reads are served through the strictly scoped /api/data projection.
  if (pathname === "/api/tasks") return method === "GET" ? ["PARTNER", "ARTICLE"] : ["PARTNER", "ARTICLE"];
  if (pathname === "/api/documents") return method === "GET" || method === "POST" ? ["PARTNER", "ARTICLE", "CLIENT"] : ["PARTNER", "ARTICLE"];
  if (pathname === "/api/invoices") {
    if (method === "GET") return ["PARTNER", "ARTICLE", "CLIENT"];
    if (method === "POST") return ["PARTNER"];
    if (method === "PATCH" && action === "SUBMIT_UTR") return ["CLIENT"];
    if (method === "PATCH" && action === "RECONCILE") return ["PARTNER"];
    return [];
  }
  if (pathname === "/api/dsc") return method === "GET" ? ["PARTNER", "ARTICLE"] : ["PARTNER"];
  if (pathname === "/api/pay-to-release") return method === "GET" ? ["PARTNER", "CLIENT"] : ["PARTNER"];
  if (pathname === "/api/portal-sync") return ["PARTNER"];
  if (pathname === "/api/audit-trail") return ["PARTNER"];
  if (pathname === "/api/audit/peer-review") {
    if (action === "SIGN_OFF_PEER_REVIEW_DOSSIER") return ["PARTNER"];
    return ["PARTNER", "ARTICLE"];
  }
  if (pathname === "/api/analytics/partner-realization") return ["PARTNER"];
  if (pathname === "/api/whatsapp/parser") return ["PARTNER", "ARTICLE"];
  return ["PARTNER", "ARTICLE", "CLIENT"];
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = await createClient(request);

  if (pathname.startsWith("/api/")) {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || !auth.role) {
      return NextResponse.json(
        { success: false, error: "Authentication required.", code: "AUTH_REQUIRED" },
        { status: 401 },
      );
    }

    let action: string | undefined;
    if (request.method === "POST" || request.method === "PATCH") {
      try {
        const body = await request.clone().json();
        action = typeof body?.action === "string" ? body.action : undefined;
      } catch {
        // Route handlers return the appropriate malformed-body response.
      }
    }

    const allowed = allowedRoles(pathname, request.method, action);
    if (!allowed.includes(auth.role)) {
      return NextResponse.json(
        { success: false, error: "This action is not permitted for your role.", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    // These handlers still depend on process-local JSON. Fail closed in production
    // until each workflow is migrated to Supabase-backed persistence.
    const localFileBackedRoutes = new Set([
      "/api/pay-to-release",
      "/api/portal-sync",
      "/api/audit/peer-review",
      "/api/analytics/partner-realization",
      "/api/whatsapp/parser",
    ]);
    if (process.env.NODE_ENV === "production" && localFileBackedRoutes.has(pathname)) {
      return NextResponse.json(
        { success: false, error: "This workflow is temporarily unavailable until its Supabase storage migration is applied.", code: "DURABLE_STORAGE_REQUIRED" },
        { status: 503 },
      );
    }
  }

  if (pathname.startsWith("/admin")) {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || auth.role !== "PARTNER") {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("auth_required", "admin");
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
